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

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

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

        // Step 1: Initialize share and get tokens
        const initUrl = `https://www.terabox.com/share/init?surl=${surl}`;
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Cookie': cookies,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://www.terabox.com/',
        };

        // Axios configuration with timeout and SSL handling
        const axiosConfig = {
            headers,
            timeout: 30000, // 30 second timeout
            maxRedirects: 5,
            validateStatus: (status) => status < 500, // Accept any status < 500
        };

        console.log('Fetching init URL:', initUrl);
        const initResponse = await axios.get(initUrl, axiosConfig);
        console.log('Init response status:', initResponse.status);

        const initData = extractDataFromHtml(initResponse.data);

        if (!initData.bdstoken || !initData.uk || !initData.shareid) {
            return res.status(400).json({
                success: false,
                error: 'Failed to initialize share. Cookie may be expired or invalid.'
            });
        }

        console.log('Init data:', initData);

        // Step 2: Get file list
        const listUrl = 'https://www.terabox.com/share/list';
        const listParams = {
            app_id: '250',
            channel: 'dubox',
            clienttype: '0',
            web: '1',
            'dp-logid': initData.logid,
            shorturl: surl,
            root: '1',
            dir: '/',
            num: '100',
            page: '1',
            order: 'time',
            desc: '1',
        };

        const listResponse = await axios.get(listUrl, {
            params: listParams,
            headers: {
                ...headers,
                'Accept': 'application/json, text/plain, */*',
            }
        });

        if (listResponse.data.errno !== 0) {
            return res.status(400).json({
                success: false,
                error: `Terabox API error: ${listResponse.data.errno}`
            });
        }

        const fileList = listResponse.data.list || [];
        if (fileList.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No files found in share'
            });
        }

        console.log('File list:', fileList.length, 'files');

        // Step 3: Get download link for first file (or handle folder)
        const firstFile = fileList[0];

        // If it's a folder, return list of files
        if (firstFile.isdir === 1) {
            const folderFiles = fileList.map(file => ({
                file_name: file.server_filename,
                file_size: formatFileSize(file.size),
                size_bytes: file.size,
                thumbnail: file.thumbs?.url3 || file.thumbs?.url2 || file.thumbs?.url1,
                fs_id: file.fs_id,
                isdir: file.isdir,
                download_link: '', // Will need separate request for each
            }));

            return res.status(200).json({
                success: true,
                data: {
                    folder_name: firstFile.server_filename,
                    files: folderFiles,
                }
            });
        }

        // Get direct download link
        const timestamp = Math.floor(Date.now() / 1000);
        const downloadUrl = 'https://www.terabox.com/share/download';
        const downloadParams = {
            app_id: '250',
            channel: 'dubox',
            clienttype: '0',
            web: '1',
            sign: initData.bdstoken,
            timestamp: timestamp,
            fid_list: `[${firstFile.fs_id}]`,
            primaryid: initData.shareid,
            uk: initData.uk,
            vip: '0',
            type: 'dlink',
        };

        const downloadResponse = await axios.get(downloadUrl, {
            params: downloadParams,
            headers: {
                ...headers,
                'Accept': 'application/json, text/plain, */*',
            }
        });

        console.log('Download response:', downloadResponse.data);

        if (downloadResponse.data.errno !== 0) {
            return res.status(400).json({
                success: false,
                error: `Failed to get download link. Error code: ${downloadResponse.data.errno}`
            });
        }

        const dlink = downloadResponse.data.dlink || downloadResponse.data.list?.[0]?.dlink;

        if (!dlink) {
            return res.status(400).json({
                success: false,
                error: 'Download link not found in response'
            });
        }

        // Return file metadata with download link
        const fileData = {
            file_name: firstFile.server_filename,
            file_size: formatFileSize(firstFile.size),
            size_bytes: firstFile.size,
            thumbnail: firstFile.thumbs?.url3 || firstFile.thumbs?.url2 || firstFile.thumbs?.url1,
            download_link: dlink,
            proxy_url: `/api/proxy?url=${encodeURIComponent(dlink)}&file_name=${encodeURIComponent(firstFile.server_filename)}`,
        };

        return res.status(200).json({
            success: true,
            data: fileData,
        });

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
