// Background service worker for Terabox Downloader Extension

console.log('Terabox Downloader Extension loaded');

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getDownloadLink') {
        handleGetDownloadLink(request.data)
            .then(result => sendResponse({ success: true, data: result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep channel open for async response
    }

    if (request.action === 'getCookies') {
        handleGetCookies(request.domain)
            .then(cookies => sendResponse({ success: true, cookies }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});

/**
 * Get download link from Terabox using extension's cookie access
 */
async function handleGetDownloadLink({ surl, fs_id, domain = 'www.terabox.app' }) {
    try {
        console.log('Getting download link for:', { surl, fs_id, domain });

        // Get cookies for Terabox domain
        const cookies = await chrome.cookies.getAll({ domain: `.${domain}` });
        const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

        console.log('Found cookies:', cookies.length);

        // Make request to Terabox download API
        const downloadUrl = `https://${domain}/share/download?shorturl=${surl}&fid_list=[${fs_id}]&sign=&timestamp=${Math.floor(Date.now() / 1000)}&devuid=&clienttype=0&app_id=250&web=1&channel=dubox`;

        const response = await fetch(downloadUrl, {
            method: 'GET',
            headers: {
                'Cookie': cookieString,
                'Referer': `https://${domain}/sharing/link?surl=${surl}`,
                'Origin': `https://${domain}`,
                'User-Agent': navigator.userAgent,
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            credentials: 'include'
        });

        const data = await response.json();
        console.log('Terabox response:', data);

        if (data.errno === 0) {
            const downloadLink = data.dlink || data.list?.[0]?.dlink;
            if (!downloadLink) {
                throw new Error('No download link in response');
            }
            return { downloadLink };
        } else {
            throw new Error(data.errmsg || `Terabox error: ${data.errno}`);
        }
    } catch (error) {
        console.error('Error getting download link:', error);
        throw error;
    }
}

/**
 * Get all cookies from ALL Terabox domains
 */
async function handleGetCookies(domain) {
    try {
        console.log('Getting cookies for domain:', domain);

        // Check multiple Terabox domains
        const domains = [
            domain,                      // www.terabox.app
            `.${domain}`,                // .terabox.app
            '1024terabox.com',           // 1024terabox.com
            '.1024terabox.com',          // .1024terabox.com
            'dm.1024terabox.com',        // dm.1024terabox.com
            'terabox.com',               // terabox.com
            '.terabox.com',              // .terabox.com
            'dm.terabox.app',            // dm.terabox.app
        ];

        let allCookies = [];

        // Get cookies from all domains
        for (const d of domains) {
            try {
                const cookies = await chrome.cookies.getAll({ domain: d });
                if (cookies.length > 0) {
                    console.log(`Found ${cookies.length} cookies on ${d}:`, cookies.map(c => c.name));
                    allCookies.push(...cookies);
                }
            } catch (err) {
                // Ignore errors for individual domains
            }
        }

        // Deduplicate by cookie name (keep the first occurrence)
        const uniqueCookies = Array.from(new Map(allCookies.map(c => [c.name, c])).values());

        console.log('Total unique cookies found:', uniqueCookies.length, uniqueCookies.map(c => c.name));

        const cookieString = uniqueCookies.map(c => `${c.name}=${c.value}`).join('; ');
        console.log('Final cookie string length:', cookieString.length);

        return cookieString;
    } catch (error) {
        console.error('Error getting cookies:', error);
        throw error;
    }
}

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Terabox Downloader Extension installed!');
        // Open welcome page
        chrome.tabs.create({ url: 'https://terabix-rose.vercel.app' });
    }
});
