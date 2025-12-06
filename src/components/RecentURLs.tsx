import type { SearchResult } from '@/types';
import { SearchResultItem } from './SearchResultItem';
import { Clock } from 'lucide-react';

interface RecentURLsProps {
  recentUrls: SearchResult[];
  onOpenURL?: (url: string) => void;
  onNavigateToCollection?: (collectionId: string) => void;
}

export function RecentURLs({ recentUrls, onOpenURL, onNavigateToCollection }: RecentURLsProps) {
  if (recentUrls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Clock className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No recent URLs</h3>
        <p className="text-muted-foreground">
          Start saving tabs to see your recently accessed URLs here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Recently Accessed
      </h3>
      <div className="space-y-1">
        {recentUrls.map((result) => (
          <SearchResultItem
            key={result.id}
            result={result}
            onOpenURL={onOpenURL}
            onNavigateToCollection={onNavigateToCollection}
          />
        ))}
      </div>
    </div>
  );
}