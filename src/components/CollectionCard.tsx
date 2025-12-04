/**
 * Collection card component with context menu
 * Displays collection info and provides rename/delete actions
 */

import { useState } from 'react';
import type { Collection, SavedURL } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit2, Trash2, Check, X, ChevronDown } from 'lucide-react';

interface CollectionCardProps {
  collection: Collection;
  urls: Record<string, SavedURL>;
  onRename: (collectionId: string, newName: string) => void;
  onDelete: (collectionId: string) => void;
  onUpdateURL: (urlId: string, newCustomName: string) => void;
  onDeleteURL: (urlId: string) => void;
}

export function CollectionCard({ 
  collection, 
  urls, 
  onRename, 
  onDelete, 
  onUpdateURL, 
  onDeleteURL,
}: CollectionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(collection.name);
  const [editingUrlId, setEditingUrlId] = useState<string | null>(null);
  const [editUrlName, setEditUrlName] = useState('');
  const [showAllUrls, setShowAllUrls] = useState(false);

  const DISPLAY_LIMIT = 3;

  const handleStartEdit = () => {
    setEditName(collection.name);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== collection.name) {
      onRename(collection.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(collection.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleStartUrlEdit = (url: SavedURL, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent URL click
    
    console.log('✏️ Starting URL edit:', {
      urlId: url.id,
      originalTitle: url.originalTitle,
      currentCustomName: url.customName
    });

    setEditingUrlId(url.id);
    setEditUrlName(url.customName || url.originalTitle);
  };

  const handleSaveUrlEdit = async () => {
    if (!editingUrlId) return;

    const url = urls[editingUrlId];
    if (!url) return;

    const newCustomName = editUrlName.trim();
    
    console.log('💾 Saving URL edit:', {
      urlId: editingUrlId,
      oldCustomName: url.customName,
      newCustomName: newCustomName || '(reset to original)',
      originalTitle: url.originalTitle
    });

    await onUpdateURL(editingUrlId, newCustomName);
    setEditingUrlId(null);
    setEditUrlName('');
  };

  const handleCancelUrlEdit = () => {
    console.log('❌ Cancelled URL edit:', editingUrlId);
    setEditingUrlId(null);
    setEditUrlName('');
  };

  const handleUrlEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveUrlEdit();
    } else if (e.key === 'Escape') {
      handleCancelUrlEdit();
    }
  };

  const handleUrlClick = async (url: SavedURL) => {
    console.log('🔗 URL clicked:', {
      urlId: url.id,
      url: url.url,
      title: url.originalTitle,
      customName: url.customName
    });

    try {
      // Open URL in new tab
      await chrome.tabs.create({
        url: url.url,
        active: false // Don't switch to the new tab immediately
      });
      
      console.log('✅ URL opened successfully:', url.url);
      
    } catch (error) {
      console.error('❌ Failed to open URL:', {
        url: url.url,
        error: error instanceof Error ? error.message : error
      });
    }
  };

  const handleDeleteUrl = (url: SavedURL, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent URL click
    
    console.log('🗑️ Delete button clicked for URL:', {
      urlId: url.id,
      collectionIds: url.collectionIds,
      title: url.originalTitle,
      customName: url.customName,
      url: url.url
    });

    try {
      onDeleteURL(url.id);
      console.log('✅ Delete handler called for URL:', url.id);
    } catch (error) {
      console.error('❌ Failed to call delete handler:', {
        urlId: url.id,
        error: error instanceof Error ? error.message : error
      });
    }
  };

  // Get displayed URLs in their current order
  const displayedUrls = (showAllUrls ? collection.urlIds : collection.urlIds.slice(0, DISPLAY_LIMIT));

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="mb-3 flex items-start justify-between">
        {isEditing ? (
          <div className="flex-1 flex items-center gap-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              onPointerDown={(e) => e.stopPropagation()}
              className="h-8 text-xl font-semibold"
              autoFocus
            />
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={!editName.trim()}
              className="h-8 w-8 p-0"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelEdit}
              className="h-8 w-8 p-0"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-semibold">
              {collection.name}
            </h3>
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Collection options</span>
                  </Button>
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleStartEdit}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(collection.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </>
        )}
      </div>
      
      <div className="space-y-2 mb-3">
        {displayedUrls.map((urlId) => {
          const url = urls[urlId];
          if (!url) return null;
          
          const isUrlEditing = editingUrlId === url.id;
          
          return (
            <div key={urlId} className="flex items-center gap-2">
              {/* Favicon */}
              <div className="flex-shrink-0 relative w-4 h-4">
                {url.favicon ? (
                  <>
                    <img
                      src={url.favicon}
                      alt=""
                      className="h-4 w-4 absolute top-0 left-0"
                      onLoad={(e) => {
                        const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'none';
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'block';
                      }}
                      loading="lazy"
                    />
                    <div className="h-4 w-4 rounded-sm bg-muted absolute top-0 left-0" style={{ backgroundColor: 'hsl(var(--muted))' }} />
                  </>
                ) : (
                  <div className="h-4 w-4 rounded-sm bg-muted" style={{ backgroundColor: 'hsl(var(--muted))' }} />
                )}
              </div>
              
              {isUrlEditing ? (
                // Edit mode
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    value={editUrlName}
                    onChange={(e) => setEditUrlName(e.target.value)}
                    onKeyDown={handleUrlEditKeyDown}
                    className="h-7 text-sm flex-1"
                    placeholder={url.originalTitle}
                    autoFocus
                    onPointerDown={(e) => e.stopPropagation()}
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveUrlEdit}
                    disabled={!editUrlName.trim()}
                    className="h-7 w-7 p-0"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelUrlEdit}
                    className="h-7 w-7 p-0"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                // View mode
                <div className="flex-1 flex items-center gap-2 group min-w-0">
                  {/* Text container with proper flex shrinking */}
                  <span
                    className="flex-1 truncate text-base text-muted-foreground hover:text-foreground cursor-pointer min-w-0"
                    onClick={() => handleUrlClick(url)}
                    title={`Click to open: ${url.url}`}
                  >
                    {url.customName || url.originalTitle}
                  </span>
                  
                  {/* Edit button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-muted/50 transition-all duration-200 flex-shrink-0 rounded-md"
                    onClick={(e) => handleStartUrlEdit(url, e)}
                    title="Edit name"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  
                  {/* Delete button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive transition-all duration-200 flex-shrink-0 rounded-md"
                    onClick={(e) => handleDeleteUrl(url, e)}
                    title="Delete URL"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
        
        {/* Expand/Collapse URLs button */}
        {collection.urlIds.length > DISPLAY_LIMIT && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-foreground h-auto py-1.5 px-0"
            onClick={() => setShowAllUrls(!showAllUrls)}
          >
            {showAllUrls ? (
              <>
                <ChevronDown className="mr-2 h-3 w-3 rotate-180" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-3 w-3" />
                ⋮ +{collection.urlIds.length - DISPLAY_LIMIT} more
              </>
            )}
          </Button>
        )}
      </div>
      
      <div className="text-base text-muted-foreground">
        {collection.urlIds.length} tabs
      </div>
    </div>
  );
}