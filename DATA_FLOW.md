# Terabox Link Parsing - Data Flow

## 📊 Simple Flow Diagram

```
USER INPUT
│
├─ Link: "https://1024terabox.com/s/12EXNfNFcbOcpjXky24XFOg"
└─ Cookies: "ndus=YfjoFB8peHuiFrYnbGYsh2VjYN_3PBqbvQz6c6P7; ..."
│
▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Extract Surl from Link                              │
├─────────────────────────────────────────────────────────────┤
│ Input:  "https://1024terabox.com/s/12EXNfNFcbOcpjXky24XFOg"│
│                                                              │
│ Parse URL → pathname: "/s/12EXNfNFcbOcpjXky24XFOg"         │
│ Split by '/s/' → ["", "12EXNfNFcbOcpjXky24XFOg"]           │
│ Take [1] → "12EXNfNFcbOcpjXky24XFOg"                       │
│ Remove query params → "12EXNfNFcbOcpjXky24XFOg"            │
│ Check if starts with '1' → YES                              │
│ Remove leading '1' → "2EXNfNFcbOcpjXky24XFOg"              │
│                                                              │
│ Output: surl = "2EXNfNFcbOcpjXky24XFOg"                    │
└─────────────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Determine API Domain                                │
├─────────────────────────────────────────────────────────────┤
│ All links redirect to canonical domain                       │
│                                                              │
│ Domain: "www.terabox.app"                                   │
└─────────────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Build API Request for File List                     │
├─────────────────────────────────────────────────────────────┤
│ URL: https://www.terabox.app/share/list                    │
│                                                              │
│ Parameters:                                                  │
│   shorturl = "2EXNfNFcbOcpjXky24XFOg"                      │
│   root = "1"                                                 │
│                                                              │
│ Headers:                                                     │
│   Cookie: "ndus=YfjoFB8peHuiFrYnbGYsh2VjYN_3PBqbvQz6c6P7"  │
│   Referer: "https://www.terabox.app/sharing/link?surl=..."  │
│   Origin: "https://www.terabox.app"                         │
│   User-Agent: "Mozilla/5.0 ..."                             │
└─────────────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Terabox Response - File List                        │
├─────────────────────────────────────────────────────────────┤
│ {                                                            │
│   "errno": 0,                                                │
│   "list": [                                                  │
│     {                                                        │
│       "fs_id": 505487180667551,                             │
│       "server_filename": "Maargan (2025).mkv",              │
│       "size": 2210215111,                                    │
│       "thumbs": {                                            │
│         "url3": "https://thumbnail.url/image.webp"          │
│       }                                                      │
│     }                                                        │
│   ]                                                          │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Extract File Info                                   │
├─────────────────────────────────────────────────────────────┤
│ file.fs_id = 505487180667551                                │
│ file.server_filename = "Maargan (2025).mkv"                 │
│ file.size = 2210215111 bytes                                │
│ file.thumbs.url3 = "https://thumbnail.url/image.webp"       │
└─────────────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: Build Download Request                              │
├─────────────────────────────────────────────────────────────┤
│ URL: https://www.terabox.app/share/download                │
│                                                              │
│ Parameters:                                                  │
│   shorturl = "2EXNfNFcbOcpjXky24XFOg"                      │
│   fid_list = "[505487180667551]"                            │
│                                                              │
│ Headers: (same as before)                                    │
└─────────────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 7: Terabox Response - Download Link                    │
├─────────────────────────────────────────────────────────────┤
│ SUCCESS CASE:                                                │
│ {                                                            │
│   "errno": 0,                                                │
│   "dlink": "https://d3.terabox.com/file/abc123..."          │
│ }                                                            │
│                                                              │
│ FAILURE CASE (verify_v2):                                    │
│ {                                                            │
│   "errno": -9,                                               │
│   "errmsg": "need verify_v2"                                 │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 8: Format Response for Frontend                        │
├─────────────────────────────────────────────────────────────┤
│ IF SUCCESS:                                                  │
│ {                                                            │
│   "success": true,                                           │
│   "data": {                                                  │
│     "file_name": "Maargan (2025).mkv",                      │
│     "file_size": "2.06 GB",                                  │
│     "size_bytes": 2210215111,                                │
│     "download_link": "https://d3.terabox.com/file/...",     │
│     "thumbnail": "https://thumbnail.url/image.webp"          │
│   }                                                          │
│ }                                                            │
│                                                              │
│ IF VERIFY_V2:                                                │
│ {                                                            │
│   "success": true,                                           │
│   "requiresVerification": true,                              │
│   "data": {                                                  │
│     "file_name": "Maargan (2025).mkv",                      │
│     "file_size": "2.06 GB",                                  │
│     "size_bytes": 2210215111,                                │
│     "download_link": null,                                   │
│     "thumbnail": "https://thumbnail.url/image.webp"          │
│   },                                                         │
│   "message": "File details retrieved. Manual verification...",│
│   "shareLink": "https://www.terabox.app/sharing/link?..."   │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 9: Frontend Displays Result                            │
├─────────────────────────────────────────────────────────────┤
│ Shows:                                                       │
│ • File name: "Maargan (2025).mkv"                           │
│ • File size: "2.06 GB"                                       │
│ • Thumbnail image                                            │
│ • Download button (or manual download link)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Detailed Breakdown

### **Input Processing**

#### **Example 1: 1024terabox.com Link**
```
Input:  https://1024terabox.com/s/12EXNfNFcbOcpjXky24XFOg
        ↓
Parse:  domain = "1024terabox.com"
        pathname = "/s/12EXNfNFcbOcpjXky24XFOg"
        ↓
Split:  "/s/12EXNfNFcbOcpjXky24XFOg".split('/s/')[1]
        = "12EXNfNFcbOcpjXky24XFOg"
        ↓
