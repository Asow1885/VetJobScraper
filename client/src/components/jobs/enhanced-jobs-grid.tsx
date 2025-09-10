import { useState } from "react";
import { JobCard } from "./job-card";
import { JobsTable } from "./jobs-table";
import { JobsViewToggle, ViewMode } from "./jobs-view-toggle";
import { Job } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, RefreshCw, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrapingControls } from "@/components/dashboard/scraping-controls";

interface EnhancedJobsGridProps {
  jobs: Job[];
  isLoading?: boolean;
  onApprove?: (jobId: string) => void;
  onReject?: (jobId: string) => void;
  onView?: (jobId: string) => void;
  onRefresh?: () => void;
}

export function EnhancedJobsGrid({ 
  jobs, 
  isLoading = false, 
  onApprove, 
  onReject, 
  onView,
  onRefresh 
}: EnhancedJobsGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [veteranFilter, setVeteranFilter] = useState("all");

  // Filter jobs based on current filters
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = searchTerm === "" || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSource = sourceFilter === "all" || job.source === sourceFilter;
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    const matchesVeteran = veteranFilter === "all" || 
      (veteranFilter === "veteran" && job.veteranKeywords && job.veteranKeywords.length > 0) ||
      (veteranFilter === "regular" && (!job.veteranKeywords || job.veteranKeywords.length === 0));

    return matchesSearch && matchesSource && matchesStatus && matchesVeteran;
  });

  const LoadingState = () => (
    <div className="space-y-4">
      <div className="text-center py-8">
        <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Scanning LinkedIn for software engineer positions...
        </h3>
        <p className="text-sm text-muted-foreground">
          Please wait while we gather the latest job opportunities from multiple sources.
        </p>
      </div>
      
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-3 p-6 border rounded-lg">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 border rounded">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/6" />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
        <Search className="h-12 w-12 text-muted-foreground" />
      </div>
      
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {searchTerm || sourceFilter !== "all" || statusFilter !== "all" || veteranFilter !== "all" 
          ? "No jobs match your filters" 
          : "No jobs yet? Let's get started!"
        }
      </h3>
      
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {searchTerm || sourceFilter !== "all" || statusFilter !== "all" || veteranFilter !== "all"
          ? "Try adjusting your filters or search terms to find more opportunities."
          : "Start by running a job scrape to discover the latest opportunities from top platforms like LinkedIn, Indeed, and more."
        }
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        {(!searchTerm && sourceFilter === "all" && statusFilter === "all" && veteranFilter === "all") ? (
          <div className="w-full max-w-md">
            <ScrapingControls />
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSourceFilter("all");
                setStatusFilter("all");
                setVeteranFilter("all");
              }}
            >
              Clear Filters
            </Button>
            {onRefresh && (
              <Button onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Jobs
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const ErrorState = () => (
    <Alert className="border-orange-200 bg-orange-50">
      <Zap className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800">
        <div className="space-y-2">
          <p className="font-medium">Scraping encountered an issue</p>
          <p className="text-sm">
            Don't worry! This often happens due to rate limiting from job platforms. 
          </p>
          <div className="flex gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={onRefresh}>
              Try Again
            </Button>
            <Button variant="outline" size="sm">
              Check Logs
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search jobs by title, company, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-jobs"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-source-filter">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="indeed">Indeed</SelectItem>
              <SelectItem value="glassdoor">Glassdoor</SelectItem>
              <SelectItem value="google">Google Jobs</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]" data-testid="select-status-filter">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={veteranFilter} onValueChange={setVeteranFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-veteran-filter">
              <SelectValue placeholder="All Jobs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              <SelectItem value="veteran">Veteran Friendly</SelectItem>
              <SelectItem value="regular">Regular Jobs</SelectItem>
            </SelectContent>
          </Select>

          {onRefresh && (
            <Button variant="outline" onClick={onRefresh} data-testid="button-refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* View Toggle */}
      <JobsViewToggle 
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalJobs={jobs.length}
        filteredJobs={filteredJobs.length}
        isLoading={isLoading}
      />

      {/* Jobs Display */}
      {filteredJobs.length === 0 ? (
        <EmptyState />
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onApprove={onApprove}
              onReject={onReject}
              onView={onView}
            />
          ))}
        </div>
      ) : (
        <JobsTable 
          jobs={filteredJobs}
          onApprove={onApprove}
          onReject={onReject}
          onView={onView}
        />
      )}
    </div>
  );
}