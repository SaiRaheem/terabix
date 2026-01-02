# Terabox Downloader - Technical Guide

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Step-by-Step User Flow](#step-by-step-user-flow)
3. [Backend Deep Dive](#backend-deep-dive)
4. [Frontend Deep Dive](#frontend-deep-dive)
5. [API Communication](#api-communication)
6. [Error Handling](#error-handling)
7. [Deployment](#deployment)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND (React + Vite)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Components:                                          │   │
│  │  • DownloadForm.tsx  → User input                    │   │
│  │  • FileDisplay.tsx   → Show results                  │   │
│  │  • CookieInstructions.tsx → Help                     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Utils:                                               │   │
│  │  • api.ts → Fetch from backend                       │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │ POST /api/download
                     │ { link, cookies }
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         BACKEND (Vercel Serverless Function)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  api/download.js                                      │   │
│  │  1. Extract surl from link                           │   │
│  │  2. Call Terabox /share/list API                     │   │
│  │  3. Try to call /share/download API                  │   │
│  │  4. Handle verify_v2 error                           │   │
│  │  5. Return file metadata                             │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │ GET /share/list
                     │ GET /share/download
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    TERABOX API                               │
│  • www.terabox.app/share/list                               │
│  • www.terabox.app/share/download                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Step-by-Step User Flow

### **Step 1: User Opens the App**
```
User → https://terabix-rose.vercel.app
```
- Frontend loads (React SPA)
- Shows input form for Terabox link and cookies
- Displays cookie instructions

### **Step 2: User Inputs Data**
```javascript
// User provides:
link = "https://1024terabox.com/s/12EXNfNFcbOcpjXky24XFOg"
cookies = "ndus=YfjoFB8peHuiFrYnbGYsh2VjYN_3PBqbvQz6c6P7; ..."
```

### **Step 3: Frontend Validation**
```javascript
// src/components/DownloadForm.tsx
validateForm() {
  if (!link.trim()) return false;
  if (!link.includes('terabox.com/s/') && 
      !link.includes('1024terabox.com/s/') && 
      !link.includes('terabox.app/')) return false;
  if (!cookies.trim()) return false;
  return true;
}
```

### **Step 4: API Call to Backend**
```javascript
// src/utils/api.ts
const response = await fetch('/api/download', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ link, cookies })
});
```

### **Step 5: Backend Processing** (Detailed below)

### **Step 6: Display Results**
```javascript
// src/components/FileDisplay.tsx
if (requiresVerification) {
  // Show file info + manual download button
} else {
  // Show file info + direct download link
}
```

---

## 🔧 Backend Deep Dive

### **File: `api/download.js`**

#### **1. Initial Setup**
```javascript
import axios from 'axios';
import https from 'https';

// Disable keep-alive to prevent connection reuse issues
const httpsAgent = new https.Agent({ 
    keepAlive: false,
    timeout: 60000 
});

// Allow large responses
axios.defaults.maxContentLength = Infinity;
axios.defaults.maxBodyLength = Infinity;
```

**Why?**
- `keepAlive: false` - Prevents socket hang up errors (ECONNRESET)
- Large content limits - Terabox responses can be big
- Long timeout - Terabox API can be slow

---

#### **2. Helper Functions**

##### **2.1 Extract Surl**
```javascript
function extractSurl(link) {
    const url = new URL(link);
    let surl = url.pathname.split('/s/')[1];
    if (surl) {
        surl = surl.split('?')[0]; // Remove query params
        
        // Strip leading '1' from 1024terabox.com links
        if (surl.startsWith('1')) {
            surl = surl.slice(1);
        }
        return surl;
    }
    throw new Error('Invalid Terabox link format');
}
```

**Example:**
```
Input:  "https://1024terabox.com/s/12EXNfNFcbOcpjXky24XFOg"
Output: "2EXNfNFcbOcpjXky24XFOg"  // Leading '1' removed
```

##### **2.2 Format File Size**
```javascript
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
```

**Example:**
```
Input:  2210215111 bytes
Output: "2.06 GB"
```

##### **2.3 Retry Logic**
```javascript
async function withRetry(fn, retries = 3) {
    try {
        return await fn();
    } catch (err) {
        if (retries === 0) throw err;
        
        // Only retry on network errors
        const shouldRetry = err.code === 'ECONNRESET' || 
                          err.code === 'ETIMEDOUT' || 
                          err.code === 'ECONNREFUSED' ||
                          err.code === 'EPIPE';
        
        if (!shouldRetry) throw err;
        
        const delay = 500 * (4 - retries); // 500ms, 1000ms, 1500ms
        await new Promise(r => setTimeout(r, delay));
        return withRetry(fn, retries - 1);
    }
}
```

**Why?**
- Terabox connections can be unstable
- Exponential backoff prevents overwhelming the server
- Only retries network errors, not API errors

---

#### **3. Main Handler Function**

```javascript
export default async function handler(req, res) {
    // Step 1: CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    // Step 2: Validate request
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed' 
        });
    }
    
    const { link, cookies } = req.body;
    if (!link || !cookies) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: link and cookies'
        });
    }
    
    // Step 3: Rate limiting
    const clientIp = req.headers['x-forwarded-for'] || 'unknown';
    if (!checkRateLimit(clientIp)) {
        return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded'
        });
    }
    
    // Step 4: Extract surl
    const surl = extractSurl(link);
    
    // Step 5: Set domain and headers
    const apiDomain = 'www.terabox.app';
    const headers = {
        'User-Agent': 'Mozilla/5.0 ...',
        'Cookie': cookies,
        'Referer': `https://${apiDomain}/sharing/link?surl=${surl}`,
        'Origin': `https://${apiDomain}`,
        'Connection': 'close', // Force HTTP/1.1
        // ... more headers
    };
    
    // Step 6: Fetch file list
    const listResponse = await withRetry(() => 
        axios.get(`https://${apiDomain}/share/list`, {
            params: { shorturl: surl, root: '1' },
            headers: headers,
            httpsAgent: httpsAgent,
            timeout: 50000
        })
    );
    
    // Step 7: Check response
    if (listResponse.data.errno !== 0) {
        return res.status(400).json({
            success: false,
            error: `Terabox API error: ${listResponse.data.errmsg}`
        });
    }
    
    const fileList = listResponse.data.list || [];
    if (fileList.length === 0) {
        return res.status(404).json({
            success: false,
            error: 'No files found'
        });
    }
    
    // Step 8: Try to get download link
    const file = fileList[0];
    const downloadResponse = await withRetry(() =>
        axios.get(`https://${apiDomain}/share/download`, {
            params: {
                shorturl: surl,
                fid_list: `[${file.fs_id}]`,
                // ... more params
            },
            headers: headers,
            httpsAgent: httpsAgent,
            timeout: 50000
        })
    );
    
    // Step 9: Handle verify_v2 error
    if (downloadResponse.data.errno !== 0) {
        const errorMsg = downloadResponse.data.errmsg;
        
        if (errorMsg.includes('verify') || errorMsg.includes('captcha')) {
            // Return file info anyway
            return res.status(200).json({
                success: true,
                requiresVerification: true,
                data: {
                    file_name: file.server_filename,
                    file_size: formatFileSize(file.size),
                    size_bytes: file.size,
                    download_link: null,
                    thumbnail: file.thumbs?.url3 || null,
                },
                message: 'File details retrieved. Download requires manual verification.',
                shareLink: `https://${apiDomain}/sharing/link?surl=${surl}`
            });
        }
        
        return res.status(400).json({
            success: false,
            error: `Failed to get download link: ${errorMsg}`
        });
    }
    
    // Step 10: Success - return download link
    const downloadLink = downloadResponse.data.dlink;
    return res.status(200).json({
        success: true,
        data: {
            file_name: file.server_filename,
            file_size: formatFileSize(file.size),
            size_bytes: file.size,
            download_link: downloadLink,
            thumbnail: file.thumbs?.url3 || null,
        }
    });
}
```

---

## 🎨 Frontend Deep Dive

### **Component Hierarchy**
```
App.tsx
├── ThemeToggle.tsx
├── CookieInstructions.tsx
├── DownloadForm.tsx
└── FileDisplay.tsx
```

### **1. App.tsx (Main Component)**

```javascript
function App() {
    // State management
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fileData, setFileData] = useState(null);
    const [requiresVerification, setRequiresVerification] = useState(false);
    const [shareLink, setShareLink] = useState(null);
    
    // Handle form submission
    const handleSubmit = async (link, cookies) => {
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await fetchDownloadLink(link, cookies);
            
            if (response.success) {
                setFileData(response.data);
                
                // Check if verification required
                if (response.requiresVerification) {
                    setRequiresVerification(true);
                    setShareLink(response.shareLink);
                }
            } else {
                setError(response.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div>
            {!fileData ? (
                <>
                    <CookieInstructions />
                    <DownloadForm onSubmit={handleSubmit} isLoading={isLoading} />
                </>
            ) : (
                <>
                    <FileDisplay 
                        data={fileData}
                        requiresVerification={requiresVerification}
                        shareLink={shareLink}
                    />
                    <button onClick={handleReset}>Download Another File</button>
                </>
            )}
            
            {error && <ErrorDisplay message={error} />}
        </div>
    );
}
```

### **2. DownloadForm.tsx**

```javascript
const DownloadForm = ({ onSubmit, isLoading }) => {
    const [link, setLink] = useState('');
    const [cookies, setCookies] = useState('');
    const [errors, setErrors] = useState({ link: '', cookies: '' });
    
    const validateForm = () => {
        const newErrors = { link: '', cookies: '' };
        let isValid = true;
        
        // Validate link
        if (!link.trim()) {
            newErrors.link = 'Terabox link is required';
            isValid = false;
        } else if (!link.includes('terabox.com/s/') && 
                   !link.includes('1024terabox.com/s/') && 
                   !link.includes('terabox.app/')) {
            newErrors.link = 'Invalid Terabox share link format';
            isValid = false;
        }
        
        // Validate cookies
        if (!cookies.trim()) {
            newErrors.cookies = 'Cookie is required';
            isValid = false;
        }
        
        setErrors(newErrors);
        return isValid;
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(link, cookies);
        }
    };
    
    return (
        <form onSubmit={handleSubmit}>
            <input 
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://www.terabox.com/s/1example"
                disabled={isLoading}
            />
            {errors.link && <p className="error">{errors.link}</p>}
            
            <textarea
                value={cookies}
                onChange={(e) => setCookies(e.target.value)}
                placeholder="Paste all cookies from terabox.app or 1024terabox.com"
                disabled={isLoading}
            />
            {errors.cookies && <p className="error">{errors.cookies}</p>}
            
            <button type="submit" disabled={isLoading}>
                {isLoading ? 'Processing...' : 'Get Download Link'}
            </button>
        </form>
    );
};
```

### **3. FileDisplay.tsx**

```javascript
const FileDisplay = ({ data, requiresVerification, shareLink }) => {
    return (
        <div className="card">
            {/* Thumbnail */}
            {data.thumbnail && (
                <img src={data.thumbnail} alt={data.file_name} />
            )}
            
            {/* File Info */}
            <h3>{data.file_name}</h3>
            <p>{data.file_size}</p>
            
            {/* Download Buttons */}
            {requiresVerification ? (
                <>
                    <div className="warning">
                        <h4>Manual Download Required</h4>
                        <p>File details retrieved. Download requires manual verification.</p>
                    </div>
                    
                    {shareLink && (
                        <a href={shareLink} target="_blank">
                            Open in Terabox to Download
                        </a>
                    )}
                </>
            ) : (
                <>
                    {data.download_link && (
                        <a href={data.download_link} target="_blank">
                            Direct Download
                        </a>
                    )}
                </>
            )}
        </div>
    );
};
```

### **4. API Utility (src/utils/api.ts)**

```javascript
const API_BASE = import.meta.env.PROD 
    ? '/api' 
    : 'http://localhost:5173/api';

export async function fetchDownloadLink(link: string, cookies: string) {
    const response = await fetch(`${API_BASE}/download`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ link, cookies }),
    });
    
    // Check Content-Type before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
    }
    
    const data = await response.json();
    return data;
}
```

---

## 🔄 API Communication Flow

### **Request Flow**
```
1. User submits form
   ↓
