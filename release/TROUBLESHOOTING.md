# Troubleshooting Guide

**Solutions to common issues with Digitalee Tab Manager**

---

## 🚨 Installation Issues

### Problem: "Could not load extension from" error

**Symptoms:**
- Error when clicking "Load unpacked"
- Extension doesn't appear in the list

**Solutions:**

1. **Check the folder structure:**
   ```
   ✅ Correct: Select the 'digitalee-tab-manager' folder
   ❌ Wrong: Select the ZIP file or parent folder
   ```

2. **Verify required files exist:**
   - Open the `digitalee-tab-manager` folder
   - Check that `manifest.json` file is present
   - Check that `index.html` file is present

3. **Re-extract the ZIP file:**
   - Delete the previously extracted folder
   - Extract the ZIP file again to a new location
   - Try loading the extension again

### Problem: "Load unpacked" button is missing

**Cause:** Developer mode is not enabled

**Solution:**
1. Go to `chrome://extensions/`
2. Look for "Developer mode" toggle in the top-right
3. Click to turn it ON (should turn blue)
4. The "Load unpacked" button will appear

### Problem: "Manifest file is missing or unreadable"

**Solutions:**
1. **Check file permissions:**
   - Right-click the folder → Properties/Get Info
   - Ensure you have read permissions

2. **Try a different location:**
   - Move the folder to your Desktop
   - Try loading from there

3. **Re-download the ZIP:**
   - The download may have been corrupted
   - Download a fresh copy and extract again

---

## 🔧 Extension Functionality Issues

### Problem: New tab page doesn't change

**Symptoms:**
- Extension is installed but Chrome's default new tab still appears
- OR another extension's new tab page appears instead

**Solutions:**

1. **Open a completely new tab:**
   - Use Cmd+T (Mac) or Ctrl+T (Windows)
   - Don't just refresh the current tab

2. **Check extension is enabled:**
   - Go to `chrome://extensions/`
   - Find "Digitalee Tab Manager"
   - Ensure the toggle is blue/enabled

3. **Disable conflicting extensions:**
   - Look for other "new tab" extensions
   - Disable them temporarily to test
   - Common conflicting extensions: Momentum, New Tab Plus, etc.

4. **Restart Chrome completely:**
   - Close all Chrome windows
   - Open Chrome again
   - Try opening a new tab

### Problem: Saved tabs don't persist

**Symptoms:**
- Collections disappear after closing Chrome
- Tabs aren't being saved

**Solutions:**

1. **Check Chrome permissions:**
   - Go to `chrome://extensions/`
   - Click "Details" on Digitalee Tab Manager
   - Verify "storage" permission is granted

2. **Clear extension data and retry:**
   - Click the extension's "Details" button
   - Click "Extension options" (if available)
   - Or try saving a simple test tab

3. **Check available storage:**
   - Chrome may be out of storage space
   - Clear other Chrome data if needed

### Problem: Search not working

**Symptoms:**
- Typing in search bar shows no results
- Search results are incomplete

**Solutions:**

1. **Wait for search index to build:**
   - After installing, search needs a few seconds to initialize
   - Save a few tabs first, then try searching

2. **Refresh the new tab page:**
   - Press F5 or Cmd/Ctrl+R on the new tab page

3. **Check JavaScript errors:**
   - Right-click on new tab page → Inspect
   - Check Console tab for errors
   - Contact support if you see red error messages

### Problem: Sidebar not showing open tabs

**Symptoms:**
- Sidebar is empty or shows "No open tabs"
- Tabs are open but not listed

**Solutions:**

1. **Check tab permissions:**
   - Go to `chrome://extensions/`
   - Verify "tabs" permission is granted

2. **Refresh the extension:**
   - Go to `chrome://extensions/`
   - Click the refresh icon on Digitalee Tab Manager

3. **Check for incognito tabs:**
   - Extension doesn't see incognito/private tabs by default
   - This is normal behavior for privacy

---

## ⚠️ Security Warnings

### Problem: "Disable developer mode extensions" banner

