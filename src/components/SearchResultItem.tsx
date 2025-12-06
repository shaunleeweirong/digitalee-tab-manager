import type { SearchResult } from '@/types';
import { ExternalLink, Folder } from 'lucide-react';

interface SearchResultItemProps {
  result: SearchResult;
  onOpenURL?: (url: string) => void;
  onNavigateToCollection?: (collectionId: string) => void;
}

export function SearchResultItem({ result, onOpenURL, onNavigateToCollection }: SearchResultItemProps) {
  const handleClick = () => {
    if (result.type === 'url' && result.url && onOpenURL) {
      onOpenURL(result.url);
    } else if (result.type === 'collection' && onNavigateToCollection) {
      onNavigateToCollection(result.collectionId);
    }
  };

  if (result.type === 'url') {
    return (
      <div
        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer group transition-colors"
        onClick={handleClick}
      >
        {/* Favicon */}
        <div className="flex-shrink-0 w-4 h-4">
          {result.favicon ? (
            <img
              src={result.favicon}
              alt=""
              className="w-4 h-4 rounded-sm"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-4 h-4 rounded-sm bg-muted" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Title with custom name fallback */}
            <span className="font-medium text-sm truncate">
              {result.customName || result.title}
            </span>
            <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          
          {/* URL */}
          <div className="text-xs text-muted-foreground truncate">
            {result.url}
          </div>
        </div>

        {/* Collection badge */}
        <div className="flex-shrink-0">
          <div className="px-2 py-1 text-xs bg-muted rounded text-muted-foreground">
            {result.collectionName}
          </div>
        </div>
      </div>
    );
  }

  // Collection result
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer group transition-colors"
      onClick={handleClick}
    >
      {/* Collection icon */}
      <div className="flex-shrink-0">
        <Folder className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <span className="font-medium text-sm">{result.title}</span>
        <div className="text-xs text-muted-foreground">
          Collection
        </div>
      </div>
    </div>
  );
}