2. Frontend validates input
   ↓
3. Frontend calls /api/download
   POST /api/download
   {
     "link": "https://1024terabox.com/s/12EXN...",
     "cookies": "ndus=YfjoFB8peHuiFrYnbGYsh2VjYN_3PBqbvQz6c6P7; ..."
   }
   ↓
4. Backend extracts surl: "2EXN..."
   ↓
5. Backend calls Terabox /share/list
   GET https://www.terabox.app/share/list?shorturl=2EXN...&root=1
   Headers: { Cookie: "ndus=...", ... }
   ↓
6. Terabox returns file list
   {
     "errno": 0,
     "list": [{
       "fs_id": 505487180667551,
       "server_filename": "video.mkv",
       "size": 2210215111,
       "thumbs": { "url3": "https://..." }
     }]
   }
   ↓
7. Backend calls Terabox /share/download
   GET https://www.terabox.app/share/download?shorturl=2EXN...&fid_list=[505487180667551]
   ↓
8a. Success: Terabox returns download link
    {
      "errno": 0,
      "dlink": "https://d3.terabox.com/file/..."
    }
    ↓
    Backend returns to frontend:
    {
      "success": true,
      "data": {
        "file_name": "video.mkv",
        "file_size": "2.06 GB",
        "download_link": "https://d3.terabox.com/file/..."
      }
    }

