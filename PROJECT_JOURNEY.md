# Terabox Downloader - Project Journey

## 🎯 Project Goal
Build a web application to extract direct download links from Terabox share URLs, deployed on Vercel.

---

## 📅 Development Timeline & Challenges

### **Phase 1: Initial Setup & Deployment Issues**

#### **Challenge 1.1: JSON Parsing Errors**
- **Problem**: Frontend was trying to parse HTML error pages as JSON
- **Error**: `Unexpected token '<'` when API returned HTML instead of JSON
- **Solution**: 
  - Added `Content-Type` header checking in `src/utils/api.ts`
  - Graceful error handling for non-JSON responses
  - Set proper `Content-Type: application/json` in API responses

#### **Challenge 1.2: Vercel Routing Issues**
- **Problem**: API routes returning 404, static assets serving `index.html`
- **Errors**: 
  - `/api/download` not found
  - CSS/JS files returning HTML (MIME type errors)
- **Solution**:
  - Fixed `vercel.json` routing configuration
  - Excluded `/assets/` from SPA fallback
  - Proper rewrites for API routes vs static files

#### **Challenge 1.3: Module System Conflicts**
- **Problem**: Mixed CommonJS and ES modules causing build errors
- **Error**: `require is not defined` / `module.exports is not defined`
- **Solution**:
  - Converted all API files to ES modules (`import`/`export`)
  - Updated `package.json` with `"type": "module"`
  - Consistent module format across the project

