# 🔍 Debugging the 400 Error

## What We Know:

✅ Extension is detected  
✅ Extension is getting cookies  
❌ Server returns 400 Bad Request  

This means cookies are being fetched but might be **empty** or in **wrong format**.

---

## 🧪 Test Steps:

### **Step 1: Reload Extension**

The extension code was updated. You need to reload it:

1. Go to `chrome://extensions/`
2. Find "Terabox Downloader Extension"
3. Click the **refresh icon** (🔄)
4. Extension reloaded! ✅

### **Step 2: Check Extension Background Console**

1. Go to `chrome://extensions/`
2. Find "Terabox Downloader Extension"
3. Click "**service worker**" (or "background page")
4. A DevTools window opens
5. Go to **Console** tab
6. Keep this open

### **Step 3: Test Again**

1. Make sure you're logged into https://www.terabox.app
2. Go to https://terabix-rose.vercel.app
3. Paste ONLY the Terabox link
4. Leave cookies empty
5. Click "Get Download Link"

### **Step 4: Check BOTH Consoles**

**Web App Console (F12):**
```
Extension detected, getting cookies automatically...
✅ Got cookies from extension
Cookie length: XXX  ← Should be > 0
Cookie preview: ndus=...; csrfToken=...  ← Should show cookies
```

**Extension Background Console:**
```
Getting cookies for domain: www.terabox.app
Found cookies: X ['ndus', 'csrfToken', ...]  ← Should list cookie names
Cookie string length: XXX  ← Should be > 0
```

---

## 🎯 What to Look For:

### **Good Signs:**
- ✅ Cookie length > 100
- ✅ Cookie preview shows actual cookie names
- ✅ Extension background shows multiple cookies found

### **Bad Signs:**
- ❌ Cookie length = 0
- ❌ Cookie preview is empty
- ❌ Extension background shows 0 cookies

---

## 🔧 If Cookies Are Empty:

**This means you're not logged into Terabox!**

1. Open a new tab
2. Go to https://www.terabox.app
3. **Login** if not already logged in
4. Click extension icon
5. Click "Test Extension"
6. Should show: "✅ Ready! X Terabox cookies detected"
7. Try the downloader again

---

## 📊 Expected Flow:

```
1. User visits terabox.app → Logs in → Cookies stored ✅
2. User opens downloader → Extension detected ✅
3. User pastes link (no cookies) → Clicks submit
4. Extension fetches cookies from browser ✅
5. Cookies sent to server → Server gets file info ✅
6. Extension gets download link → Success! ✅
```

---

## 🐛 Possible Issues:

### **Issue 1: Not Logged Into Terabox**
**Fix:** Visit terabox.app and login

### **Issue 2: Cookies Expired**
**Fix:** Logout and login again to Terabox

### **Issue 3: Wrong Domain**
**Fix:** Make sure you're on www.terabox.app, not 1024terabox.com

### **Issue 4: Extension Permissions**
**Fix:** Check extension has access to terabox.app

---

## 📝 Report Back:

Please tell me:

1. **Cookie length from web app console:** `___`
2. **Cookie preview from web app console:** `___`
3. **Number of cookies from extension background:** `___`
4. **Cookie names from extension background:** `___`
5. **Are you logged into terabox.app?** Yes/No
6. **What does extension popup say?** `___`

This will help me fix the exact issue! 🔍
