import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collection } from '@/types';
import { OpenTab } from '@/lib/tabs';

interface SaveTabDialogProps {
  open: boolean;
  tab: OpenTab | null;
  collections: Record<string, Collection>;
  onSave: (tabUrl: string, tabTitle: string, collectionId: string) => Promise<void>;
  onCreateAndSave: (tabUrl: string, tabTitle: string, collectionName: string) => Promise<void>;
  onClose: () => void;
}

export function SaveTabDialog({
  open,
  tab,
  collections,
  onSave,
  onCreateAndSave,
  onClose,
}: SaveTabDialogProps) {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const collectionsList = Object.values(collections).sort(
    (a, b) => a.position - b.position
  );

  const handleSave = async () => {
    if (!tab) return;

    if (isCreatingNew) {
      if (!newCollectionName.trim()) return;
      setIsSaving(true);
      try {
        await onCreateAndSave(tab.url, tab.title, newCollectionName.trim());
        handleClose();
      } catch (error) {
        console.error('Failed to save tab:', error);
      } finally {
        setIsSaving(false);
      }
    } else if (selectedCollectionId) {
      setIsSaving(true);
      try {
        await onSave(tab.url, tab.title, selectedCollectionId);
        handleClose();
      } catch (error) {
        console.error('Failed to save tab:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleClose = () => {
    setSelectedCollectionId(null);
    setIsCreatingNew(false);
    setNewCollectionName('');
    setIsSaving(false);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] max-w-[90vw]" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>Save tab to collection</DialogTitle>
          <DialogDescription>
            Choose an existing collection or create a new one to save this tab.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {!isCreatingNew && (
            <>
              {/* Collection list */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {collectionsList.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => setSelectedCollectionId(collection.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                      selectedCollectionId === collection.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    <div className="font-medium">{collection.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {collection.urlIds.length} tabs
                    </div>
                  </button>
                ))}

                {collectionsList.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No collections yet
                  </div>
                )}
              </div>

              {/* Create new collection button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsCreatingNew(true)}
              >
                + Create new collection
              </Button>
            </>
          )}

          {isCreatingNew && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Collection name</label>
                <Input
                  placeholder="Enter collection name..."
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  autoFocus
                />
              </div>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setIsCreatingNew(false);
                  setNewCollectionName('');
                }}
              >
                ← Back to collections
              </Button>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              isSaving ||
              (!isCreatingNew && !selectedCollectionId) ||
              (isCreatingNew && !newCollectionName.trim())
            }
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
