# Quick Start Guide

Fast-track setup for developers familiar with React and Chrome extensions.

## 5-Minute Setup

```bash
# 1. Install dependencies
npm install

# 2. Generate placeholder icons (or create your own)
node scripts/generate-icons.js
# Then convert SVGs to PNGs and place in public/icons/

# 3. Start dev server
npm run dev

# 4. Load extension in Chrome
# chrome://extensions/ → Developer mode → Load unpacked → select dist/
```

## Common Commands

```bash
npm run dev          # Start dev server with HMR
npm run build        # Production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript validation
```

## Project Structure

```
src/
├── background/       # Service worker
├── components/ui/    # Shadcn components
├── contexts/         # React contexts (theme)
├── lib/             # Core services
│   ├── storage.ts   # Chrome storage API
│   ├── search.ts    # MiniSearch integration
│   ├── theme.ts     # Theme utilities
│   └── utils.ts     # Helpers
├── pages/           # Extension pages
│   ├── HomePage.tsx # New tab page
│   └── popup/       # Extension popup
└── types/           # TypeScript types
```

## Key APIs

### Storage

```typescript
import { storage } from '@/lib/storage';

// Collections
const collections = await storage.getCollections();
await storage.saveCollection(collection);

// URLs
const urls = await storage.getURLs();
await storage.saveURL(url);

// Preferences
const prefs = await storage.getPreferences();
```

### Search

```typescript
import { searchService } from '@/lib/search';

await searchService.initialize();
const results = await searchService.search('query');
```

### Theme

```typescript
import { useTheme } from '@/contexts/ThemeContext';

const { theme, setTheme } = useTheme();
setTheme('dark'); // 'light' | 'dark' | 'system'
```

## Adding Features

### 1. Add Shadcn Component

```bash
# Copy from https://ui.shadcn.com/docs/components/[name]
# Create src/components/ui/[name].tsx
# Import: import { Component } from '@/components/ui/component';
```

### 2. Create New Page

```typescript
// src/pages/MyPage.tsx
export default function MyPage() {
  return <div>My Page</div>;
}
```

### 3. Add Storage Type

```typescript
// src/types/index.ts
export interface MyType {
  id: string;
  name: string;
}
```

## Development Workflow

1. **Make changes** in `src/`
2. **Hot reload** - Vite auto-rebuilds
3. **Refresh tab** - Cmd+R to see changes
4. **Check console** - Right-click → Inspect → Console
5. **Reload extension** - For background/manifest changes only

## Testing

```bash
# Browser console
chrome.storage.local.get(null, console.log)  # View all data
chrome.storage.local.clear()                 # Clear all data

# Performance
console.time('operation')
// ... code
console.timeEnd('operation')
```

## Debugging

| Component | How to Debug |
|-----------|--------------|
| New tab page | Right-click page → Inspect |
| Background worker | chrome://extensions/ → Inspect views: service worker |
| Popup | Right-click icon → Inspect popup |
| Storage | DevTools → Application → Storage → Local Storage |

## Common Issues

**Extension won't load?**
- Check all icon PNGs exist in `public/icons/`
- Verify manifest.json is valid JSON

**Blank new tab?**
- Check browser console for errors
- Verify `dist/` folder has files

**Theme not working?**
- Check chrome.storage permission in manifest
- Verify inline script in index.html

**Hot reload not working?**
- Reload extension in chrome://extensions/
- Hard refresh page (Cmd+Shift+R)

## What's Next?

See full documentation:
- **SETUP.md** - Detailed first-time setup
- **DEVELOPMENT.md** - Architecture and best practices
- **PROJECT_SUMMARY.md** - What's built and what's pending
- **README.md** - Overview and roadmap

## Quick Reference: PRD Implementation Status

✅ **Completed:**
- Project structure, build system, TypeScript
- Storage layer (chrome.storage.local)
- Search service (MiniSearch with fuzzy matching)
- Theme system (light/dark/system)
- Basic UI (search bar, collections grid placeholder)
- Background service worker
- Documentation

⏳ **Pending:**
- Collections CRUD UI interactions
- Save All Tabs button click handler
- Search UI (results, highlighting)
- URL management UI
- Drag and drop (Phase 3)
- Additional Shadcn components (Dialog, Toast, etc.)

---

**Time to first working extension: ~10 minutes**

1. `npm install` (2-3 min)
2. Generate icons (1 min)
3. `npm run dev` (30 sec)
4. Load in Chrome (30 sec)
5. Open new tab → See it working ✅
