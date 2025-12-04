# UI Mockup: Side Panel Layout Option

## Overview

Alternative layout showing currently open tabs in a **side panel** instead of a horizontal section above collections.

---

## Layout Design: Side Panel

### Complete Home Screen Layout (Desktop 1440px)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────┐  ┌──────────────┐  ┌─┐  ┌─┐    │
│  │ 🔍 Search tabs and collections...                │  │ Save All Tabs│  │☀│  │⚙│    │
│  └─────────────────────────────────────────────────┘  └──────────────┘  └─┘  └─┘    │
├──────────────────────┬───────────────────────────────────────────────────────────────┤
│                      │                                                                │
│  Currently Open (8)  │  Collections                        [+ New Collection]        │
│  ═══════════════     │  ─────────────────────────────────────────────────────────    │
│                      │                                                                │
│  ┌─────────────────┐│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐│
│  │ 🔵  GitHub       ││  │ Work          ⋮  │  │ Research      ⋮  │  │ Shopping  ⋮  ││
│  │     Pull Req... ││  │                  │  │                  │  │              ││
│  │     github.c... ││  │  📧 Gmail        │  │  📄 Paper 1      │  │  🛒 Amazon   ││
│  │              [💾]││  │  📝 Docs         │  │  📄 Paper 2      │  │  🛍 eBay     ││
│  └─────────────[×]──┘│  │  💬 Slack        │  │  📰 Article      │  │  🏪 Store    ││
│                      │  │  ⋮ +9 more       │  │  ⋮ +5 more       │  │  ⋮ +2 more   ││
│  ┌─────────────────┐│  │                  │  │                  │  │              ││
│  │ 🟠  Stack Over  ││  │  12 tabs         │  │  8 tabs          │  │  5 tabs      ││
│  │     How to...   ││  └──────────────────┘  └──────────────────┘  └──────────────┘│
│  │     stackov...  ││                                                                │
│  │        [✓ Work] ││  ┌──────────────────┐  ┌──────────────────┐                  │
│  └─────────────[×]──┘│  │ Reading       ⋮  │  │ Dev Tools     ⋮  │                  │
│                      │  │                  │  │                  │                  │
│  ┌─────────────────┐│  │  📖 Blog         │  │  🔧 GitHub       │                  │
│  │ 🔴  Gmail        ││  │  📰 News         │  │  📚 Docs         │                  │
│  │     Inbox (3)    ││  │  🎓 Tutorial     │  │  🔌 API Ref      │                  │
│  │     mail.goo... ││  │  ⋮ +3 more       │  │  ⋮ +6 more       │                  │
│  │              [💾]││  │                  │  │                  │                  │
│  └─────────────[×]──┘│  │  6 tabs          │  │  9 tabs          │                  │
│                      │  └──────────────────┘  └──────────────────┘                  │
│  ┌─────────────────┐│                                                                │
│  │ ⚪  Notion       ││                                                                │
│  │     My Works... ││                                                                │
│  │     notion.app  ││                                                                │
│  │              [💾]││                                                                │
│  └─────────────[×]──┘│                                                                │
│                      │                                                                │
│  ┌─────────────────┐│                                                                │
│  │ 🔴  YouTube      ││                                                                │
│  │     Music Vid...││                                                                │
│  │     youtube.com ││                                                                │
│  │              [💾]││                                                                │
│  └─────────────[×]──┘│                                                                │
│                      │                                                                │
│  ... 3 more tabs     │                                                                │
│                      │                                                                │
│  ┌─────────────────┐│                                                                │
│  │  ⬇ Show All (8) ││                                                                │
│  └─────────────────┘│                                                                │
│                      │                                                                │
│  ┌─────────────────┐│                                                                │
│  │  ⬅ Collapse     ││                                                                │
│  └─────────────────┘│                                                                │
│                      │                                                                │
└──────────────────────┴───────────────────────────────────────────────────────────────┘
```

---

## Detailed Component Breakdown

### Header Bar (Top Section)

**Full Layout:**
```
┌──────────────────────────────────────────────────────────────────────┐
│  [Search Input - 60% width]  [Save All Tabs Button]  [Theme]  [⚙]  │
└──────────────────────────────────────────────────────────────────────┘
```

**Components from left to right:**

1. **Search Input (60% width)**
   - Icon: 🔍 (search icon, left side)
   - Placeholder: "Search tabs and collections..."
   - Type: Shadcn/ui `Input` component
   - Width: Flexible, takes ~60% of header
   - Height: 40px
   - Keyboard shortcut: Focus on Cmd+K / Ctrl+K

2. **Save All Tabs Button**
   - Text: "Save All Tabs"
   - Type: Shadcn/ui `Button` variant="default"
   - Width: Auto (fits text)
   - Height: 40px
   - Action: Saves all open tabs as new collection
   - Icon: Optional bookmark/folder icon

3. **Theme Toggle Button**
   - Icon: ☀ (light mode) / 🌙 (dark mode) / 💻 (system)
   - Type: Shadcn/ui `Button` variant="ghost"
   - Width: 40px (square)
   - Height: 40px
   - Action: Cycles through light → dark → system
   - Tooltip: "Toggle theme"

4. **Settings Button**
   - Icon: ⚙ (gear/cog icon)
   - Type: Shadcn/ui `Button` variant="ghost"
   - Width: 40px (square)
   - Height: 40px
   - Action: Opens settings dialog
   - Tooltip: "Settings"

**Header Spacing:**
- Padding: 16px top/bottom, 24px left/right
- Gap between elements: 12px
- Background: Transparent
- Border bottom: 1px solid border color

---

### Left Sidebar: Currently Open Tabs

**Dimensions:**
- Default width: 280px
- Min width: 240px
- Max width: 400px
- Resizable: Yes (drag right edge)
- Collapsible: Yes (to 48px icon bar)

**Sidebar Header:**
```
┌──────────────────────┐
│ Currently Open (8)   │
│ ══════════════       │
└──────────────────────┘
```
- Title: "Currently Open"
- Badge: "(8)" - shows tab count
- Underline: Double line separator
- Height: 48px
- Font: font-medium text-sm

**Individual Tab Item:**
```
┌─────────────────────┐
│ 🔵  GitHub          │ ← Favicon + Title
│     Pull Requests   │ ← Subtitle (page name)
│     github.com      │ ← URL (domain only)
│                [💾] │ ← Save button OR
│                     │
└───────────────[×]───┘ ← Close button
```

**Tab Item Elements:**

1. **Favicon** (top-left)
   - Size: 16x16px
   - Position: 12px from left, 12px from top
   - Source: Chrome favicon API
   - Fallback: Generic page icon

2. **Title** (line 1)
   - Font: font-medium text-sm
   - Color: foreground
   - Truncate: Max 18 characters + "..."
   - Example: "GitHub", "Stack Over"

3. **Subtitle** (line 2)
   - Font: text-xs
   - Color: muted-foreground
   - Truncate: Max 18 characters + "..."
   - Example: "Pull Requests", "How to..."

4. **URL** (line 3)
   - Font: text-xs
   - Color: muted-foreground (even lighter)
   - Truncate: Domain only, max 15 chars
   - Example: "github.c...", "stackov..."

5. **Save Button** (bottom-right)
   - Icon: 💾 (save/bookmark icon)
   - Type: Button variant="ghost" size="sm"
   - Size: 32px × 24px
   - Tooltip: "Save to collection"
   - Shows when: Tab is NOT saved

6. **Saved Status** (bottom-right, alternative)
   - Text: "✓ Work" (checkmark + collection name)
   - Font: text-xs
   - Color: success green
   - Shows when: Tab IS already saved
   - Truncate collection name: max 10 chars

7. **Close Button** (top-right)
   - Icon: × (close/X icon)
   - Type: Button variant="ghost" size="sm"
   - Size: 24px × 24px
   - Visibility: Shows on hover only
   - Action: Closes the browser tab
   - Tooltip: "Close tab"

**Tab Item States:**
- Default: bg-card with border
- Hover: bg-accent, scale(1.02)
- Active/Selected: bg-accent with thicker border
- Dragging: opacity-60

**Tab Item Spacing:**
- Height: 96px per item
- Padding: 12px
- Gap between items: 8px
- Border: 1px solid border color
- Border radius: 8px

**Sidebar Bottom Buttons:**

1. **Show All Button**
   ```
   ┌─────────────────┐
   │  ⬇ Show All (8) │
   └─────────────────┘
   ```
   - Shows when: More than 5 tabs (default limit)
   - Action: Expands to show all tabs
   - Changes to: "⬆ Show Less" when expanded

2. **Collapse Button**
   ```
   ┌─────────────────┐
   │  ⬅ Collapse     │
   └─────────────────┘
   ```
   - Position: Bottom of sidebar
   - Action: Collapses sidebar to 48px icon bar
   - Icon changes to: "➡ Expand" when collapsed

---

### Main Content Area: Collections

**Collections Header:**
```
┌────────────────────────────────────────────────────────┐
│ Collections                        [+ New Collection]  │
│ ─────────────────────────────────────────────────────  │
└────────────────────────────────────────────────────────┘
```

**Elements:**
1. **Title**: "Collections"
   - Font: text-lg font-semibold
   - Position: Left side

2. **New Collection Button**
   - Text: "+ New Collection"
   - Type: Button variant="outline"
   - Position: Right side (opposite title)
   - Action: Creates new collection with inline name edit

**Collection Card:**
```
┌──────────────────────┐
│ Work              ⋮  │ ← Title + Menu
│                      │
│  📧 Gmail            │ ← URL item 1
│  📝 Docs             │ ← URL item 2
│  💬 Slack            │ ← URL item 3
│  ⋮ +9 more           │ ← Overflow indicator
│                      │
│  12 tabs             │ ← Tab count
└──────────────────────┘
```

**Collection Card Elements:**

1. **Card Container**
   - Width: Flexible (responsive grid)
   - Min width: 220px
   - Max width: 300px
   - Height: Auto (min 200px)
   - Border: 1px solid border
   - Border radius: 12px
   - Padding: 16px
   - Background: card color

2. **Collection Title** (top)
   - Font: font-semibold text-base
   - Position: Top-left
   - Editable: Click to rename (inline edit)
   - Max length: 30 characters

3. **Menu Button** (⋮)
   - Icon: Three vertical dots
   - Position: Top-right
   - Type: Button variant="ghost" size="sm"
   - Action: Opens dropdown menu
   - Menu items:
     - "Rename collection"
     - "Delete collection"
     - "Open all tabs"
     - "Export collection"

4. **URL List** (middle section)
   - Shows: First 3 URLs by default
   - Each URL:
     - Favicon (emoji or actual favicon)
     - Title (truncated to 15 chars)
     - Format: "emoji Title"
   - Overflow: "⋮ +9 more" (if > 3 URLs)

5. **Tab Count** (bottom)
   - Text: "12 tabs"
   - Font: text-sm text-muted-foreground
   - Position: Bottom-left

**Collection Grid Layout:**
- Columns: Auto-fill, min 220px
- Gap: 16px
- Rows: Auto
- Responsive:
  - Desktop (1440px): 3-4 columns
  - Tablet (1024px): 2-3 columns
  - Mobile (768px): 1-2 columns

**Drop Zone State (Drag & Drop):**
When dragging a tab over a collection:
```
┌──────────────────────┐
│ Work              ⋮  │
│                      │
│  ⬇ DROP HERE ⬇       │ ← Drop indicator
│                      │
│  Background: primary │
│  Border: 2px dashed  │
│  Opacity: 0.8        │
│                      │
│  12 tabs             │
└──────────────────────┘
```

---

## Exact Measurements & Spacing

### Desktop Layout (1440px viewport)

```
Header:          Full width (1440px)
├─ Padding:      24px left/right, 16px top/bottom
├─ Height:       72px