8b. Failure: Terabox requires verification
    {
      "errno": -9,
      "errmsg": "need verify_v2"
    }
    ↓
    Backend returns to frontend:
    {
      "success": true,
      "requiresVerification": true,
      "data": {
        "file_name": "video.mkv",
        "file_size": "2.06 GB",
        "download_link": null
      },
      "shareLink": "https://www.terabox.app/sharing/link?surl=2EXN..."
    }
   ↓
9. Frontend displays results
```

---

## ⚠️ Error Handling

### **Network Errors**
```javascript
// ECONNRESET - Connection reset
if (err.code === 'ECONNRESET') {
    errorMessage = 'Connection reset by Terabox. Please retry.';
}

// ETIMEDOUT - Request timeout
if (err.code === 'ETIMEDOUT') {
    errorMessage = 'Request timed out. Terabox servers may be slow.';
}

// ECONNREFUSED - Connection refused
if (err.code === 'ECONNREFUSED') {
    errorMessage = 'Cannot connect to Terabox servers.';
}
```

### **API Errors**
```javascript
// Error 105 - Authentication required
if (errno === 105) {
    errorMessage = 'Invalid credentials or cookies expired';
}

// Error 2 - Invalid parameters
if (errno === 2) {
    errorMessage = 'Invalid request parameters';
}