**Symptoms:**
- Orange/red banner at top of Chrome
- Warning about developer mode extensions

**This is normal!** Here's what to know:

1. **The warning is harmless:**
   - Your extension is safe to use
   - The warning appears for ALL developer mode extensions
   - It doesn't affect functionality

2. **You can minimize the warning:**
   - Click the X on the banner (temporarily hides it)
   - The banner will return after Chrome restarts

3. **Why this happens:**
   - Extensions not from the Chrome Web Store trigger this warning
   - It's Chrome's way of informing you about non-store extensions

### Problem: Extension gets disabled after Chrome update

**Symptoms:**
- Extension stops working after Chrome updates
- Extension appears grayed out in extensions list

**Solutions:**

1. **Re-enable developer mode:**
   - Go to `chrome://extensions/`
   - Turn "Developer mode" back ON
   - The extension should reactivate

2. **Reload the extension:**
   - Click the refresh/reload icon on the extension card
   - Or remove and re-add the extension

---

## 💾 Data and Performance Issues

### Problem: Extension runs slowly

**Symptoms:**
- New tab page takes long to load
- Search is slow
- Lag when saving tabs

**Solutions:**

1. **Check collection size:**
   - Large collections (1000+ tabs) may slow things down
   - Consider splitting large collections

2. **Clear browser cache:**
   - Go to Chrome Settings → Privacy and security → Clear browsing data
   - Clear cached images and files

3. **Restart Chrome:**
   - Close all Chrome windows
   - Open Chrome again

### Problem: Collections appear corrupted

**Symptoms:**
- Collection shows wrong tab count
- Missing tabs in collections
- Duplicate entries

**Solutions:**

1. **Export important data first:**
   - Note down your important collections manually
   - Take screenshots if needed

2. **Clear extension data:**
   - Go to `chrome://extensions/`
   - Click "Details" on Digitalee Tab Manager
   - Look for data clearing options

3. **Reload the extension:**
   - Remove and re-add the extension
   - Start fresh with new collections

---

## 🖥️ Browser-Specific Issues

### Chrome on Windows

**Common issues:**
- Extension disabled after Windows updates
- Antivirus software blocking extension files

**Solutions:**
- Add extension folder to antivirus exceptions
- Re-enable after Windows updates

### Chrome on Mac

**Common issues:**
- Permission warnings when loading extension
- Gatekeeper blocking extension files

**Solutions:**
- Allow extension in Security & Privacy settings
- Use "Override Malware Protection" if needed

### Chrome on Linux

**Common issues:**
- File permission problems
- Package manager conflicts

**Solutions:**
- Check file permissions: `chmod -R 755 digitalee-tab-manager/`
- Ensure Chrome is up to date

---

## 🆘 Getting Additional Help

### Before contacting support:

1. **Try the basic solutions above**
2. **Check Chrome version:** Go to `chrome://version/`
3. **Test in incognito mode:** Does the issue happen there too?
4. **Check browser console:** Right-click → Inspect → Console tab

### What to include when asking for help:

- **Chrome version number**
- **Operating system** (Windows 10, macOS 13, etc.)
- **Exact error messages** (screenshot if possible)
- **Steps to reproduce** the problem
- **When the problem started** (after installation, after update, etc.)

### Where to get help:

- Check the GitHub repository for known issues
- Contact the developer with detailed problem description
- Search online forums for similar Chrome extension issues

---

## ✅ Prevention Tips

### Keep things running smoothly:

1. **Regular Chrome updates:** Keep Chrome up to date
2. **Moderate collection sizes:** Don't save thousands of tabs in one collection
3. **Periodic restarts:** Restart Chrome occasionally
4. **Backup important collections:** Note down critical saved tabs
5. **Monitor warnings:** Pay attention to Chrome's developer mode warnings

### Before major Chrome updates:

1. **Test the extension** after updates
2. **Be prepared to re-enable** developer mode
3. **Have the installation files** ready for quick reinstallation

---

**Remember: Most issues can be solved by restarting Chrome or re-enabling developer mode!** 🔄