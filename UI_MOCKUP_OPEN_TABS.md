# UI Mockup: Currently Open Tabs Feature

## Overview

This document describes the UI layout for displaying currently open browser tabs on the home screen, allowing users to save them to collections via click or drag-and-drop.

---

## Layout Design

### Home Screen Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  [Search Bar]                        [Save All Tabs]  [Theme]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─ Currently Open (8 tabs) ────────────────────┐               │
│  │                                                │               │
│  │  ┌──┐ GitHub - Pull Requests              ×  │               │
│  │  │🔵│ github.com/user/repo/pulls             │               │
│  │  └──┘                                          │               │
│  │                                                │               │
│  │  ┌──┐ Stack Overflow - How to...          ×  │               │
│  │  │🟠│ stackoverflow.com/questions/...        │               │
│  │  └──┘                                          │               │
│  │                                                │               │
│  │  ┌──┐ Gmail                                ×  │               │
│  │  │🔴│ mail.google.com/mail/u/0              │               │
│  │  └──┘                                          │               │
│  │                                                │               │
│  │  ... (5 more tabs)                            │               │
│  │                                                │               │
│  │  [+ Show All 8 Tabs]                          │               │
│  └────────────────────────────────────────────────┘               │
│                                                                   │
│  Collections                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Work         │  │ Research     │  │ Shopping     │           │
│  │ 12 tabs      │  │ 8 tabs       │  │ 5 tabs       │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Open Tabs Section

**Location:** Between search bar and collections grid

**Appearance:**
- Card component with subtle border
- Header: "Currently Open (N tabs)" where N is the count
- Collapsible (can minimize to save space)
- Maximum 3-5 tabs shown initially, expandable to show all

**Design Specs:**
- Same card styling as collections (12px border radius, muted colors)
- Light background: `bg-white` with subtle shadow
- Dark background: `bg-gray-900/50` with border
- Padding: 16px
- Gap between tabs: 8px

### 2. Individual Tab Item

**Visual Structure:**
```
┌──────────────────────────────────────────────────┐
│ [Favicon] Title                              [×] │
│           URL (truncated)                        │
│           [💾 Save to...] OR [✓ Saved]          │
└──────────────────────────────────────────────────┘
```

**Elements:**
1. **Favicon** (16x16px)
   - Chrome favicon URL: `chrome-extension://[id]/_favicon/?pageUrl=${url}`
   - Fallback: Generic page icon

2. **Title**
   - Primary text: `font-medium text-sm`
   - Truncate with ellipsis if > 50 characters

3. **URL**
   - Secondary text: `text-xs text-muted-foreground`
   - Truncate domain only: "github.com/user/..."
   - Max 40 characters

4. **Close Button (×)**
   - Top-right corner
   - Only shows on hover
   - Actually closes the browser tab when clicked

5. **Save Button / Status**
   - Phase 1: "💾 Save to..." button → opens collection selector
   - If already saved: "✓ Saved in [Collection Name]" (muted)

**Interaction States:**

| State | Appearance |
|-------|------------|
| Default | White/dark background, subtle border |
| Hover | Slight scale (1.02), shadow increase |
| Dragging | Opacity 0.6, cursor grabbing |
| Saved | Green checkmark icon, muted text |
| Saving | Loading spinner |

### 3. Collection Selector (Phase 1)

When user clicks "Save to..." on a tab:

```
┌─────────────────────────────┐
│ Save tab to collection      │
├─────────────────────────────┤
│ ○ Work (12 tabs)           │
│ ○ Research (8 tabs)        │
│ ○ Shopping (5 tabs)        │
│                             │
│ + Create new collection    │
├─────────────────────────────┤
│ [Cancel]        [Save]     │
└─────────────────────────────┘
```

**Dialog Component:**
- Shadcn/ui `Dialog` component
- Radio buttons for collection selection
- "Create new collection" opens inline text input
- Keyboard shortcuts: Enter = Save, Esc = Cancel

### 4. Drag & Drop (Phase 3)

**Visual Feedback:**

1. **Dragging a Tab:**
   - Tab item becomes semi-transparent (opacity: 0.6)
   - Cursor changes to "grabbing"
   - Ghost image follows cursor

2. **Drop Zone (Collection Card):**
   - Collection card highlights with accent color border
   - Background changes to `bg-primary/5`
   - Text appears: "Drop to add to [Collection Name]"

3. **Drop Success:**
   - Brief animation: tab item flies toward collection
   - Collection count increases: "12 tabs" → "13 tabs"
   - Toast notification: "Saved to [Collection Name]"

---

## Responsive Behavior

### Desktop (1200px+)
- Open tabs section: Full width, shows 5 tabs
- Tabs displayed in vertical list
- All elements visible

### Tablet (768px - 1199px)
- Open tabs section: Full width, shows 3 tabs
- Slightly smaller fonts
- Close button always visible (no hover state)

### Mobile (< 768px)
- Open tabs section: Collapsible by default
- Shows only 2 tabs when expanded
- Compact layout: favicon + title only, no URL
- Save button: Icon only (💾)

---

## Data Flow

### Real-Time Tab Updates

**Listen to Chrome Events:**
```typescript
// src/lib/tabs.ts
chrome.tabs.onCreated.addListener(() => { /* refresh list */ })
chrome.tabs.onRemoved.addListener(() => { /* refresh list */ })
chrome.tabs.onUpdated.addListener(() => { /* refresh list */ })
```

