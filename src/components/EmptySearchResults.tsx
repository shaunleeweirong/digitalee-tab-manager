import { SearchX } from 'lucide-react';

interface EmptySearchResultsProps {
  query: string;
}

export function EmptySearchResults({ query }: EmptySearchResultsProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <SearchX className="w-12 h-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">No results found</h3>
      <p className="text-muted-foreground max-w-md">
        No collections or URLs match "{query}". Try a different search term or check your spelling.
      </p>
    </div>
  );
}