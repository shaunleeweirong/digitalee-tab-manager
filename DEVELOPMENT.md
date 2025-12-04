# Development Guide

This guide provides detailed information for developers working on the Digitalee Tab Manager extension.

## Quick Start

```bash
# Install dependencies
npm install

# Generate placeholder icons (or create your own)
node scripts/generate-icons.js

# Start development server
npm run dev

# In Chrome, load the extension from the dist/ folder
# chrome://extensions/ → Developer mode → Load unpacked → select dist/
```

## Architecture Overview

### Extension Structure

The extension consists of three main parts:

1. **New Tab Page** (`src/main.tsx`) - The main UI that replaces Chrome's new tab
2. **Background Service Worker** (`src/background/index.ts`) - Handles extension lifecycle and background tasks
3. **Popup** (`src/pages/popup/`) - Quick-save interface from the extension icon

### Data Flow

```
User Action → React Component → Storage Service → Chrome Storage API
                                ↓
                         Search Service (MiniSearch)
                                ↓
                         UI Update (React State)
```

### Key Files

| File | Purpose |
|------|---------|
| `src/types/index.ts` | TypeScript type definitions for all data models |
| `src/lib/storage.ts` | Chrome storage abstraction layer |
| `src/lib/search.ts` | MiniSearch integration for fuzzy search |
| `src/lib/theme.ts` | Theme utilities (light/dark/system) |
| `src/lib/utils.ts` | Helper functions (ID generation, formatting, etc.) |
| `src/contexts/ThemeContext.tsx` | React context for theme state |
| `src/components/ui/` | Shadcn/ui component library |
| `manifest.json` | Chrome extension manifest (Manifest V3) |

## Development Workflow

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate Icons (First Time Only)

```bash
# Generate SVG placeholders
node scripts/generate-icons.js

# Convert to PNG (manually or using online tool)
# Place PNG files in public/icons/
```

### 3. Start Dev Server

```bash
npm run dev
```

This starts Vite with the CRXJS plugin, which:
- Bundles the extension
- Enables Hot Module Replacement (HMR)
- Watches for file changes
- Outputs to `dist/` directory

### 4. Load Extension in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` folder

### 5. Development Loop

1. Make code changes
2. Vite rebuilds automatically
3. For **UI changes**: Reload the new tab page (Cmd+R)
4. For **background changes**: Click "Reload" on the extension card in chrome://extensions/
5. For **manifest changes**: Remove and re-add the extension

## Storage Architecture

### Chrome Storage API

We use `chrome.storage.local` for all data:

```typescript
// Storage structure
{
  collections: Record<string, Collection>,
  urls: Record<string, SavedURL>,
  preferences: UserPreferences,
  searchIndex: string | null  // Serialized MiniSearch index
}
```

### Why chrome.storage.local?

