import type { SearchResult } from '@/types';
import { SearchResultItem } from './SearchResultItem';
import { EmptySearchResults } from './EmptySearchResults';
import { RecentURLs } from './RecentURLs';
import { Search } from 'lucide-react';

interface SearchResultsProps {
  query: string;
  results: SearchResult[];
  recentUrls: SearchResult[];
  isSearching: boolean;
  onOpenURL?: (url: string) => void;
  onNavigateToCollection?: (collectionId: string) => void;
}

export function SearchResults({ 
  query, 
  results, 
  recentUrls, 
  isSearching, 
  onOpenURL, 
  onNavigateToCollection 
}: SearchResultsProps) {
  // Show loading state
  if (isSearching) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Search className="w-4 h-4 animate-pulse" />
          <span>Searching...</span>
        </div>
      </div>
    );
  }

  // Empty query - show recent URLs
  if (!query.trim()) {
    return (
      <RecentURLs
        recentUrls={recentUrls}
        onOpenURL={onOpenURL}
        onNavigateToCollection={onNavigateToCollection}
      />
    );
  }

  // No results found
  if (results.length === 0) {
    return <EmptySearchResults query={query} />;
  }

  // Group results by type
  const urlResults = results.filter(r => r.type === 'url');
  const collectionResults = results.filter(r => r.type === 'collection');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Search className="w-4 h-4" />
        <span>Found {results.length} result{results.length === 1 ? '' : 's'} for "{query}"</span>
      </div>

      {/* Collection Results */}
      {collectionResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Collections ({collectionResults.length})
          </h3>
          <div className="space-y-1">
            {collectionResults.map((result) => (
              <SearchResultItem
                key={result.id}
                result={result}
                onOpenURL={onOpenURL}
                onNavigateToCollection={onNavigateToCollection}
              />
            ))}
          </div>
        </div>
      )}

      {/* URL Results */}
      {urlResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            URLs ({urlResults.length})
          </h3>
          <div className="space-y-1">
            {urlResults.map((result) => (
              <SearchResultItem
                key={result.id}
                result={result}
                onOpenURL={onOpenURL}
                onNavigateToCollection={onNavigateToCollection}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}