**Update Strategy:**
1. Query tabs on component mount
2. Subscribe to tab events
3. Update state when tabs change
4. Debounce rapid changes (100ms)

### Save Tab Flow (Phase 1)

```
User clicks "Save to..."
  → Dialog opens with collections list
  → User selects collection
  → Send message to background worker
  → Background saves tab to collection
  → Update UI: Show "✓ Saved" status
  → Toast notification: Success
```

### Drag & Drop Flow (Phase 3)

```
User drags tab item
  → onDragStart: Set tab data
  → onDragOver: Highlight collection
  → onDrop: Send save message
  → Background saves tab
  → Update both UI elements
  → Show success animation
```

---

## Component Architecture

### New Components to Create

1. **`OpenTabsSection.tsx`**
   - Container for open tabs
   - Manages tab state
   - Handles collapse/expand

2. **`TabItem.tsx`**
   - Individual tab display
   - Save button handler
   - Drag source (Phase 3)

3. **`SaveTabDialog.tsx`**
   - Collection selector
   - Create new collection inline
   - Save/Cancel actions

### Modified Components

1. **`HomePage.tsx`**
   - Add `<OpenTabsSection />` above collections grid
   - Pass collections data to dialog

2. **`CollectionCard.tsx`** (Phase 3)
   - Add drop zone handlers
   - Add drop visual feedback

---

## User Preferences

Add to `UserPreferences` type:

```typescript
interface UserPreferences {
  // ... existing
  showOpenTabs: boolean;           // Show/hide open tabs section
  openTabsCollapsed: boolean;      // Remember collapse state
  openTabsLimit: number;           // How many tabs to show (3-10)
  autoRefreshTabs: boolean;        // Real-time updates vs manual refresh
}
```

**Settings UI (Future):**
- Toggle: "Show currently open tabs"
- Slider: "Show up to N tabs"
- Toggle: "Auto-refresh tab list"

---

## Accessibility

### Keyboard Navigation
- Tab items are focusable: `tabIndex={0}`
- Arrow keys: Navigate between tabs
- Enter/Space: Open save dialog
- Delete: Close tab (with confirmation)

### Screen Readers
```tsx
<div
  role="button"
  aria-label={`Save ${tab.title} to collection`}
  aria-pressed={isSaved}
>
```

### ARIA Attributes
- `role="list"` on tabs container
- `role="listitem"` on each tab
- `aria-live="polite"` for tab count updates

---

## Performance Considerations

### Optimization Strategies

1. **Virtualization** (if > 20 tabs open)
   - Use react-virtual or react-window
   - Only render visible tab items

2. **Memoization**
   - Memoize tab items: `React.memo(TabItem)`
   - Memoize favicon URLs

3. **Debouncing**
   - Debounce tab updates: 100ms
   - Prevent excessive re-renders

4. **Lazy Loading**
   - Load favicons on demand
   - Intersection Observer for visibility

### Expected Performance

| Metric | Target |
|--------|--------|
| Tab list render | < 50ms |
| Tab update | < 20ms |
| Save to collection | < 100ms |
| Drag & drop | 60fps |

---

## Visual Design Examples

### Light Mode
```css
.open-tabs-section {
  background: white;
  border: 1px solid hsl(var(--border));
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.tab-item {
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  transition: all 150ms ease;
}

.tab-item:hover {
  background: hsl(var(--accent));
  transform: scale(1.01);
}
```

### Dark Mode
```css
.dark .open-tabs-section {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
}

.dark .tab-item {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
}

.dark .tab-item:hover {
  background: hsl(var(--accent));
}
```

---

## Success Metrics

### User Engagement
- % of users who use "Save to collection" (target: > 40%)
- Average tabs saved per session (target: > 5)
- Time to save a tab (target: < 3 seconds)

### Technical Metrics
- Tab list load time (target: < 50ms)
- Memory usage with 50+ tabs (target: < 30MB)
- Event listener overhead (target: < 5ms per event)

---

## Future Enhancements

### Phase 4+
- **Bulk select:** Checkbox selection of multiple tabs
- **Quick actions:** "Save selected to..." button
- **Tab grouping:** Show Chrome tab groups
- **Tab preview:** Hover to see tab screenshot
- **Tab search:** Filter open tabs by title/URL
- **Tab sorting:** Sort by domain, title, or recently accessed

---

## Implementation Checklist

### Phase 1 (Click-to-Save)
- [ ] Create `OpenTabsSection` component
- [ ] Create `TabItem` component
- [ ] Create `SaveTabDialog` component
- [ ] Query chrome.tabs API
- [ ] Display tab list with favicons
- [ ] Implement save-to-collection flow
- [ ] Add "already saved" detection
- [ ] Add tab close functionality
- [ ] Real-time tab updates
- [ ] Add user preference toggles

### Phase 3 (Drag & Drop)
- [ ] Add drag handlers to `TabItem`
- [ ] Add drop handlers to `CollectionCard`
- [ ] Implement drop zone visual feedback
- [ ] Add drag ghost image
- [ ] Add drop animation
- [ ] Add success toast notification

---

**Status:** Design Complete ✅ | Ready for Implementation 🚀
