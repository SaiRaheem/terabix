/**
 * Extension helper for Terabox Downloader
 * Detects if extension is installed and uses it to get download links
 */

let extensionInstalled = false;
let pendingRequests = new Map();
let requestIdCounter = 0;

// Listen for extension ready message
window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return;

    if (event.data.type === 'TERABOX_EXTENSION_READY') {
        extensionInstalled = true;
        console.log('✅ Terabox Extension detected and ready!');
    }

    if (event.data.type === 'TERABOX_DOWNLOAD_LINK_RESPONSE') {
        const { requestId, success, data, error } = event.data;
        const pending = pendingRequests.get(requestId);

        if (pending) {
            if (success) {
                pending.resolve(data);
            } else {
                pending.reject(new Error(error || 'Extension request failed'));
            }
            pendingRequests.delete(requestId);
        }
    }

    if (event.data.type === 'TERABOX_COOKIES_RESPONSE') {
        const { requestId, success, cookies, error } = event.data;
        const pending = pendingRequests.get(requestId);

        if (pending) {
            if (success) {
                pending.resolve(cookies);
            } else {
                pending.reject(new Error(error || 'Failed to get cookies'));
            }
            pendingRequests.delete(requestId);
        }
    }
});

/**
 * Check if extension is installed
 */
export function isExtensionInstalled(): boolean {
    return extensionInstalled || (window as any).TERABOX_EXTENSION_INSTALLED === true;
}

/**
 * Get download link using extension
 */
export async function getDownloadLinkViaExtension(
    surl: string,
    fs_id: number | string,
    domain: string = 'www.terabox.app'
): Promise<string> {
    if (!isExtensionInstalled()) {
        throw new Error('Extension not installed');
    }

    const requestId = ++requestIdCounter;

    return new Promise((resolve, reject) => {
        // Store promise handlers
        pendingRequests.set(requestId, { resolve, reject });

        // Send request to extension
        window.postMessage({
            type: 'TERABOX_GET_DOWNLOAD_LINK',
            requestId,
            payload: { surl, fs_id: Number(fs_id), domain }
        }, window.location.origin);

        // Timeout after 30 seconds
        setTimeout(() => {
            if (pendingRequests.has(requestId)) {
                pendingRequests.delete(requestId);
                reject(new Error('Extension request timeout'));
            }
        }, 30000);
    });
}

/**
 * Get cookies using extension
 */
export async function getCookiesViaExtension(domain: string = 'www.terabox.app'): Promise<string> {
    if (!isExtensionInstalled()) {
        throw new Error('Extension not installed');
    }

    const requestId = ++requestIdCounter;

    return new Promise((resolve, reject) => {
        pendingRequests.set(requestId, { resolve, reject });

        window.postMessage({
            type: 'TERABOX_GET_COOKIES',
            requestId,
            domain
        }, window.location.origin);

        setTimeout(() => {
            if (pendingRequests.has(requestId)) {
                pendingRequests.delete(requestId);
                reject(new Error('Extension request timeout'));
            }
        }, 10000);
    });
}