Strip:  starts with '1'? YES → remove it
        = "2EXNfNFcbOcpjXky24XFOg"
        ↓
Output: surl = "2EXNfNFcbOcpjXky24XFOg"
```

#### **Example 2: terabox.app Link**
```
Input:  https://www.terabox.app/sharing/link?surl=2EXNfNFcbOcpjXky24XFOg
        ↓
Parse:  domain = "www.terabox.app"
        pathname = "/sharing/link"
        query = "?surl=2EXNfNFcbOcpjXky24XFOg"
        ↓
Extract: This format doesn't use /s/ path
         Need to extract from query param instead
         (Current code handles /s/ format only)
        ↓
Output: surl = "2EXNfNFcbOcpjXky24XFOg"
```

#### **Example 3: terabox.com Link**
```
Input:  https://www.terabox.com/s/1AbCdEfGhIjKlMnOpQrStUv
        ↓
Parse:  domain = "www.terabox.com"
        pathname = "/s/1AbCdEfGhIjKlMnOpQrStUv"
        ↓
Split:  "1AbCdEfGhIjKlMnOpQrStUv"
        ↓
Strip:  starts with '1'? YES → remove it
        = "AbCdEfGhIjKlMnOpQrStUv"
        ↓
Output: surl = "AbCdEfGhIjKlMnOpQrStUv"
```

---

### **API Request Building**

#### **File List Request**
```javascript
// What we send to Terabox
GET https://www.terabox.app/share/list?shorturl=2EXNfNFcbOcpjXky24XFOg&root=1

Headers:
  Cookie: ndus=YfjoFB8peHuiFrYnbGYsh2VjYN_3PBqbvQz6c6P7; browserid=...; lang=en
  Referer: https://www.terabox.app/sharing/link?surl=2EXNfNFcbOcpjXky24XFOg
  Origin: https://www.terabox.app
  User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...
  Accept: application/json, text/plain, */*
  Accept-Language: en-US,en;q=0.9
  Connection: close
```

#### **Download Link Request**
```javascript
// What we send to Terabox
GET https://www.terabox.app/share/download?shorturl=2EXNfNFcbOcpjXky24XFOg&fid_list=[505487180667551]

Headers: (same as above)
```

---

### **Response Processing**

#### **File List Response**
```json
{
  "errno": 0,
  "list": [
    {
      "fs_id": 505487180667551,
      "server_filename": "Maargan (2025) PreDVD_1080p_x264_AAC.mkv",
      "size": 2210215111,
      "isdir": 0,
      "path": "/Maargan (2025) PreDVD_1080p_x264_AAC.mkv",
      "server_mtime": 1735737600,
      "server_ctime": 1735737600,
      "thumbs": {
        "url1": "https://thumbnail1.url",
        "url2": "https://thumbnail2.url",
        "url3": "https://thumbnail3.url"
      },
      "category": 1
    }
  ]
}

↓ We extract:

file = {
  fs_id: 505487180667551,
  server_filename: "Maargan (2025) PreDVD_1080p_x264_AAC.mkv",
  size: 2210215111,
  thumbs: { url3: "https://thumbnail3.url" }
}
```

#### **Download Response (Success)**
```json
{
  "errno": 0,
  "dlink": "https://d3.terabox.com/file/1234567890abcdef?fid=505487180667551&rt=pr&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-abc123..."
}

↓ We extract:

downloadLink = "https://d3.terabox.com/file/1234567890abcdef?fid=505487180667551..."
```

#### **Download Response (Verify Required)**
```json
{
  "errno": -9,
  "errmsg": "need verify_v2",
  "show_msg": "需要验证"
}

↓ We handle:

requiresVerification = true
downloadLink = null
shareLink = "https://www.terabox.app/sharing/link?surl=2EXNfNFcbOcpjXky24XFOg"
```

---

### **Data Transformation**

#### **Size Formatting**
```javascript
Input:  2210215111 bytes

Calculate:
  2210215111 / 1024 = 2158413.1943 KB
  2158413.1943 / 1024 = 2107.8253 MB
  2107.8253 / 1024 = 2.0584 GB

Round:
  Math.round(2.0584 * 100) / 100 = 2.06

Output: "2.06 GB"
```

#### **Final Response**
```javascript
// What we send back to frontend
{
  success: true,
  requiresVerification: true,  // or false
  data: {
    file_name: "Maargan (2025) PreDVD_1080p_x264_AAC.mkv",
    file_size: "2.06 GB",
    size_bytes: 2210215111,
    download_link: null,  // or actual link if no verification
    thumbnail: "https://thumbnail3.url",
    isFolder: false
  },
  message: "File details retrieved. Download requires manual verification.",
  shareLink: "https://www.terabox.app/sharing/link?surl=2EXNfNFcbOcpjXky24XFOg"
}
```

---

## 📝 Summary

**Input:**
- Link: `https://1024terabox.com/s/12EXNfNFcbOcpjXky24XFOg`
- Cookies: `ndus=YfjoFB8peHuiFrYnbGYsh2VjYN_3PBqbvQz6c6P7`

**Processing:**
1. Extract surl: `2EXNfNFcbOcpjXky24XFOg` (strip leading '1')
2. Call `/share/list` → Get file metadata
3. Call `/share/download` → Try to get download link
4. Handle verify_v2 if needed

**Output:**
- File name: `Maargan (2025) PreDVD_1080p_x264_AAC.mkv`
- File size: `2.06 GB`
- Thumbnail: `https://thumbnail3.url`
- Download link: `null` (if verify_v2) or actual CDN link
- Manual download link: `https://www.terabox.app/sharing/link?surl=...`

---

*This is the complete data flow from user input to final display!*
