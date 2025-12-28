// Serverless function for Vercel - Proxy endpoint
// Streams files from Terabox to bypass CORS and support range requests

import axios from 'axios';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { url, file_name } = req.query;

        if (!url) {
            return res.status(400).json({ error: 'Missing required parameter: url' });
        }

        const decodedUrl = decodeURIComponent(url);
        const fileName = file_name ? decodeURIComponent(file_name) : 'download';

        // Prepare headers for Terabox request
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.terabox.com/',
            'Accept': '*/*',
        };

        // Handle range requests for video streaming
        if (req.headers.range) {
            headers['Range'] = req.headers.range;
        }

        // Make request to Terabox
        const response = await axios({
            method: 'GET',
            url: decodedUrl,
            headers: headers,
            responseType: 'stream',
            validateStatus: (status) => status < 500, // Accept 206 for partial content
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

        // Stream the response
        response.data.pipe(res);

        // Handle errors during streaming
        response.data.on('error', (error) => {
            console.error('Stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error streaming file' });
            }
        });

    } catch (error) {
        console.error('Proxy error:', error.message);

        if (!res.headersSent) {
            res.status(500).json({
                error: error.message || 'Failed to proxy file'
            });
        }
    }
}

// Increase timeout for large file downloads (Vercel limit is 60s for Hobby plan)
export const config = {
    api: {
        responseLimit: false,
    },
};
