# Terabox Downloader Chrome Extension

This Chrome extension works with the Terabox Downloader web app to bypass verify_v2 errors and get direct download links.

## Features

- ✅ Automatic cookie access (no manual copying needed)
- ✅ Bypasses verify_v2 CAPTCHA requirement
- ✅ Works seamlessly with the web app
- ✅ Runs in your browser context (same IP, same cookies)

## Installation

### Method 1: Load Unpacked (Development)

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` folder
5. The extension icon should appear in your toolbar

### Method 2: Pack and Install (Production)

1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Pack extension"
4. Select the `extension` folder
5. Click "Pack Extension"
6. Install the generated `.crx` file

## Usage

1. **Install the extension** (see above)
2. **Visit terabox.app** and login (if not already logged in)
3. **Go to** https://terabix-rose.vercel.app
4. **Submit a Terabox link** - NO need to paste cookies!
5. **Extension automatically provides cookies** and gets download link
6. **Download works!** ✅

## How It Works

```
Web App → Extension Content Script → Extension Background Script
                                            ↓
                                    Gets Terabox Cookies
                                            ↓
                                    Calls Terabox API
                                            ↓
                                    Returns Download Link
                                            ↓
Web App ← Extension Content Script ← Extension Background Script
```

## Permissions

- `cookies` - Read Terabox cookies
- `storage` - Store extension settings
- `tabs` - Detect active tab
- `host_permissions` - Access Terabox and web app domains

## Troubleshooting

### Extension not working?

1. Check if extension is enabled in `chrome://extensions/`
2. Make sure you're logged into terabox.app
3. Refresh the web app page
4. Check browser console for errors (F12)

### Still getting verify_v2?

1. Visit terabox.app and solve any CAPTCHA there
2. Make sure cookies are fresh (check extension popup)
3. Try logging out and back in to Terabox

## Development

### File Structure

```
extension/
├── manifest.json       # Extension configuration
├── background.js       # Service worker (handles API calls)
├── content.js          # Injected into web app
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic
├── icons/              # Extension icons
└── README.md           # This file
```

### Testing

1. Load extension in Chrome
2. Click extension icon to see status
3. Click "Test Extension" to verify cookie access
4. Go to web app and test download

## Privacy

- Extension only accesses Terabox cookies
- No data is sent to third parties
- All processing happens locally in your browser
- Open source - you can review the code

## License

MIT License - Free to use and modify

## Support

Issues? Visit: https://github.com/SaiRaheem/terabix/issues