Sidebar:         280px width (resizable 240-400px)
├─ Padding:      16px
├─ Tab items:    Show 5 (default), expandable

Main Content:    1136px width (1440 - 280 - 24px gaps)
├─ Padding:      24px
├─ Grid:         3-4 columns
└─ Card width:   ~260px each
```

### Spacing System

**Padding/Margin Scale:**
- XS: 4px
- SM: 8px
- MD: 12px
- LG: 16px
- XL: 24px
- 2XL: 32px

**Component Spacing:**
- Header padding: 24px horizontal, 16px vertical
- Sidebar padding: 16px
- Card padding: 16px
- Tab item padding: 12px
- Gap between cards: 16px
- Gap between tab items: 8px

---

## Layout Comparison

### **Option A: Top Section (Original)**
```
┌─────────────────────────────────────────┐
│  Search & Actions                       │
├─────────────────────────────────────────┤
│  ┌─ Currently Open Tabs ──────────────┐│
│  │  [Tab] [Tab] [Tab]                 ││
│  └────────────────────────────────────┘│
│                                         │
│  Collections Grid                       │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
│  │    │ │    │ │    │ │    │          │
│  └────┘ └────┘ └────┘ └────┘          │
└─────────────────────────────────────────┘
```

**Pros:**
- Collections take full width
- Natural reading order (top to bottom)
- Expandable horizontally for many tabs

**Cons:**
- Pushes collections down
- Less vertical space for collections
- Horizontal scrolling if many tabs open

---

### **Option B: Side Panel (New)**
```
┌──────────┬──────────────────────────────┐
│          │  Search & Actions            │
│  Open    ├──────────────────────────────┤
│  Tabs    │                              │
│          │  Collections Grid            │
│  [Tab]   │  ┌────┐ ┌────┐ ┌────┐       │
│  [Tab]   │  │    │ │    │ │    │       │
│  [Tab]   │  └────┘ └────┘ └────┘       │
│  [Tab]   │                              │
│  [Tab]   │  ┌────┐ ┌────┐ ┌────┐       │
│          │  │    │ │    │ │    │       │
│          │  └────┘ └────┘ └────┘       │
└──────────┴──────────────────────────────┘
```

**Pros:**
- Persistent visibility of open tabs
- Collections get full width
- More vertical space for collections
- Natural drag distance (left to right)
- Can scroll tabs independently

**Cons:**
- Reduces horizontal space for collections
- More complex responsive behavior

---

## Side Panel Specifications

### Panel Dimensions

**Desktop (1200px+)**
- Panel width: 280px (fixed)
- Resizable: Yes, min 240px, max 400px
- Collapsible: Yes, collapses to 48px icon bar

**Tablet (768px - 1199px)**
- Panel width: 240px (fixed)
- Not resizable
- Collapsible: Yes

**Mobile (< 768px)**
- Panel: Hidden by default
- Opens as overlay drawer (full width)
- Swipe from left to open

---

## Side Panel Components

### 1. Panel Header

```
┌────────────────────┐
│ Currently Open     │
│ 8 tabs    [− ] [×]│
└────────────────────┘
```

**Elements:**
- Title: "Currently Open"
- Tab count badge: "8 tabs"
- Collapse button: `[−]` minimizes to icon bar
- Close button: `[×]` hides panel completely

### 2. Tab List (Compact View)

```
┌──────────────────┐
│ ┌──┐ GitHub    ×│
│ │🔵│ github.com │
│ └──┘ [💾]       │
│                  │
│ ┌──┐ Gmail     ×│
│ │🔴│ mail.g...  │
│ └──┘ [✓ Work]  │
└──────────────────┘
```

**Compact Item Layout:**
- Favicon: 16x16px
- Title: Truncate to 1 line (max 20 chars)
- URL: Truncate to 1 line (max 15 chars), muted
- Save button: Icon only `[💾]` or status `[✓]`
- Close button: `×` (top right, on hover)

### 3. Minimized State (Icon Bar)

```
┌──┐
│🔵│
│🟠│
│🔴│
│⚪│
│🔴│
│  │
│[8]│
│[↔]│
└──┘
```

**Icon Bar (48px width):**
- Shows only favicons (stacked vertically)
- Tab count at bottom: `[8]`
- Expand button: `[↔]`
- Hover: Shows tab title in tooltip

### 4. Drag & Drop Zones

**Visual Feedback:**

```
[Dragging from sidebar]
┌──────────┬────────────────────────┐
│          │                        │
│  [DRAG]  →→→  ┌────────────────┐ │
│  ┌──┐    │    │ ⬇ Work      ⬇ │ │
│  │🔵│    │    │ DROP HERE     │ │
│  └──┘    │    └────────────────┘ │
│          │                        │
└──────────┴────────────────────────┘
```

**Drag States:**
1. Dragging from sidebar: Tab item follows cursor
2. Hover over collection: Collection highlights with drop zone
3. Drop: Tab animates from sidebar to collection
4. Success: Collection count updates, sidebar item shows checkmark

---

## Interaction Patterns

### Resizing the Panel

**Desktop Only:**
- Resize handle on right edge of panel
- Drag to resize between 240px - 400px
- Double-click resize handle: Reset to default 280px
- Width preference saved to user preferences

**Visual Indicator:**
```
┌────────────────│
│ Currently Open │
│ 8 tabs         │
│                │
│  [Tab]         │
│  [Tab]         │
│                │
└────────────────│
     ↕ (resize handle)
