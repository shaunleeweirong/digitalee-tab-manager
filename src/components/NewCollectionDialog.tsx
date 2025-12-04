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

interface NewCollectionDialogProps {
  open: boolean;
  onSave: (collectionName: string) => Promise<void>;
  onClose: () => void;
}

export function NewCollectionDialog({
  open,
  onSave,
  onClose,
}: NewCollectionDialogProps) {
  const [collectionName, setCollectionName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!collectionName.trim()) return;

    setIsSaving(true);
    try {
      await onSave(collectionName.trim());
      handleClose();
    } catch (error) {
      console.error('Failed to create collection:', error);
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
          <DialogTitle>Create new collection</DialogTitle>
          <DialogDescription>
            Create an empty collection to organize your tabs.
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
            {isSaving ? 'Creating...' : 'Create Collection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
