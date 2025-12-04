import { useState } from 'react';
import { X, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CollectionDropdown } from '@/components/CollectionDropdown';
import { OpenTab } from '@/lib/tabs';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Collection } from '@/types';

interface TabItemProps {
  tab: OpenTab;
  isSaved: boolean;
  savedCollectionIds: string[];
  allCollections: Collection[];
  onSave: (tab: OpenTab) => void;
  onClose: (tabId: number) => void;
  onAddToCollection: (tabUrl: string, collectionId: string) => void;
  onRemoveFromCollection: (tabUrl: string, collectionId: string) => void;
}

export function TabItem({
  tab,
  isSaved,
  savedCollectionIds,
  allCollections,
  onSave,
  onClose,
  onAddToCollection,
  onRemoveFromCollection,
}: TabItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Create unique drag ID for this tab
  const dragId = `tab-${tab.id}`;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: dragId,
    data: {
      type: 'tab',
      tab,
      isSaved,
      savedCollectionIds,
    },
  });

  // Debug logging
  if (isDragging) {
    console.log('📋 Tab being dragged:', {
      dragId,
      tabId: tab.id,
      tabTitle: tab.title,
      tabUrl: tab.url,
      isSaved,
      savedCollectionIds,
      dragData: { type: 'tab', tab, isSaved, savedCollectionIds }
    });
  }

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const truncate = (str: string, maxLength: number) => {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
  };

  // Extract domain from URL
  const getDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return truncate(domain, 15);
    } catch {
      return truncate(url, 15);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose(tab.id);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSave(tab);
  };

  // Allow dragging of all tabs for multi-collection support
  const shouldAllowDrag = true;

  return (
    <div
      ref={shouldAllowDrag ? setNodeRef : undefined}
      style={shouldAllowDrag ? style : undefined}
      className={`relative group rounded-lg border border-border bg-background p-3 transition-all hover:bg-accent hover:scale-[1.02] shadow-sm ${
        shouldAllowDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } ${isDragging ? (isSaved ? 'opacity-50 ring-2 ring-green-400' : 'opacity-50 ring-2 ring-blue-400') : ''} ${
        isSaved ? 'border-green-200 dark:border-green-800' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...(shouldAllowDrag ? attributes : {})}
      {...(shouldAllowDrag ? listeners : {})}
    >
      {/* Close button - shows on hover */}
      {isHovered && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0"
          onClick={handleClose}
          onPointerDown={(e) => e.stopPropagation()}
          title="Close tab"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {/* Content */}
      <div className="flex gap-3">
        {/* Favicon */}
        <div className="flex-shrink-0 mt-1">
          {tab.favIconUrl ? (
            <img
              src={tab.favIconUrl}
              alt=""
              className="h-4 w-4"
              onError={(e) => {
                // Fallback to generic icon
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="h-4 w-4 rounded bg-muted" />
          )}
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Title */}
          <div className="font-medium text-sm leading-none">
            {truncate(tab.title, 18)}
          </div>

          {/* URL/Domain */}
          <div className="text-xs text-muted-foreground">
            {getDomain(tab.url)}
          </div>
        </div>
      </div>

      {/* Save button or collection dropdown */}
      <div className="mt-2 flex justify-end">
        {isSaved ? (
          <CollectionDropdown
            allCollections={allCollections}
            currentCollectionIds={savedCollectionIds}
            onAddToCollection={(collectionId) => onAddToCollection(tab.url, collectionId)}
            onRemoveFromCollection={(collectionId) => onRemoveFromCollection(tab.url, collectionId)}
          />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={handleSave}
            onPointerDown={(e) => e.stopPropagation()}
            title="Save to collection"
          >
            <Bookmark className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