#### **Challenge 1.4: TypeScript Build Errors**
- **Problem**: Unused React imports causing linter errors
- **Solution**: Removed `import React from 'react'` (modern JSX transform doesn't need it)

---

### **Phase 2: Terabox API Integration**

#### **Challenge 2.1: Understanding Terabox's API Structure**
- **Initial Approach**: Tried to parse HTML from share pages
- **Problem**: HTML structure was unreliable, tokens kept changing
- **Solution**: Switched to direct JSON API calls
  - `/share/list` - Get file metadata
  - `/share/download` - Get download links

#### **Challenge 2.2: Domain Detection & Normalization**
- **Problem**: Multiple Terabox domains (`terabox.com`, `1024terabox.com`, `terabox.app`)
- **Issue**: Different domains use different cookie formats
- **Solution**:
  - Implemented dynamic domain detection from share URL
  - Normalized to canonical domain (`www.terabox.app`)
  - Strip leading '1' from surl (1024terabox.com adds it)

#### **Challenge 2.3: Cookie Authentication**
- **Problem**: `ndus` cookie specific to `1024terabox.com`, not `terabox.app`
- **Discovery**: `terabox.app` uses different auth cookies (`ndut_fmt`, `ndut_fmv`, `csrfToken`)
- **Solution**:
  - Removed `ndus` validation requirement
  - Accept any cookie format
  - Let users provide all cookies from their browser

---

### **Phase 3: The verify_v2 Barrier**

#### **Challenge 3.1: Terabox API Error 105**
- **Error**: `"errno": 105, "errmsg": "Authentication required/Invalid credentials"`
- **Cause**: Missing or incorrect authentication parameters
- **Attempts**:
  - Added more browser-like headers
  - Included `Referer`, `Origin`, `User-Agent`
  - Added `Sec-Fetch-*` headers
  - Included timestamp parameter

#### **Challenge 3.2: Terabox API Error 2**
- **Error**: `"errno": 2, "errmsg": "Invalid parameters"`
- **Cause**: Wrong parameter names or values
- **Solution**:
  - Simplified API parameters to bare minimum
  - Changed `surl` ↔ `shorturl` (tested both)
  - Removed extra parameters causing validation failures

#### **Challenge 3.3: The verify_v2 Wall** ⚠️ **MAJOR BLOCKER**
- **Error**: `"errno": -9, "errmsg": "need verify_v2"`
- **Meaning**: Terabox requires CAPTCHA verification for downloads
- **Root Cause**: Anti-bot protection detecting:
  - Automated requests from serverless functions
  - Different IP address than where cookies were obtained
  - Missing browser fingerprinting data
  - Lack of user interaction signals

**Why it happens:**
- ✅ File list API works (no verification needed)
- ❌ Download API blocked (requires human verification)
- Terabox specifically blocks download link generation to prevent automation

---

### **Phase 4: Connection & Network Issues**

#### **Challenge 4.1: Socket Hang Up Errors**
- **Error**: `ECONNRESET - Connection reset by peer (socket hang up)`
- **Cause**: Terabox forcibly closing TCP connections
- **Solutions Implemented**:
  - Disabled HTTP keep-alive (`keepAlive: false`)
  - Added `Connection: close` header (force HTTP/1.1)
  - Increased axios timeout to 50 seconds
  - Set `maxContentLength: Infinity` for large responses

#### **Challenge 4.2: Timeout Issues**
- **Error**: `timeout of 30000ms exceeded`
- **Cause**: Slow Terabox API responses, network instability
- **Solution**:
  - Increased timeout to 50 seconds
  - Implemented retry logic with exponential backoff
  - 3 retries with delays: 500ms, 1000ms, 1500ms

#### **Challenge 4.3: Vercel Function Configuration**
- **Problem**: Vercel runtime version errors
- **Error**: `Function Runtimes must have a valid version`
- **Solution**:
  - Removed explicit `functions` config from `vercel.json`
  - Let Vercel auto-detect Node.js functions
  - Added runtime config in function files: `export const config = { runtime: 'nodejs' }`

---

### **Phase 5: Adapting to Reality**

#### **Challenge 5.1: Accepting the Limitation**
- **Reality Check**: verify_v2 cannot be bypassed from serverless functions
- **Decision**: Pivot from "download link generator" to "file information viewer"
- **New Approach**:
  - Show file details even when download is blocked
  - Provide manual download button linking to Terabox
  - Display file name, size, thumbnail
  - Clear messaging about verification requirement

#### **Challenge 5.2: Frontend-Backend Data Mismatch**
- **Problem**: API returning camelCase, frontend expecting snake_case
- **Error**: File details not displaying in UI (data was in network tab but not rendered)
- **Solution**:
  - Standardized on snake_case property names
  - `fileName` → `file_name`
  - `fileSize` → `file_size`
  - `thumbUrl` → `thumbnail`
  - `downloadLink` → `download_link`

---

## 🏗️ Final Architecture

### **Frontend (React + TypeScript + Vite)**
```
src/
├── components/
│   ├── DownloadForm.tsx       # URL & cookie input
│   ├── FileDisplay.tsx        # File info display
│   ├── CookieInstructions.tsx # Help for users
│   └── ThemeToggle.tsx        # Dark mode
├── utils/
│   └── api.ts                 # API client
└── types/
    └── index.ts               # TypeScript definitions
```

### **Backend (Vercel Serverless Functions)**
```
api/
├── download.js  # Main endpoint - fetches file info
└── proxy.js     # Proxy endpoint (unused due to verify_v2)
```

### **Key Features Implemented**
1. ✅ Dynamic domain detection and normalization
2. ✅ Surl extraction with leading '1' stripping
3. ✅ Robust error handling with retry logic
4. ✅ Connection resilience (disable keep-alive, force HTTP/1.1)
5. ✅ File metadata extraction (name, size, thumbnail)
6. ✅ Graceful handling of verify_v2 requirement
7. ✅ User-friendly error messages
8. ✅ Dark mode support
9. ✅ Responsive design

---

## 🚧 Current Limitations

### **What Works:**
- ✅ Accepts Terabox share links from any domain
- ✅ Fetches file metadata (name, size, thumbnail)
- ✅ Shows file information in beautiful UI
- ✅ Provides direct link to Terabox for manual download
- ✅ Handles folders (shows file list)
- ✅ Robust error handling and retry logic

### **What Doesn't Work:**
- ❌ **Automated direct download links** - Blocked by verify_v2
- ❌ **Bypassing CAPTCHA** - Requires browser automation
- ❌ **Server-side download** - IP/fingerprint mismatch

### **Why It's Blocked:**
Terabox's anti-bot system detects:
1. Requests from serverless function IPs (different from user's IP)
2. Missing browser fingerprinting data
3. Lack of user interaction signals
4. Automated request patterns

---

## 🔍 Research: How Others Solve This

### **TerapPlay.in Analysis**
We discovered a working implementation that bypasses verify_v2:

**Their Approach:**
1. **Cloudflare Workers** - Run code at the edge, not serverless
2. **Server-stored credentials** - Users don't provide cookies
3. **Token-based proxying** - All URLs proxied through worker
4. **Consistent IP/fingerprint** - Same edge location every time

**Their API Response:**
```json
{
  "download_link": "https://...workers.dev/download?token=...",
  "fast_download_link": "https://...workers.dev/download?token=...",
  "stream_url": "https://...workers.dev/stream?token=...",
  "fast_stream_url": {
    "360p": "https://...workers.dev/fast_stream?token=...m3u8",
    "480p": "https://...workers.dev/fast_stream?token=...m3u8"
  }
}
```

**Key Differences:**
- They use Cloudflare Workers (edge computing)
- We use Vercel Serverless Functions (centralized)
- They store credentials server-side
- We require user-provided cookies
- They proxy everything through workers
- We call Terabox API directly

---

## 💡 Lessons Learned

1. **Serverless limitations**: Not all APIs can be called from serverless functions
2. **Anti-bot measures**: Modern services have sophisticated bot detection
3. **IP consistency matters**: Same IP + cookies = trusted user
4. **Browser fingerprinting**: Server requests lack browser context
5. **Edge computing advantage**: Cloudflare Workers > Serverless for proxying
6. **User expectations**: Sometimes "show info + manual download" is acceptable

---

## 🚀 Future Improvements

### **Option 1: Cloudflare Workers Migration**
- Deploy proxy logic to Cloudflare Workers
- Store credentials server-side
- Generate temporary tokens for downloads
- Proxy all requests through edge network

### **Option 2: Browser Extension**
- Run in user's browser context
- Access cookies automatically
- Same IP as user
- No verify_v2 issues

### **Option 3: Puppeteer/Playwright**
- Headless browser on server
- Full browser fingerprinting
- Can solve CAPTCHAs (with services)
- Heavy and expensive

### **Option 4: Accept Current State**
- Keep as "file information viewer"
- Add more features (batch processing, history, etc.)
- Focus on UX improvements
- Document the limitation clearly

---

## 📊 Technical Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **Backend**: Node.js, Vercel Serverless Functions
- **HTTP Client**: Axios with retry logic
- **Deployment**: Vercel (auto-deploy from Git)
- **Version Control**: Git + GitHub

---

## 🎓 Key Takeaways

This project taught us:
1. How to work with third-party APIs that don't want to be automated
2. The importance of understanding anti-bot measures
3. When to pivot based on technical limitations
4. How to build resilient network code (retries, timeouts, error handling)
5. The difference between serverless functions and edge computing
6. How to gracefully handle failure and provide value anyway

**Final Status**: ✅ **Working file information viewer with manual download support**

---

## 📝 Credits

Built by: Sai Raheem
Inspired by: TerapPlay.in's implementation
Deployed on: Vercel
Repository: https://github.com/SaiRaheem/terabix

---

*Last Updated: January 1, 2026*