- **Unlimited storage** (with `unlimitedStorage` permission)
- **Async API** (doesn't block UI)
- **Extension-specific** (isolated from web pages)
- **Persists across sessions**
- **Simpler than IndexedDB** for key-value data

### Storage Service API

```typescript
import { storage } from '@/lib/storage';

// Collections
await storage.getCollections();
await storage.getCollection(id);
await storage.saveCollection(collection);
await storage.deleteCollection(id);

// URLs
await storage.getURLs();
await storage.getURL(id);
await storage.saveURL(url);
await storage.deleteURL(id);
await storage.moveURL(urlId, targetCollectionId);
await storage.reorderURLs(collectionId, urlIds);

// Preferences
await storage.getPreferences();
await storage.savePreferences(preferences);

// Utilities
await storage.getStorageStats();
await storage.clear(); // Development only
```

## Search System

### MiniSearch Integration

MiniSearch is a client-side search engine with fuzzy matching:

```typescript
import { searchService } from '@/lib/search';

// Initialize (loads from storage or rebuilds)
await searchService.initialize();

// Search
const results = await searchService.search('query', limit);

// Get recent URLs (for empty search state)
const recent = await searchService.getRecentURLs(5);

// Index updates (automatic via storage service)
await searchService.addURL(url, collectionName);
await searchService.updateURL(url, collectionName);
await searchService.removeURL(urlId);
```

### Search Configuration

From the PRD specifications:

```typescript
{
  fields: ['customName', 'aliases', 'title', 'url', 'collectionName'],
  boost: {
    customName: 3,      // Highest priority
    aliases: 2.5,
    title: 2,
    collectionName: 1.5,
    url: 1             // Lowest priority
  },
  fuzzy: 0.2,          // 20% tolerance for typos
  prefix: true,        // "goo" matches "Google"
}
```

## Theme System

### Preventing Flash of Wrong Theme

The theme system uses a multi-layer approach:

1. **Inline Script** (`index.html`) - Runs before React
   ```html
   <script>
     (function() {
       const theme = localStorage.getItem('theme') || 'system';
       const isDark = theme === 'dark' || ...;
       if (isDark) document.documentElement.classList.add('dark');
     })();
   </script>
   ```

2. **ThemeContext** (`src/contexts/ThemeContext.tsx`) - React state management
3. **CSS Variables** (`src/index.css`) - Theme color tokens

### Theme Flow

```
User selects theme → ThemeContext updates
                   ↓
           localStorage.setItem('theme', ...)
                   ↓
           chrome.storage.local.set({ preferences: ... })
                   ↓
           document.documentElement.classList.toggle('dark')
                   ↓
           CSS variables apply (--background, --foreground, etc.)
```

## Adding Shadcn/ui Components

### Step 1: Copy Component Code

Visit https://ui.shadcn.com/docs/components/[component-name] and copy the code.

### Step 2: Add to Project

```bash
# Create file in src/components/ui/
# Example: src/components/ui/dialog.tsx
```

### Step 3: Customize

Adjust the component for Apple/Notion aesthetic:
- Increase border radius (12px)
- Reduce shadow intensity
- Use ghost/outline variants by default
- Increase padding/spacing

### Example: Adding Dialog Component

1. Copy code from https://ui.shadcn.com/docs/components/dialog
2. Create `src/components/ui/dialog.tsx`
3. Adjust `dialogContentVariants` radius to `lg` (12px)
4. Import and use:

```typescript
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>Delete Collection?</DialogHeader>
    <p>This will remove {count} saved URLs.</p>
  </DialogContent>
</Dialog>
```

## TypeScript Guidelines

### Strict Mode

The project uses TypeScript strict mode:

```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true,
  "noUncheckedIndexedAccess": true
}
```

### Type Safety Best Practices

1. **Always define types** - Don't use `any`
2. **Use discriminated unions** for variant types
3. **Prefer interfaces** for object shapes
4. **Use const assertions** for literal types
5. **Enable noUncheckedIndexedAccess** - Always check array/object access

### Example: Discriminated Union

```typescript
type Message =
  | { type: 'SAVE_TAB'; collectionId: string }
  | { type: 'DELETE_URL'; urlId: string }
  | { type: 'SEARCH'; query: string };

function handleMessage(message: Message) {
  switch (message.type) {
    case 'SAVE_TAB':
      // TypeScript knows message.collectionId exists
      break;
    case 'DELETE_URL':
      // TypeScript knows message.urlId exists
      break;
  }
}
```

## Performance Considerations

### Target Metrics (from PRD)

| Metric | Target |
|--------|--------|
| Home screen load (p95) | < 300ms |
| Search response (p95) | < 200ms |
| Extension bundle size | < 500KB |
| Memory usage | < 50MB |

### Optimization Strategies

1. **Lazy load components** - Use `React.lazy()` for routes
2. **Debounce search input** - 200ms debounce on search queries
3. **Virtualize long lists** - For 100+ URLs, use react-window
4. **Web Worker for search** - Move MiniSearch to worker for 2000+ URLs
5. **Minimize bundle** - Tree-shake unused code, avoid large dependencies

### Measuring Performance

```typescript
// Measure component render time
console.time('HomePage render');
// ... component logic
console.timeEnd('HomePage render');

// Measure storage operation
console.time('storage.getCollections');
const collections = await storage.getCollections();
console.timeEnd('storage.getCollections');

// Chrome Performance API
const start = performance.now();
await searchService.search(query);
console.log(`Search took ${performance.now() - start}ms`);
```

## Testing Strategy (Future)

### Unit Tests

- Test storage service methods
- Test search service
- Test utility functions

### Integration Tests

- Test React components with storage
- Test background service worker messages
- Test theme switching

### E2E Tests

- Test full user flows (save tabs, search, delete)
- Test extension lifecycle (install, update)

## Common Issues & Solutions

### Issue: Extension won't load

**Solution**: Check that all icon files exist in `public/icons/`:
```bash
ls -la public/icons/
# Should show: icon-16.png, icon-32.png, icon-48.png, icon-128.png
```

### Issue: Hot reload not working

**Solution**:
1. Reload the extension in chrome://extensions/
2. Hard refresh the new tab page (Cmd+Shift+R)
3. Check Vite dev server is running

### Issue: Theme flashing on load

**Solution**: Ensure inline script in `index.html` runs before React:
```html
<head>
  <script>/* theme detection */</script>
  <!-- React loads after -->
</head>
```

### Issue: TypeScript errors after adding Shadcn component

**Solution**: Check imports use `@/` alias:
```typescript
import { cn } from '@/lib/utils'; // ✓ Correct
import { cn } from '../lib/utils'; // ✗ Wrong
```

### Issue: Storage data not persisting

**Solution**: Check Chrome extension permissions in manifest.json:
```json
{
  "permissions": ["storage", "unlimitedStorage"]
}
```

## Code Style

### ESLint + Prettier

```bash
# Lint code
npm run lint

# Type check
npm run type-check
```

### Formatting Rules

- **Indent**: 2 spaces
- **Quotes**: Single quotes for JS/TS, double for JSX
- **Semicolons**: Required
- **Trailing commas**: ES5 (objects, arrays)
- **Line length**: 100 characters

### Component Structure

```typescript
// 1. Imports
import React from 'react';
import { storage } from '@/lib/storage';

// 2. Types/Interfaces
interface Props {
  title: string;
}

// 3. Component
export default function MyComponent({ title }: Props) {
  // 4. State
  const [data, setData] = useState();

  // 5. Effects
  useEffect(() => {}, []);

  // 6. Event handlers
  const handleClick = () => {};

  // 7. Render
  return <div>{title}</div>;
}
```

## Debugging

### Chrome DevTools

1. **New Tab Page**: Right-click → Inspect
2. **Background Worker**: chrome://extensions/ → Inspect views: service worker
3. **Popup**: Right-click extension icon → Inspect popup

### Logging

```typescript
// Development logging
if (import.meta.env.DEV) {
  console.log('Debug info:', data);
}

// Background service worker
chrome.runtime.onMessage.addListener((message) => {
  console.log('Received:', message);
});
```

### Chrome Storage Inspector

View stored data:
1. Open DevTools on new tab page
2. Application tab → Storage → Local Storage → chrome-extension://[id]
3. Or use: `chrome.storage.local.get(null, console.log)`

## Release Process (Future)

1. Update version in `manifest.json` and `package.json`
2. Run `npm run build`
3. Test built extension thoroughly
4. Create ZIP of `dist/` folder
5. Upload to Chrome Web Store

## Resources

- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/mv3/)
- [Shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [MiniSearch Documentation](https://lucaong.github.io/minisearch/)
- [Vite](https://vitejs.dev/)
- [CRXJS Vite Plugin](https://crxjs.dev/vite-plugin/)
