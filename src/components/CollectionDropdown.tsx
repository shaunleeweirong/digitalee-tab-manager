/**
 * Collection dropdown component for managing URL collection memberships
 * Shows current collections with checkmarks and allows adding/removing from collections
 */

import { useState } from 'react';
import { Check, ChevronDown, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Collection } from '@/types';

interface CollectionDropdownProps {
  /** All available collections */
  allCollections: Collection[];
  /** Collections this URL currently belongs to */
  currentCollectionIds: string[];
  /** Called when URL should be added to a collection */
  onAddToCollection: (collectionId: string) => void;
  /** Called when URL should be removed from a collection */
  onRemoveFromCollection: (collectionId: string) => void;
  /** Disabled state */
  disabled?: boolean;
}

export function CollectionDropdown({
  allCollections,
  currentCollectionIds,
  onAddToCollection,
  onRemoveFromCollection,
  disabled = false
}: CollectionDropdownProps) {
  const [open, setOpen] = useState(false);

  // Get current collections for display
  const currentCollections = allCollections.filter(collection => 
    currentCollectionIds.includes(collection.id)
  );

  // Get available collections (not currently in)
  const availableCollections = allCollections.filter(collection => 
    !currentCollectionIds.includes(collection.id)
  );

  const handleAddToCollection = (collectionId: string) => {
    console.log('🔄 Adding URL to collection:', collectionId);
    onAddToCollection(collectionId);
  };

  const handleRemoveFromCollection = (collectionId: string) => {
    // Prevent removing from last collection
    if (currentCollectionIds.length <= 1) {
      console.log('⚠️ Cannot remove URL from last collection');
      return;
    }
    
    console.log('🔄 Removing URL from collection:', collectionId);
    onRemoveFromCollection(collectionId);
  };

  // Display text for the trigger button
  const getDisplayText = () => {
    if (currentCollections.length === 0) {
      return 'No collections';
    } else if (currentCollections.length === 1) {
      return currentCollections[0]?.name || 'Unknown';
    } else {
      const first = currentCollections[0]?.name || 'Unknown';
      const count = currentCollections.length - 1;
      return `${first} +${count}`;
    }
  };

  const truncate = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-auto p-1 text-xs text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
        >
          <Check className="h-3 w-3 mr-1" />
          <span className="max-w-[80px] truncate">
            {truncate(getDisplayText(), 12)}
          </span>
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="end" 
        className="w-48"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Current collections (can be removed) */}
        {currentCollections.length > 0 && (
          <>
            {currentCollections.map((collection) => (
              <DropdownMenuItem
                key={collection.id}
                className="flex items-center justify-between cursor-pointer"
                onClick={() => handleRemoveFromCollection(collection.id)}
                disabled={currentCollectionIds.length <= 1}
              >
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-600" />
                  <span className="truncate">{collection.name}</span>
                </div>
                {currentCollectionIds.length > 1 && (
                  <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                )}
              </DropdownMenuItem>
            ))}
            
            {availableCollections.length > 0 && (
              <div className="my-1 border-t border-border" />
            )}
          </>
        )}

        {/* Available collections (can be added) */}
        {availableCollections.map((collection) => (
          <DropdownMenuItem
            key={collection.id}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => handleAddToCollection(collection.id)}
          >
            <Plus className="h-3 w-3 text-muted-foreground" />
            <span className="truncate">{collection.name}</span>
          </DropdownMenuItem>
        ))}

        {availableCollections.length === 0 && currentCollections.length > 0 && (
          <DropdownMenuItem disabled className="text-muted-foreground text-xs">
            Already in all collections
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}