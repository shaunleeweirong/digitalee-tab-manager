# Complete UI Component Specification

## Quick Reference: Every Button & Element Location

### Header (Top Bar) - 4 Components

```
[🔍 Search Box] [Save All Tabs] [☀ Theme] [⚙ Settings]
```

| Component | Position | Width | Action |
|-----------|----------|-------|--------|
| Search Input | Left | 60% | Search tabs/collections, Focus on Cmd+K |
| Save All Tabs | Center-right | Auto | Creates new collection from all tabs |
| Theme Toggle | Right | 40px | Cycles light/dark/system |
| Settings | Far right | 40px | Opens settings dialog |

---

### Left Sidebar - 3 Main Sections

#### 1. Sidebar Header
- **Title**: "Currently Open (8)"
- Shows count of open tabs

#### 2. Tab List (scrollable)
Each tab item has:
- **Favicon** (top-left)
- **Title** (line 1)
- **Subtitle** (line 2)
- **URL** (line 3)
- **Save button** [💾] (bottom-right) OR
- **Saved indicator** [✓ Collection] (if already saved)
- **Close button** [×] (top-right, hover only)

#### 3. Sidebar Footer - 2 Buttons
- **Show All (8)** - Expands to show all tabs
- **Collapse** - Minimizes sidebar to icons

---

### Main Content Area - 2 Sections

#### Collections Header
```
Collections                        [+ New Collection]
```

| Component | Position | Action |
|-----------|----------|--------|
| "Collections" title | Left | Label only |
| "+ New Collection" | Right | Creates new collection |

#### Collections Grid
- **Collection Cards** arranged in responsive grid
- Each card shows:
  - Collection name (top-left, editable)
  - Menu button ⋮ (top-right)
  - First 3 URLs with favicons
  - "+N more" if more URLs
  - Tab count at bottom

---

## Complete Button Inventory

### Always Visible Buttons (4)
1. **Search Bar** - Header left
2. **Save All Tabs** - Header center-right
3. **Theme Toggle** - Header right
4. **Settings** - Header far right

### Sidebar Buttons (per tab)
5. **Save to Collection** [💾] - On each unsaved tab
6. **Close Tab** [×] - On each tab (hover)

### Sidebar Control Buttons (2)
7. **Show All / Show Less** - Bottom of sidebar
8. **Collapse / Expand** - Bottom of sidebar

### Collections Buttons
9. **+ New Collection** - Collections header right
10. **Collection Menu** ⋮ - Top-right of each card

### Total Interactive Elements
- **4** header buttons
- **2** per tab item × N tabs
- **2** sidebar control buttons
- **1** new collection button
- **1** per collection card × M collections

---

## Visual Hierarchy

```
Level 1 (Primary Actions):
├─ Save All Tabs
└─ + New Collection

Level 2 (Secondary Actions):
├─ Search
├─ Theme Toggle
└─ Settings

Level 3 (Item Actions):
├─ Save to Collection (per tab)
├─ Close Tab (per tab)
└─ Collection Menu (per collection)

Level 4 (UI Controls):
├─ Show All/Less
└─ Collapse/Expand
```

---

## Interaction Flow Examples

### Saving a Single Tab
1. User sees tab in sidebar
2. Clicks [💾] save button
3. Dialog opens with collection list
4. User selects collection
5. Tab saved, button changes to [✓ Collection Name]

### Saving All Tabs
1. User clicks "Save All Tabs" in header
2. All tabs saved to new collection
3. New collection appears in grid
4. Toast notification: "Saved 8 tabs to [Collection Name]"

### Creating New Collection
1. User clicks "+ New Collection"
2. New card appears with placeholder name
3. Name input is focused
4. User types name and presses Enter
5. Collection created

---

## Responsive Behavior Summary

### Desktop (1440px)
- Sidebar: 280px
- Header: Full width
- Collections: 3-4 columns

### Tablet (1024px)
- Sidebar: 240px
- Collections: 2-3 columns

### Mobile (768px)
- Sidebar: Hidden (drawer)
- Collections: 1-2 columns
- Header: Stacked layout

---

## Color-Coded Functional Areas

```
┌─────────────────────────────────────────────────┐
│  🔵 SEARCH & ACTIONS (Header)                  │
├──────────┬──────────────────────────────────────┤
│          │                                      │
│  🟢 OPEN │  🟡 COLLECTIONS (Main Content)      │
│  TABS    │                                      │
│  (Side)  │  - Grid of saved collections        │
│          │  - Click to open                     │
│          │  - Drag drop targets                 │
│          │                                      │
└──────────┴──────────────────────────────────────┘

🔵 Blue = Primary actions (search, save)
🟢 Green = Live data (current tabs)
🟡 Yellow = Saved data (collections)
```

---

## State Indicators

### Tab States
- **Unsaved**: Shows [💾] button
- **Saved**: Shows [✓ Collection] badge
- **Hover**: Shows [×] close button
- **Dragging**: Semi-transparent (60% opacity)

### Collection States
- **Empty**: Shows "No tabs yet" message
- **Normal**: Shows first 3 tabs + count
- **Drop Target**: Dashed border, highlighted background
- **Expanded**: Shows all tabs (future feature)

### Sidebar States
- **Expanded**: 280px width, full content
- **Collapsed**: 48px width, icons only
- **Hidden**: 0px width, completely hidden

---

This specification provides every detail needed to implement the UI!
