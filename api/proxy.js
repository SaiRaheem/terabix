// Serverless function for Vercel - Proxy endpoint
// Handles streaming downloads from Terabox with proper headers

const axios = require('axios');

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow GET
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { url, file_name } = req.query;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameter: url'
            });
        }

        const fileName = file_name || 'download';

        // Get range header if present
        const range = req.headers.range;

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.terabox.com/',
            'Accept': '*/*',
        };

        if (range) {
            headers['Range'] = range;
        }

        // Stream the file
        const response = await axios({
            method: 'GET',
            url: decodeURIComponent(url),
            headers: headers,
            responseType: 'stream',
            timeout: 60000, // 60 second timeout for downloads
        });

        // Set response headers
        res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

        if (response.headers['content-length']) {
            res.setHeader('Content-Length', response.headers['content-length']);
        }

        if (response.headers['content-range']) {
            res.setHeader('Content-Range', response.headers['content-range']);
            res.setHeader('Accept-Ranges', 'bytes');
            res.status(206); // Partial Content
        } else {
            res.setHeader('Accept-Ranges', 'bytes');
            res.status(200);
        }

        // Pipe the response
        response.data.pipe(res);

        // Handle errors
        response.data.on('error', (error) => {
            console.error('Stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    error: 'Error streaming file'
                });
            }
        });

    } catch (error) {
        console.error('Proxy error:', error.message);

        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                error: error.message || 'Failed to proxy download'
            });
        }
    }
};
