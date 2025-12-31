// Force Node.js runtime for streaming support
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import axios from 'axios';

export async function GET(request) {
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Range',
    };

    try {
        const { searchParams } = new URL(request.url);
        const url = searchParams.get('url');
        const file_name = searchParams.get('file_name') || 'download';

        if (!url) {
            return Response.json(
                { success: false, error: 'Missing required parameter: url' },
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Get range header if present
        const range = request.headers.get('range');

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
            timeout: 60000,
        });

        // Set response headers
        const responseHeaders = {
            ...corsHeaders,
            'Content-Type': response.headers['content-type'] || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${file_name}"`,
        };

        if (response.headers['content-length']) {
            responseHeaders['Content-Length'] = response.headers['content-length'];
        }

        if (response.headers['content-range']) {
            responseHeaders['Content-Range'] = response.headers['content-range'];
            responseHeaders['Accept-Ranges'] = 'bytes';
        } else {
            responseHeaders['Accept-Ranges'] = 'bytes';
        }

        const status = response.headers['content-range'] ? 206 : 200;

        // Convert axios stream to Web Stream
        const stream = new ReadableStream({
            start(controller) {
                response.data.on('data', (chunk) => {
                    controller.enqueue(chunk);
                });
                response.data.on('end', () => {
                    controller.close();
                });
                response.data.on('error', (error) => {
                    console.error('Stream error:', error);
                    controller.error(error);
                });
            }
        });

        return new Response(stream, {
            status,
            headers: responseHeaders,
        });

    } catch (error) {
        console.error('Proxy error:', error.message);

        return Response.json(
            { success: false, error: error.message || 'Failed to proxy download' },
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Range',
        },
    });
}
