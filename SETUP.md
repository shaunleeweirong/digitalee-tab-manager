# First-Time Setup Guide

Complete step-by-step instructions to get the Digitalee Tab Manager extension running.

## Prerequisites

### 1. Install Node.js

You need Node.js 18 or higher. Check if you have it:

```bash
node --version
```

If not installed, download from:
- **Official website**: https://nodejs.org/ (LTS version recommended)
- **Using Homebrew (macOS)**: `brew install node`
- **Using nvm**: `nvm install --lts`

### 2. Verify npm is installed

```bash
npm --version
```

This should be installed automatically with Node.js.

## Setup Steps

### Step 1: Navigate to Project Directory

```bash
cd /Users/leeshaun/Desktop/digitalee-tab-manager
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages (~200MB). Takes 1-3 minutes.

**Expected output:**
```
added 500+ packages in 2m
```

### Step 3: Create Extension Icons

You have two options:

#### Option A: Generate Placeholder SVG Icons (Quick)

```bash
node scripts/generate-icons.js
```

Then convert the SVGs to PNGs:
1. Use an online converter: https://cloudconvert.com/svg-to-png
2. Upload each SVG file (icon-16.svg, icon-32.svg, etc.)
3. Download the PNG versions
4. Place them in `public/icons/`

#### Option B: Create Your Own Icons

Create four PNG files with a simple design:
- Blue square (#3B82F6)
- Rounded corners
- Simple tab/folder icon in white

Sizes needed:
```
public/icons/icon-16.png   (16x16 pixels)
public/icons/icon-32.png   (32x32 pixels)
public/icons/icon-48.png   (48x48 pixels)
public/icons/icon-128.png  (128x128 pixels)
```

Tools you can use:
- Figma (free): https://figma.com
- Canva (free): https://canva.com
- Photoshop/Sketch

**Verify icons are present:**
```bash
ls -la public/icons/
```

Should show all four PNG files.

### Step 4: Build the Extension

```bash
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  CRXJS:  Extension built successfully
```

Keep this terminal window open. The dev server will watch for changes.

### Step 5: Load Extension in Chrome

1. **Open Chrome Extensions page**
   - Navigate to: `chrome://extensions/`
   - Or: Menu (⋮) → Extensions → Manage Extensions

2. **Enable Developer Mode**
   - Toggle the switch in the top-right corner

3. **Load the extension**
   - Click "Load unpacked"
   - Navigate to: `/Users/leeshaun/Desktop/digitalee-tab-manager/dist`
   - Click "Select"

4. **Verify installation**
   - You should see "Digitalee Tab Manager" in the extensions list
   - Icon appears in the Chrome toolbar

### Step 6: Test the Extension

1. **Open a new tab**
   - Press Cmd+T (Mac) or Ctrl+T (Windows/Linux)
   - You should see the new tab page with:
     - Search bar at the top
     - "Save All Tabs" button
     - Theme toggle icon (☀️/🌙/💻)
     - Empty state message (if no collections)

2. **Test theme switching**
   - Click the theme icon (top-right)
   - It should cycle: Light → Dark → System → Light
   - Page should update immediately

3. **Check for errors**
   - Right-click on the page → Inspect
   - Open Console tab
   - Should see no red errors

## Troubleshooting

### Problem: `npm install` fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and try again
rm -rf node_modules package-lock.json
npm install
```

### Problem: Extension won't load - "Cannot load extension"

**Possible causes:**

1. **Missing icons**
   - Check: `ls public/icons/`
   - Should show: icon-16.png, icon-32.png, icon-48.png, icon-128.png

2. **Manifest error**
   - Check: `cat manifest.json`
   - Ensure valid JSON (no trailing commas)

3. **Build failed**
   - Check dev server terminal for errors
   - Try: `npm run build` to see full error messages

### Problem: New tab page is blank

**Solution:**
1. Open DevTools (right-click → Inspect)
2. Check Console for errors
3. Verify `dist/` folder contains files:
   ```bash
   ls -la dist/
   ```
4. Try reloading the extension:
   - chrome://extensions/ → Click reload icon

### Problem: Theme toggle not working

**Solution:**
1. Check browser console for errors
2. Verify chrome.storage permission in manifest.json
3. Try: Delete and re-add the extension

### Problem: `npm run dev` fails with port error

**Solution:**
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or use different port
npm run dev -- --port 3000
```

## Next Steps

### 1. Test Save All Tabs

You'll need to implement the Save All Tabs functionality. The button is wired up in `src/pages/HomePage.tsx` but needs the actual save logic.

### 2. Verify Data Persistence

Open browser console and test storage:

```javascript
// Save test data
await chrome.storage.local.set({
  test: 'Hello World'
});

// Read it back
const data = await chrome.storage.local.get('test');
console.log(data); // { test: 'Hello World' }
```

### 3. Check Performance

Open DevTools → Performance tab:
- Record a new tab open
- Should complete in < 300ms

### 4. Explore the Codebase

Key files to understand:
- `src/pages/HomePage.tsx` - Main UI
- `src/lib/storage.ts` - Storage layer
- `src/lib/search.ts` - Search functionality
- `src/types/index.ts` - Data models

## Development Workflow

Once set up, your typical workflow:

```bash
# 1. Start dev server (if not running)
npm run dev

# 2. Make code changes in your editor

# 3. Refresh to see changes:
#    - UI changes: Refresh new tab page (Cmd+R)
#    - Background changes: Reload extension in chrome://extensions/
#    - Manifest changes: Remove and re-add extension

# 4. Check for errors in browser console

# 5. Commit your changes
git add .
git commit -m "Description of changes"
```

## Production Build

When ready to create a production build:

```bash
# Build for production
npm run build

# Test the production build
# Load dist/ folder in Chrome (same as step 5 above)

# Create ZIP for distribution (future)
cd dist
zip -r ../digitalee-tab-manager.zip .
cd ..
```

## Getting Help

- **Issues with setup**: Check DEVELOPMENT.md for detailed architecture info
- **Code questions**: See inline comments in source files
- **PRD reference**: Full specifications in PRD.md (if provided)
- **Chrome Extension docs**: https://developer.chrome.com/docs/extensions/

## Verification Checklist

Before proceeding with development, verify:

- [ ] `npm install` completed successfully
- [ ] All four icon files exist in `public/icons/`
- [ ] `npm run dev` starts without errors
- [ ] Extension loads in chrome://extensions/
- [ ] New tab page displays correctly
- [ ] Theme toggle works (light/dark/system)
- [ ] No errors in browser console
- [ ] DevTools shows extension is active

If all items are checked, you're ready to start development! 🎉

## Next: Development

See `DEVELOPMENT.md` for:
- Architecture overview
- Adding new features
- Working with storage
- Search implementation
- Adding Shadcn/ui components
- Performance optimization
- Debugging tips
