// Popup script

document.getElementById('testBtn').addEventListener('click', async () => {
    const statusEl = document.getElementById('status');
    statusEl.textContent = '🔄 Testing extension...';
    statusEl.className = 'status';

    try {
        // Test cookie access
        const cookies = await chrome.cookies.getAll({ domain: '.terabox.app' });

        if (cookies.length > 0) {
            statusEl.textContent = `✅ Extension working! Found ${cookies.length} cookies for Terabox`;
            statusEl.className = 'status success';
        } else {
            statusEl.textContent = '⚠️ No Terabox cookies found. Please visit terabox.app first.';
            statusEl.className = 'status';
        }
    } catch (error) {
        statusEl.textContent = `❌ Error: ${error.message}`;
        statusEl.className = 'status';
    }
});

// Check status on load
window.addEventListener('load', async () => {
    try {
        const cookies = await chrome.cookies.getAll({ domain: '.terabox.app' });
        const statusEl = document.getElementById('status');

        if (cookies.length > 0) {
            statusEl.textContent = `✅ Ready! ${cookies.length} Terabox cookies detected`;
            statusEl.className = 'status success';
        } else {
            statusEl.textContent = '⚠️ No Terabox cookies. Visit terabox.app to login first.';
            statusEl.className = 'status';
        }
    } catch (error) {
        console.error('Error checking cookies:', error);
    }
});
