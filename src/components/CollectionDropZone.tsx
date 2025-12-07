import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Collection } from '@/types';
import { CollectionCard } from './CollectionCard';
import type { SavedURL } from '@/types';

interface CollectionDropZoneProps {
  collection: Collection;
  urls: Record<string, SavedURL>;
  onRename: (collectionId: string, newName: string) => void;
  onDelete: (collectionId: string) => void;
  onUpdateURL: (urlId: string, newCustomName: string) => void;
  onDeleteURL: (urlId: string, collectionId: string) => void;
}

export function CollectionDropZone({ collection, urls, onRename, onDelete, onUpdateURL, onDeleteURL }: CollectionDropZoneProps) {
  // Sortable for collection reordering
  const {
    attributes,
    listeners,
    setNodeRef: setSortableNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: collection.id,
    data: {
      type: 'collection',
      collection,
    }
  });

  // Droppable for tab drops
  const {
    isOver,
    setNodeRef: setDroppableNodeRef,
  } = useDroppable({
    id: `collection-drop-${collection.id}`,
    data: {
      type: 'collection',
      collection,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setDroppableNodeRef}
      className={`${isOver ? 'ring-2 ring-primary bg-primary/5 rounded-xl' : ''}`}
    >
      <div
        ref={setSortableNodeRef}
        style={style}
        className={isDragging ? 'opacity-50' : ''}
        {...attributes}
        {...listeners}
      >
        <CollectionCard
          collection={collection}
          urls={urls}
          onRename={onRename}
          onDelete={onDelete}
          onUpdateURL={onUpdateURL}
          onDeleteURL={onDeleteURL}
        />
      </div>
    </div>
  );
}