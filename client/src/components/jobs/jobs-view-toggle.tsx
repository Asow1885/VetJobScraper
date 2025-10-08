import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type ViewMode = 'cards' | 'table';

interface JobsViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalJobs?: number;
  filteredJobs?: number;
  isLoading?: boolean;
  onClearFilters?: () => void;
}

export function JobsViewToggle({ 
  viewMode, 
  onViewModeChange, 
  totalJobs = 0, 
  filteredJobs,
  isLoading = false,
  onClearFilters
}: JobsViewToggleProps) {
  const showingCount = filteredJobs ?? totalJobs;
  const hasFilters = filteredJobs !== undefined && filteredJobs !== totalJobs;
  
  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Showing {isLoading ? '...' : showingCount.toLocaleString()} 
            {hasFilters && (
              <span> of {totalJobs.toLocaleString()}</span>
            )} job{showingCount !== 1 ? 's' : ''}
          </span>
        </div>
        
        {hasFilters && (
          <>
            <Badge variant="secondary" className="text-xs">
              Filtered
            </Badge>
            {onClearFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                data-testid="button-clear-filters"
              >
                <X className="h-3 w-3 mr-1" />
                Clear Filters
              </Button>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-1 bg-background rounded-md p-1 border">
        <Button
          variant={viewMode === 'cards' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('cards')}
          className="h-8 px-3 text-xs"
          data-testid="button-view-cards"
        >
          <LayoutGrid className="h-4 w-4 mr-1" />
          Cards
        </Button>
        <Button
          variant={viewMode === 'table' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('table')}
          className="h-8 px-3 text-xs"
          data-testid="button-view-table"
        >
          <List className="h-4 w-4 mr-1" />
          Table
        </Button>
      </div>
    </div>
  );
}