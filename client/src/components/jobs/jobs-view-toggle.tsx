import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type ViewMode = 'cards' | 'table';

interface JobsViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalJobs?: number;
  filteredJobs?: number;
  isLoading?: boolean;
}

export function JobsViewToggle({ 
  viewMode, 
  onViewModeChange, 
  totalJobs = 0, 
  filteredJobs,
  isLoading = false 
}: JobsViewToggleProps) {
  const showingCount = filteredJobs ?? totalJobs;
  
  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Showing {isLoading ? '...' : showingCount.toLocaleString()} 
            {filteredJobs !== undefined && filteredJobs !== totalJobs && (
              <span> of {totalJobs.toLocaleString()}</span>
            )} job{showingCount !== 1 ? 's' : ''}
          </span>
        </div>
        
        {filteredJobs !== undefined && filteredJobs !== totalJobs && (
          <Badge variant="secondary" className="text-xs">
            Filtered
          </Badge>
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