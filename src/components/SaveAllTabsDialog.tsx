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

interface SaveAllTabsDialogProps {
  open: boolean;
  tabCount: number;
  onSave: (collectionName: string) => Promise<void>;
  onClose: () => void;
}

export function SaveAllTabsDialog({
  open,
  tabCount,
  onSave,
  onClose,
}: SaveAllTabsDialogProps) {
  const [collectionName, setCollectionName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!collectionName.trim()) return;

    setIsSaving(true);
    try {
      await onSave(collectionName.trim());
      handleClose();
    } catch (error) {
      console.error('Failed to save all tabs:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setCollectionName('');
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
          <DialogTitle>Save all open tabs</DialogTitle>
          <DialogDescription>
            Create a new collection with all {tabCount} currently open tabs.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Collection name</label>
            <Input
              placeholder="Enter collection name..."
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !collectionName.trim()}
          >
            {isSaving ? 'Saving...' : `Save ${tabCount} tabs`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
