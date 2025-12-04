/**
 * Delete collection confirmation dialog
 * Shows warning about deleting collection and all its tabs
 */

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Collection } from '@/types';

interface DeleteCollectionDialogProps {
  open: boolean;
  collection: Collection | null;
  tabCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteCollectionDialog({
  open,
  collection,
  tabCount,
  onConfirm,
  onCancel,
}: DeleteCollectionDialogProps) {
  if (!collection) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onConfirm();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[425px] max-w-[90vw]" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>Delete Collection</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>"{collection.name}"</strong>?
            {tabCount > 0 && (
              <>
                <br />
                This will permanently delete {tabCount} saved tab{tabCount !== 1 ? 's' : ''}.
              </>
            )}
            <br />
            <br />
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete Collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}