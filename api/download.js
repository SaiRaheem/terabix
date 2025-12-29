// Serverless function for Vercel - Download endpoint
// Handles Terabox link parsing and direct download link generation

import axios from 'axios';

// Helper function to extract surl from various Terabox URL formats
function extractSurl(link) {
    try {
        const url = new URL(link);
        const pathMatch = url.pathname.match(/\/s\/(.+)/);
        if (pathMatch && pathMatch[1]) {
            return pathMatch[1];
        }
        throw new Error('Invalid Terabox link format');
    } catch (error) {
        throw new Error('Invalid URL format');
    }
}

// Helper function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Helper function to parse HTML and extract data
function extractDataFromHtml(html) {
    const data = {};

    // Extract bdstoken
    const bdstokenMatch = html.match(/bdstoken["']?\s*[:=]\s*["']([^"']+)["']/);
    if (bdstokenMatch) data.bdstoken = bdstokenMatch[1];

    // Extract logid
    const logidMatch = html.match(/logid["']?\s*[:=]\s*["']([^"']+)["']/);
    if (logidMatch) data.logid = logidMatch[1];

    // Extract uk
    const ukMatch = html.match(/uk["']?\s*[:=]\s*["']?(\d+)["']?/);
    if (ukMatch) data.uk = ukMatch[1];

    // Extract shareid
    const shareidMatch = html.match(/shareid["']?\s*[:=]\s*["']?(\d+)["']?/);
    if (shareidMatch) data.shareid = shareidMatch[1];

    // Extract share_uk (sometimes different from uk)
    const shareUkMatch = html.match(/share_uk["']?\s*[:=]\s*["']?(\d+)["']?/);
    if (shareUkMatch) data.share_uk = shareUkMatch[1];

    return data;
}

// Rate limiting map (simple in-memory, resets on cold start)
const rateLimitMap = new Map();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(ip) {
    const now = Date.now();
    const userRequests = rateLimitMap.get(ip) || [];
    const recentRequests = userRequests.filter(time => now - time < RATE_WINDOW);

    if (recentRequests.length >= RATE_LIMIT) {
        return false;
    }

    recentRequests.push(now);
    rateLimitMap.set(ip, recentRequests);
    return true;
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // Rate limiting
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    if (!checkRateLimit(clientIp)) {
        return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded. Please try again later.'
        });
    }

    try {
        const { link, cookies } = req.body;

        if (!link || !cookies) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: link and cookies'
            });
        }

        // Extract surl from link
        const surl = extractSurl(link);
        console.log('Extracted surl:', surl);

        // Ensure cookie has proper format
        const cookieString = cookies.includes('ndus=') ? cookies : `ndus=${cookies}`;

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Cookie': cookieString,
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': `https://www.terabox.com/sharing/link?surl=${surl}`,
            'Origin': 'https://www.terabox.com',
        };

        // First, visit the share page to get jsToken
        console.log('Visiting share page to get jsToken...');
        const sharePageUrl = `https://www.terabox.com/sharing/link?surl=${surl}`;
        const sharePageResponse = await axios.get(sharePageUrl, {
            headers: {
                ...headers,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            },
            timeout: 30000,
        });

        // Extract jsToken from the page
        let jsToken = '';
        const jsTokenMatch = sharePageResponse.data.match(/jsToken["\s:]+["']([^"']+)["']/);
        if (jsTokenMatch) {
            jsToken = jsTokenMatch[1];
            console.log('Found jsToken:', jsToken);
        }

        // Get file list
        const listUrl = 'https://www.terabox.com/share/list';
        const listParams = {
            app_id: '250',
            channel: 'dubox',
            clienttype: '0',
            web: '1',
            shorturl: surl,
            root: '1',
            dir: '/',
            num: '100',
            page: '1',
            order: 'time',
            desc: '1',
        };

        if (jsToken) {
            listParams.jsToken = jsToken;
        }

        console.log('Fetching file list...');
        const listResponse = await axios.get(listUrl, {
            params: listParams,
            headers,
            timeout: 30000,
        });

        console.log('List response errno:', listResponse.data.errno);

        if (listResponse.data.errno !== 0) {
            return res.status(400).json({
                success: false,
                error: `Terabox API error: ${listResponse.data.errmsg || listResponse.data.errno || 'Unknown error'}`,
                debug: {
                    errno: listResponse.data.errno,
                    errmsg: listResponse.data.errmsg,
                    hasJsToken: !!jsToken
                }
            });
        }

        const fileList = listResponse.data.list || [];

        if (fileList.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No files found in the shared link'
            });
        }

        // Check if it's a folder (multiple files) or single file
        if (fileList.length === 1) {
            // Single file
            const file = fileList[0];

            // Step 3: Get direct download link
            const downloadUrl = 'https://www.terabox.com/share/download';
            const downloadParams = {
                app_id: '250',
                channel: 'dubox',
                clienttype: '0',
                web: '1',
                shorturl: surl,
                fid_list: `[${file.fs_id}]`,
            };

            const downloadResponse = await axios.get(downloadUrl, {
                params: downloadParams,
                headers,
                timeout: 30000,
            });

            if (downloadResponse.data.errno !== 0) {
                return res.status(400).json({
                    success: false,
                    error: `Failed to get download link: ${downloadResponse.data.errmsg || 'Unknown error'}`
                });
            }

            const downloadLink = downloadResponse.data.dlink || downloadResponse.data.list?.[0]?.dlink;

            if (!downloadLink) {
                return res.status(400).json({
                    success: false,
                    error: 'Could not retrieve download link. The file may require PC client download.'
                });
            }

            // Return single file metadata
            return res.status(200).json({
                success: true,
                data: {
                    fileName: file.server_filename,
                    fileSize: formatFileSize(file.size),
                    fileSizeBytes: file.size,
                    downloadLink: downloadLink,
                    isFolder: false,
                    thumbUrl: file.thumbs?.url3 || null,
                }
            });
        } else {
            // Multiple files (folder)
            const files = fileList.map(file => ({
                fileName: file.server_filename,
                fileSize: formatFileSize(file.size),
                fileSizeBytes: file.size,
                fsId: file.fs_id,
                isDir: file.isdir === 1,
                thumbUrl: file.thumbs?.url3 || null,
            }));

            return res.status(200).json({
                success: true,
                data: {
                    isFolder: true,
                    folderName: 'Shared Folder',
                    totalFiles: files.length,
                    files: files,
                    // Note: For folders, individual file download links need to be fetched separately
                    message: 'This is a folder share. Download links for individual files need to be fetched separately.'
                }
            });
        }

    } catch (error) {
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack,
            response: error.response?.data,
            status: error.response?.status
        });

        let errorMessage = 'Internal server error';

        if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Cannot connect to Terabox servers. Please check your internet connection.';
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
            errorMessage = 'Request timed out. Terabox servers may be slow or unreachable.';
        } else if (error.code === 'ENOTFOUND') {
            errorMessage = 'Cannot resolve Terabox domain. Please check your DNS settings.';
        } else if (error.response) {
            errorMessage = error.response.data?.errmsg || `Terabox returned error: ${error.response.status}`;
        } else if (error.message) {
            errorMessage = error.message;
        }

        return res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
};
