# Digitalee Tab Manager

A Chrome extension that replaces the new tab page with a visual workspace for organizing, searching, and managing browser tabs in collections.

## Features (Phase 1 - MVP)

- **Visual Home Screen** - Replaces Chrome's new tab page
- **Currently Open Tabs View** - Display all open tabs in the current window with drag-and-drop support
- **Collections Management** - Organize tabs into named collections
- **Save All Tabs** - One-click save of all open tabs with auto-generated names
- **Dark Mode** - Light/Dark/System theme support with no flash on load
- **Search (Basic)** - Search across all saved tabs and collections
- **Clean UI** - Apple/Notion-inspired minimalist design using Shadcn/ui

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5 + @crxjs/vite-plugin
- **Styling**: Tailwind CSS 3
- **UI Components**: Shadcn/ui (built on Radix UI)
- **Search**: MiniSearch (fuzzy search engine)
- **Storage**: Chrome Storage API
- **Extension**: Chrome Manifest V3

## Prerequisites

- Node.js 18+ and npm (or pnpm/yarn)
- Google Chrome browser

## Installation & Setup

### 1. Install Dependencies

First, ensure you have Node.js installed. Then run:

```bash
npm install
```

Or if you prefer pnpm:

```bash
pnpm install
```

### 2. Add Extension Icons

Create placeholder icons or design proper ones:

1. Navigate to `public/icons/`
2. Add the following icon files:
   - `icon-16.png` (16x16px)
   - `icon-32.png` (32x32px)
   - `icon-48.png` (48x48px)
   - `icon-128.png` (128x128px)

You can use a simple blue square as a placeholder for now. See `public/icons/README.md` for details.

### 3. Build the Extension

For development with hot reload:

```bash
npm run dev
```

For production build:

```bash
npm run build
```

The built extension will be in the `dist/` directory.

### 4. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `dist/` folder from this project

The extension is now installed! Open a new tab to see it in action.

## Development

### Project Structure

```
digitalee-tab-manager/
├── public/
│   └── icons/              # Extension icons
├── src/
│   ├── background/
│   │   └── index.ts        # Service worker
│   ├── components/
│   │   └── ui/             # Shadcn/ui components
│   ├── contexts/
│   │   └── ThemeContext.tsx # Theme state management
│   ├── lib/
│   │   ├── storage.ts      # Chrome storage abstraction
│   │   ├── search.ts       # MiniSearch integration
│   │   ├── theme.ts        # Theme utilities
│   │   └── utils.ts        # Helper functions
│   ├── pages/
│   │   ├── HomePage.tsx    # Main new tab page
│   │   └── popup/          # Extension popup
│   ├── types/
│   │   └── index.ts        # TypeScript type definitions
│   ├── App.tsx             # Root component
│   ├── main.tsx            # New tab entry point
│   └── index.css           # Global styles + theme variables
├── index.html              # New tab HTML
├── manifest.json           # Chrome extension manifest
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind configuration
└── tsconfig.json           # TypeScript configuration
```

### Available Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build production bundle
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Core Architecture

#### Storage Layer (`src/lib/storage.ts`)

Provides type-safe access to Chrome storage:

```typescript
import { storage } from '@/lib/storage';

// Get all collections
const collections = await storage.getCollections();

// Save a collection
await storage.saveCollection(collection);

// Get user preferences
const prefs = await storage.getPreferences();
```

#### Search Service (`src/lib/search.ts`)

MiniSearch integration for fuzzy search:

```typescript
import { searchService } from '@/lib/search';

// Initialize index
await searchService.initialize();

// Search
const results = await searchService.search('query');
```

#### Theme System

The theme system prevents flash of wrong theme on load:

1. Inline script in `index.html` reads theme preference from localStorage
2. Applies correct theme class before React loads
3. React ThemeProvider manages theme state
4. Theme preference syncs to Chrome storage

### Data Models

See `src/types/index.ts` for complete type definitions:

```typescript
interface Collection {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  position: number;
  urlIds: string[];
}

interface SavedURL {
  id: string;
  url: string;
  originalTitle: string;
  customName: string | null;
  aliases: string[];
  favicon: string | null;
  collectionId: string;
  position: number;
  savedAt: number;
  lastAccessedAt: number;
}
```

## Customization

### Theme Colors

Edit theme colors in `src/index.css`:

```css
:root {
  --background: 250 250 250; /* #FAFAFA */
  --foreground: 26 26 26;    /* #1A1A1A */
  --primary: 59 130 246;     /* Blue-500 */
  /* ... */
}

.dark {
  --background: 10 10 10;    /* #0A0A0A */
  /* ... */
}
```

### Adding Shadcn/ui Components

To add more Shadcn/ui components:

1. Visit https://ui.shadcn.com/docs/components
2. Copy component code to `src/components/ui/`
3. Customize styling as needed

Example components you might want to add:
- `dialog.tsx` - For delete confirmations
- `toast.tsx` - For notifications
- `dropdown-menu.tsx` - For collection actions
- `command.tsx` - For search overlay (Cmd+K)

## Roadmap

### Phase 1: Core MVP (Current)
- ✅ Project setup
- ✅ New tab page replacement
- ✅ Theme system (Light/Dark/System)
- ✅ Storage layer
- ✅ Basic UI structure
- ⏳ Currently Open Tabs display
- ⏳ Collections CRUD
- ⏳ Save All Tabs functionality
- ⏳ Basic search
- ⏳ Click-to-save tabs to collections

### Phase 2: Enhanced Search
- Fuzzy matching
- Custom name boosting
- Search-as-you-type
- Result highlighting

### Phase 3: Drag and Drop
- Drag open tabs → collections
- Drag saved URLs between collections
- Reorder URLs within collections
- Reorder collections

### Phase 4: Polish & Performance
- Animations
- Web Worker for large collections
- Performance optimization

### Phase 5: Power Features
- Multiple aliases per URL
- Keyboard shortcuts
- Import/export
- Cross-device sync

## Known Issues

1. **Icon placeholders needed** - Extension won't load without icon files in `public/icons/`
2. **Search not fully implemented** - Phase 2 feature
3. **Drag and drop not implemented** - Phase 3 feature

## Contributing

This is a project based on the comprehensive PRD in the repository. Follow the PRD specifications when implementing features.

## License

MIT
