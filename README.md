# Terabox Downloader

A production-ready web application that allows users to download files from Terabox by providing a shared link and their authentication cookie. Built with React, TypeScript, Tailwind CSS, and Node.js serverless functions.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-blue)

## ✨ Features

- 🚀 **Fast Downloads**: Generate direct download links from Terabox shares
- 🎨 **Modern UI**: Beautiful glassmorphism design with dark/light mode
- 📱 **Responsive**: Works seamlessly on desktop, tablet, and mobile
- 🔒 **Secure**: Cookies are used per-request only, never stored
- 🎯 **Easy to Use**: Simple interface with step-by-step cookie instructions
- 📁 **Folder Support**: Handles both single files and folder shares
- 🌐 **Proxy Option**: Built-in proxy for CORS bypass and video streaming
- ⚡ **Serverless**: Deployed on Vercel for free hosting

## 🖼️ Screenshots

### Light Mode
Beautiful, modern interface with glassmorphism effects

### Dark Mode
Eye-friendly dark theme with vibrant accents

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- A Terabox account (to get your cookie)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/terabox-downloader.git
   cd terabox-downloader
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

## 🍪 How to Get Your Terabox Cookie

1. **Login to Terabox**: Visit [www.terabox.com](https://www.terabox.com) and log in
2. **Open DevTools**: Press `F12` or right-click → Inspect
3. **Go to Application**: Click the "Application" or "Storage" tab
4. **Find Cookies**: Expand "Cookies" → Select "https://www.terabox.com"
5. **Copy ndus**: Find the `ndus` cookie and copy its value
6. **Paste**: Use format `ndus=YOUR_VALUE` in the app

## 📦 Deployment to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/terabox-downloader)

### Manual Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Done!** Your app is now live on Vercel

### Build Configuration

The project is configured for Vercel deployment with:
- Frontend: Vite build → `dist` folder
- API: Serverless functions in `api/` folder
- Automatic routing and SPA support

## 🛠️ Tech Stack

### Frontend
- **React 18.2** - UI library
- **TypeScript 5.3** - Type safety
- **Tailwind CSS 3.4** - Styling
- **Vite 5.0** - Build tool

### Backend
- **Node.js** - Runtime
- **Express** - Server framework
- **Axios** - HTTP client
- **Vercel Serverless** - Hosting

## 📁 Project Structure

```
terabox-downloader/
├── api/                      # Serverless API functions
│   ├── download.js          # Main download endpoint
│   └── proxy.js             # File proxy endpoint
├── src/
│   ├── components/          # React components
│   │   ├── DownloadForm.tsx
│   │   ├── FileDisplay.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── CookieInstructions.tsx
│   ├── types/               # TypeScript types
│   │   └── index.ts
│   ├── utils/               # Utility functions
│   │   └── api.ts
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # React entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── index.html               # HTML template
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Vite config
├── tailwind.config.js       # Tailwind config
└── vercel.json              # Vercel config
```

## 🔧 API Endpoints

### POST `/api/download`

Generate download link from Terabox share.

**Request:**
```json
{
  "link": "https://www.terabox.com/s/1example",
  "cookies": "ndus=YOUR_COOKIE_VALUE"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "file_name": "example.mp4",
    "file_size": "1.5 GB",
    "size_bytes": 1610612736,
    "thumbnail": "https://...",
    "download_link": "https://...",
    "proxy_url": "/api/proxy?url=..."
  }
}
```

### GET `/api/proxy`

Proxy file download with CORS support.

**Query Parameters:**
- `url` - Encoded download URL
- `file_name` - File name for download

**Features:**
- Range request support for video streaming
- CORS headers
- Proper Content-Disposition headers

## ⚙️ Configuration

### Environment Variables

No environment variables required! The app works out of the box.

### Rate Limiting

Built-in rate limiting: 10 requests per minute per IP address.

## 🐛 Troubleshooting

### "Invalid link" error
- Ensure the link is a valid Terabox share link
- Format: `https://www.terabox.com/s/1xxxxx`

### "Expired cookie" error
- Your cookie may have expired
- Log out and log back in to Terabox
- Get a fresh `ndus` cookie value

### "Failed to get download link"
- The share may be password-protected
- The file may have been deleted
- Try using a different share link

### Downloads are slow
- Use "Direct Download" for faster speeds
- "Download via Proxy" is slower but more reliable

## 📝 License

This project is licensed under the MIT License - see below:

```
MIT License

Copyright (c) 2024 Terabox Downloader

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## ⚠️ Disclaimer

This tool is for educational purposes only. Users are responsible for complying with Terabox's Terms of Service. The developers are not responsible for any misuse of this tool.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Support

If you have any questions or issues, please open an issue on GitHub.

## 🌟 Acknowledgments

- Built with ❤️ using React and TypeScript
- Inspired by the need for easy Terabox downloads
- Thanks to the open-source community

---

**Star ⭐ this repository if you find it helpful!**
