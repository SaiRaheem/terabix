// Content script injected into terabix-rose.vercel.app

console.log('Terabox Downloader Extension content script loaded');

// Inject a global flag to let the web app know the extension is installed
window.TERABOX_EXTENSION_INSTALLED = true;

// Listen for messages from the web app
window.addEventListener('message', async (event) => {
    // Only accept messages from same origin
    if (event.origin !== window.location.origin) return;

    if (event.data.type === 'TERABOX_GET_DOWNLOAD_LINK') {
        console.log('Received download link request:', event.data);

        try {
            // Forward request to background script
            const response = await chrome.runtime.sendMessage({
                action: 'getDownloadLink',
                data: event.data.payload
            });

            // Send response back to web app
            window.postMessage({
                type: 'TERABOX_DOWNLOAD_LINK_RESPONSE',
                requestId: event.data.requestId,
                success: response.success,
                data: response.data,
                error: response.error
            }, window.location.origin);

        } catch (error) {
            console.error('Extension error:', error);
            window.postMessage({
                type: 'TERABOX_DOWNLOAD_LINK_RESPONSE',
                requestId: event.data.requestId,
                success: false,
                error: error.message
            }, window.location.origin);
        }
    }

    if (event.data.type === 'TERABOX_GET_COOKIES') {
        console.log('Received cookies request:', event.data);

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'getCookies',
                domain: event.data.domain || 'www.terabox.app'
            });

            window.postMessage({
                type: 'TERABOX_COOKIES_RESPONSE',
                requestId: event.data.requestId,
                success: response.success,
                cookies: response.cookies,
                error: response.error
            }, window.location.origin);

        } catch (error) {
            console.error('Extension error:', error);
            window.postMessage({
                type: 'TERABOX_COOKIES_RESPONSE',
                requestId: event.data.requestId,
                success: false,
                error: error.message
            }, window.location.origin);
        }
    }
});

// Notify web app that extension is ready
window.postMessage({
    type: 'TERABOX_EXTENSION_READY'
}, window.location.origin);