```

### Collapsing the Panel

**Click `[−]` button:**
1. Panel width animates: 280px → 48px (150ms)
2. Tab items fade out
3. Only favicons remain visible
4. Collections grid expands to fill space

**Click `[↔]` expand button:**
1. Panel width animates: 48px → 280px (150ms)
2. Tab items fade in
3. Collections grid shrinks

### Hiding the Panel

**Click `[×]` button:**
1. Panel slides out to left (200ms ease-out)
2. Collections grid expands to full width
3. "Show Open Tabs" button appears in header

**Click "Show Open Tabs" button:**
1. Panel slides in from left (200ms ease-out)
2. Collections grid shrinks

---

## Responsive Behavior

### Desktop (1200px+)
```
[Sidebar 280px] [Collections Full Width]
```

### Tablet (768px - 1199px)
```
[Sidebar 240px] [Collections Remaining Width]
```
- Sidebar not resizable
- Collections: 2-3 per row

### Mobile (< 768px)
```
[Collections Full Width]
```
- Sidebar hidden by default
- Open via hamburger menu: `[☰]`
- Appears as full-width overlay drawer
- Swipe left to close

**Mobile Drawer:**
```
┌─────────────────────────┐
│ Currently Open     [×]  │
├─────────────────────────┤
│                         │
│  ┌──┐ GitHub         × │
│  │🔵│ github.com       │
│  └──┘                  │
│                         │
│  ┌──┐ Gmail          × │
│  │🔴│ mail.google.com  │
│  └──┘                  │
│                         │
│  ... (all tabs)         │
│                         │
└─────────────────────────┘
```

---

## User Preferences

Add to `UserPreferences`:

```typescript
interface UserPreferences {
  // ... existing
  openTabsLayout: 'top' | 'sidebar';     // Layout preference
  sidebarWidth: number;                   // Sidebar width (240-400)
  sidebarCollapsed: boolean;              // Collapsed state
  sidebarVisible: boolean;                // Visibility state
}
```

**Settings UI:**
- Radio buttons: "Show open tabs: Top / Sidebar"
- Slider: "Sidebar width" (if sidebar layout)
- Toggle: "Show sidebar by default"

---

## Comparison: Top vs Sidebar

| Feature | Top Section | Side Panel |
|---------|-------------|------------|
| **Space for collections** | Reduced vertical | Full vertical |
| **Drag distance** | Longer (vertical) | Shorter (horizontal) |
| **Tab visibility** | Hidden when scrolled | Always visible |
| **Natural reading** | Top to bottom | Left to right |
| **Responsive** | Simpler | More complex |
| **Many tabs** | Horizontal scroll | Vertical scroll |
| **Best for** | Wide screens | Tall screens |

---

## Recommended Layout Decision

### **Hybrid Approach (Best of Both):**

**Default Layout by Screen Size:**
- **Desktop (> 1200px):** Side panel (more space)
- **Tablet (768-1199px):** Top section (simpler)
- **Mobile (< 768px):** Drawer overlay

**User Override:**
- Settings toggle: "Prefer sidebar layout"
- Remembers user preference
- Gracefully degrades on smaller screens

---

## Implementation Complexity

### Top Section (Simpler)
- Components: 3 new files
- Responsive: Straightforward
- Estimated dev time: 4-6 hours

### Side Panel (More Complex)
- Components: 5 new files
- Responsive: Multiple breakpoints
- Resize logic: Additional complexity
- Estimated dev time: 8-12 hours

### Hybrid (Recommended)
- Components: 6 new files
- Responsive: Media query logic
- User preference: Settings integration
- Estimated dev time: 10-14 hours

---

## Visual Design: Side Panel

### Light Mode
```css
.sidebar-panel {
  background: white;
  border-right: 1px solid hsl(var(--border));
  box-shadow: 2px 0 8px rgba(0,0,0,0.02);
  transition: width 150ms ease;
}