// Error -9 - Verification required
if (errno === -9 || errmsg.includes('verify')) {
    // Return file info with requiresVerification flag
}
```

### **Retry Strategy**
```javascript
// Retry only on network errors
const shouldRetry = [
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'EPIPE'
].includes(err.code);

if (shouldRetry && retries > 0) {
    await delay(500 * (4 - retries));
    return withRetry(fn, retries - 1);
}
```

---

## 🚀 Deployment

### **Vercel Configuration**

**vercel.json:**
```json
{
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

**What this does:**
- All routes except `/api/*` → serve `index.html` (SPA)
- `/api/*` routes → execute serverless functions

### **Build Process**
```bash
# 1. Install dependencies
npm install

# 2. Build frontend
npm run build
# Creates dist/ folder with optimized React app

# 3. Deploy to Vercel
vercel --prod
# Uploads dist/ and api/ to Vercel
# Vercel automatically detects and deploys serverless functions
```

### **Environment Variables**
```bash
# On Vercel dashboard:
# Settings → Environment Variables

# Optional (for future use):
TERABOX_COOKIES=ndus=...
```

---

## 📊 Performance Optimizations

1. **Connection Management**
   - Disabled keep-alive to prevent socket reuse issues
   - Force HTTP/1.1 with `Connection: close`

2. **Retry Logic**
   - Exponential backoff prevents server overload
   - Only retries network errors, not API errors

3. **Timeouts**
   - 50-second timeout for slow Terabox responses
   - Prevents hanging requests

4. **Rate Limiting**
   - 10 requests per minute per IP
   - Prevents abuse

5. **Frontend Optimization**
   - Vite for fast builds
   - Code splitting
   - Lazy loading

---

## 🔐 Security Considerations

1. **CORS**
   - `Access-Control-Allow-Origin: *` (public API)

2. **Input Validation**
   - URL format validation
   - Cookie format validation
   - Rate limiting

3. **No Credential Storage**
   - User provides cookies
   - Not stored on server
   - Privacy-focused

4. **Error Messages**
   - Don't expose internal errors
   - User-friendly messages
   - Debug info only in development

---

## 📝 Summary

**What Works:**
- ✅ Extract file metadata from Terabox
- ✅ Handle multiple domain formats
- ✅ Robust error handling
- ✅ Retry logic for network issues
- ✅ Beautiful UI with dark mode

**What Doesn't Work:**
- ❌ Bypass verify_v2 CAPTCHA
- ❌ Automated direct downloads

**Why:**
- Terabox's anti-bot protection is too sophisticated
- Serverless functions lack browser fingerprinting
- IP address mismatch between cookie origin and request

**Solution:**
- Show file information
- Provide manual download button
- Clear user communication

---

*Last Updated: January 2, 2026*
