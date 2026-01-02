import axios from 'axios';
import https from 'https';

// Force Node.js runtime
export const config = {
    runtime: 'nodejs'
};

// Disable keep-alive to prevent socket hang up errors
const httpsAgent = new https.Agent({
    keepAlive: false,
    timeout: 60000
});

// Set axios defaults for large responses
axios.defaults.maxContentLength = Infinity;
axios.defaults.maxBodyLength = Infinity;

// Helper function to extract surl from various Terabox URL formats
function extractSurl(link) {
    try {
        const url = new URL(link);
        let surl = url.pathname.split('/s/')[1];
        if (surl) {
            surl = surl.split('?')[0]; // Remove query params
            // Strip leading '1' that some domains add (1024terabox.com)
            if (surl.startsWith('1')) {
                surl = surl.slice(1);
            }
            return surl;
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

// Retry helper with exponential backoff
async function withRetry(fn, retries = 3) {
    try {
        return await fn();
    } catch (err) {
        if (retries === 0) throw err;

        // Only retry on network errors, not API errors
        const shouldRetry = err.code === 'ECONNRESET' ||
            err.code === 'ETIMEDOUT' ||
            err.code === 'ECONNREFUSED' ||
            err.code === 'EPIPE';

        if (!shouldRetry) throw err;

        const delay = 500 * (4 - retries); // 500ms, 1000ms, 1500ms
        console.log(`Retry attempt ${4 - retries} after ${delay}ms due to ${err.code}`);
        await new Promise(r => setTimeout(r, delay));
        return withRetry(fn, retries - 1);
    }
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

        // Use canonical Terabox domain (all links redirect here)
        const apiDomain = 'www.terabox.app';
        console.log('Using canonical domain:', apiDomain);

        // Use cookies as-is (terabox.app doesn't use ndus cookie)
        const cookieString = cookies;

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
            shorturl: surl,
            root: '1',
        };

        const enhancedHeaders = {
            ...headers,
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Connection': 'close',
        };

        const listResponse = await withRetry(() =>
            axios.get(listUrl, {
                params: listParams,
                headers: enhancedHeaders,
                httpsAgent: httpsAgent,
                timeout: 50000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            })
        );

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

        // Log full file object to see what's available
        console.log('Full file object:', JSON.stringify(fileList[0], null, 2));

        // Check if it's a folder (multiple files) or single file
        if (fileList.length === 1) {
            const file = fileList[0];

            // Try to get download link from server
            const downloadUrl = `https://${apiDomain}/share/download`;
            const downloadParams = {
                shorturl: surl,
                fid_list: `[${file.fs_id}]`,
                sign: '',
                timestamp: Math.floor(Date.now() / 1000),
                devuid: '',
                clienttype: '0',
                app_id: '250',
                web: '1',
                channel: 'dubox',
            };

            const downloadResponse = await withRetry(() =>
                axios.get(downloadUrl, {
                    params: downloadParams,
                    headers: enhancedHeaders,
                    httpsAgent: httpsAgent,
                    timeout: 50000,
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                })
            );

            // Extract streaming URL if available (for videos)
            let streamingUrl = null;
            if (file.category === 1 || file.category === 3) { // Video or audio
                // Try different streaming URL formats
                streamingUrl = file.dlink || file.thumbs?.url4 || file.thumbs?.url3;

                // Some files have a 'streaming_url' or 'preview_url'
                if (file.streaming_url) streamingUrl = file.streaming_url;
                if (file.preview_url) streamingUrl = file.preview_url;
            }

            if (downloadResponse.data.errno !== 0) {
                const errorMsg = downloadResponse.data.errmsg || 'Unknown error';

                // Special handling for CAPTCHA verification - return file details anyway
                if (errorMsg.includes('verify') || errorMsg.includes('captcha')) {
                    return res.status(200).json({
                        success: true,
                        requiresVerification: true,
                        data: {
                            file_name: file.server_filename,
                            file_size: formatFileSize(file.size),
                            size_bytes: file.size,
                            download_link: null,
                            streaming_url: streamingUrl,
                            isFolder: false,
                            category: file.category, // 1=video, 2=audio, 3=image, 4=doc
                            thumbnail: file.thumbs?.url3 || file.thumbs?.url2 || file.thumbs?.url1 || null,
                        },
                        message: 'File details retrieved. Download requires manual verification.',
                        shareLink: `https://${apiDomain}/sharing/link?surl=${surl}`
                    });
                }

                return res.status(400).json({
                    success: false,
                    error: `Failed to get download link: ${errorMsg}`
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
                    file_name: file.server_filename,
                    file_size: formatFileSize(file.size),
                    size_bytes: file.size,
                    download_link: downloadLink,
                    isFolder: false,
                    thumbnail: file.thumbs?.url3 || null,
                }
            });
        } else {
            const files = fileList.map(file => ({
                file_name: file.server_filename,
                file_size: formatFileSize(file.size),
                size_bytes: file.size,
                fs_id: file.fs_id,
                isdir: file.isdir,
                thumbnail: file.thumbs?.url3 || null,
            }));

            return res.status(200).json({
                success: true,
                data: {
                    isFolder: true,
                    folder_name: 'Shared Folder',
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

        if (error.code === 'ECONNRESET') {
            errorMessage = 'Connection reset by Terabox (socket hang up). Please retry.';
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Cannot connect to Terabox servers. Please check your internet connection.';
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
            errorMessage = 'Request timed out. Terabox servers may be slow or unreachable.';
        } else if (error.code === 'ENOTFOUND') {
            errorMessage = 'Cannot resolve Terabox domain. Please check your DNS settings.';
        } else if (error.code === 'EPIPE') {
            errorMessage = 'Broken pipe - connection closed unexpectedly. Please retry.';
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