.sidebar-panel.collapsed {
  width: 48px;
}

.resize-handle {
  width: 4px;
  background: transparent;
  cursor: col-resize;
}

.resize-handle:hover {
  background: hsl(var(--primary));
}
```

### Dark Mode
```css
.dark .sidebar-panel {
  background: hsl(var(--card));
  border-right: 1px solid hsl(var(--border));
  box-shadow: 2px 0 12px rgba(0,0,0,0.3);
}
```

---

## Accessibility

### Keyboard Navigation
- `Ctrl+B` (Windows) / `Cmd+B` (Mac): Toggle sidebar
- `Ctrl+[` / `Cmd+[`: Collapse sidebar
- `Ctrl+]` / `Cmd+]`: Expand sidebar
- Focus trap when sidebar has focus

### Screen Readers
```tsx
<aside
  role="complementary"
  aria-label="Currently open browser tabs"
  aria-expanded={!collapsed}
>
```

### ARIA Attributes
- `aria-label="Resize sidebar"` on resize handle
- `aria-label="Collapse sidebar"` on collapse button
- `aria-hidden={collapsed}` on collapsed tab content

---

## Performance Considerations

### Animations
- Use `transform` for collapse (hardware accelerated)
- `will-change: transform` on panel during resize
- Debounce resize events: 16ms (60fps)

### Virtualization
- Same as top section: Virtualize if > 20 tabs
- Only render visible tabs in scrollable area

---

## Mock-up Summary

### **Recommendation: Sidebar Layout**

**Why:**
1. **Better space usage** - Collections keep full width
2. **Persistent visibility** - Open tabs always visible
3. **Natural drag path** - Left to right feels intuitive
4. **Scalability** - Works better with many tabs (vertical scroll)
5. **Modern pattern** - Similar to VS Code, Notion, etc.

**Trade-offs:**
- More complex implementation
- Requires responsive handling
- Need collapse/resize features

**User value:**
- Faster workflow (less scrolling)
- Better visual organization
- More productive layout

---

**Status:** Alternative Layout Designed ✅ | Ready for Decision 🎯
