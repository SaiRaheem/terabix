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

// Rate limiting map
const rateLimitMap = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60000;

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

    try {
        const { link, cookies } = req.body;

        if (!link || !cookies) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: link and cookies'
            });
        }

        // Rate limiting
        const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
        if (!checkRateLimit(clientIp)) {
            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded. Please try again later.'
            });
        }

        // Extract surl from link
        const surl = extractSurl(link);
        console.log('Extracted surl:', surl);

        // Detect the domain from the link
        const linkUrl = new URL(link);
        const baseDomain = linkUrl.hostname;
        const apiDomain = baseDomain.replace('www.', '');
        console.log('Using domain:', apiDomain);

        // Ensure cookie has proper format
        const cookieString = cookies.includes('ndus=') ? cookies : `ndus=${cookies}`;

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Cookie': cookieString,
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': `https://${apiDomain}/sharing/link?surl=${surl}`,
            'Origin': `https://${apiDomain}`,
        };

        console.log('Fetching file list directly...');
        const listUrl = `https://${apiDomain}/share/list`;
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
            _: Date.now(),
        };

        const enhancedHeaders = {
            ...headers,
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
        };

        const listResponse = await axios.get(listUrl, {
            params: listParams,
            headers: enhancedHeaders,
            timeout: 50000,
        });

        console.log('List response errno:', listResponse.data.errno);

        if (listResponse.data.errno !== 0) {
            return res.status(400).json({
                success: false,
                error: `Terabox API error: ${listResponse.data.errmsg || listResponse.data.errno || 'Unknown error'}`,
                debug: {
                    errno: listResponse.data.errno,
                    errmsg: listResponse.data.errmsg
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
            const file = fileList[0];

            const downloadUrl = `https://${apiDomain}/share/download`;
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
                headers: enhancedHeaders,
                timeout: 50000,
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
}
