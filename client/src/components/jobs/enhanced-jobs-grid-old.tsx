import { useState } from "react";
import { JobCard } from "./job-card";
import { JobsTable } from "./jobs-table";
import { JobsViewToggle, ViewMode } from "./jobs-view-toggle";
import { AdvancedFilters, AdvancedFilters as AdvancedFiltersType } from "./advanced-filters";
import { BulkOperations } from "./bulk-operations";
import { JobPreview } from "./job-preview";
import { Job } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  onBulkApprove?: (jobIds: string[]) => void;
  onBulkReject?: (jobIds: string[]) => void;
  onBulkDelete?: (jobIds: string[]) => void;
  onBulkPostToKaza?: (jobIds: string[]) => void;
  onSaveNote?: (jobId: string, note: string) => void;
  onSaveForLater?: (jobId: string) => void;
  onPostToKaza?: (jobId: string) => void;
}

export function EnhancedJobsGrid({ 
  jobs, 
  isLoading = false, 
  onApprove, 
  onReject, 
  onView,
  onRefresh,
  onBulkApprove,
  onBulkReject,
  onBulkDelete,
  onBulkPostToKaza,
  onSaveNote,
  onSaveForLater,
  onPostToKaza
}: EnhancedJobsGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [previewJob, setPreviewJob] = useState<Job | null>(null);
  const [savedSearches, setSavedSearches] = useState<Array<{ name: string; filters: AdvancedFiltersType }>>([]);
  
  const [filters, setFilters] = useState<AdvancedFiltersType>({
    search: "",
    sources: [],
    jobTypes: [],
    locations: [],
    salaryRange: [0, 200000],
    veteranFriendly: null,
    dateRange: { from: null, to: null },
    status: []
  });

  // Filter jobs based on current filters
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = filters.search === "" || 
      job.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      job.company.toLowerCase().includes(filters.search.toLowerCase()) ||
      job.location?.toLowerCase().includes(filters.search.toLowerCase()) ||
      job.description?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesSource = filters.sources.length === 0 || filters.sources.includes(job.source);
    const matchesJobType = filters.jobTypes.length === 0 || 
      (job.jobType && filters.jobTypes.includes(job.jobType));
    const matchesLocation = filters.locations.length === 0 || 
      (job.location && filters.locations.some(loc => job.location?.includes(loc)));
    const matchesStatus = filters.status.length === 0 || filters.status.includes(job.status || 'pending');
    
    const matchesSalary = !job.salaryMin || !job.salaryMax || 
      (job.salaryMin >= filters.salaryRange[0] && job.salaryMax <= filters.salaryRange[1]);
    
    const matchesVeteran = filters.veteranFriendly === null || 
      (filters.veteranFriendly === true && job.veteranKeywords && job.veteranKeywords.length > 0) ||
      (filters.veteranFriendly === false && (!job.veteranKeywords || job.veteranKeywords.length === 0));

    return matchesSearch && matchesSource && matchesJobType && matchesLocation && 
           matchesStatus && matchesSalary && matchesVeteran;
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
      {/* Advanced Filters */}
      <AdvancedFilters
        jobs={jobs}
        filters={filters}
        onFiltersChange={setFilters}
        onSaveSearch={(name, filters) => {
          setSavedSearches(prev => [...prev, { name, filters }]);
        }}
        savedSearches={savedSearches}
        onLoadSearch={setFilters}
      />

      {/* View Toggle */}
      <JobsViewToggle 
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalJobs={jobs.length}
        filteredJobs={filteredJobs.length}
        isLoading={isLoading}
      />

      {/* Bulk Operations */}
      {selectedJobs.length > 0 && (
        <BulkOperations
          selectedJobs={selectedJobs}
          allJobs={filteredJobs}
          onSelectAll={(checked) => {
            if (checked) {
              setSelectedJobs(filteredJobs.map(job => job.id));
            } else {
              setSelectedJobs([]);
            }
          }}
          onBulkApprove={onBulkApprove || (() => {})}
          onBulkReject={onBulkReject || (() => {})}
          onBulkDelete={onBulkDelete || (() => {})}
          onBulkPostToKaza={onBulkPostToKaza || (() => {})}
          onClearSelection={() => setSelectedJobs([])}
        />
      )}

      {/* Jobs Display */}
      {filteredJobs.length === 0 ? (
        <EmptyState />
      ) : viewMode === 'cards' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <div key={job.id} className="relative">
                <div className="absolute top-3 left-3 z-10">
                  <Checkbox
                    checked={selectedJobs.includes(job.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedJobs(prev => [...prev, job.id]);
                      } else {
                        setSelectedJobs(prev => prev.filter(id => id !== job.id));
                      }
                    }}
                    className="bg-white/90 backdrop-blur-sm"
                    data-testid={`checkbox-select-${job.id}`}
                  />
                </div>
                <JobCard
                  job={job}
                  onApprove={onApprove}
                  onReject={onReject}
                  onView={(jobId) => {
                    const job = jobs.find(j => j.id === jobId);
                    if (job) setPreviewJob(job);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <JobsTable 
          jobs={filteredJobs}
          onApprove={onApprove}
          onReject={onReject}
          onView={(jobId) => {
            const job = jobs.find(j => j.id === jobId);
            if (job) setPreviewJob(job);
          }}
        />
      )}

      {/* Job Preview Modal */}
      {previewJob && (
        <JobPreview
          job={previewJob}
          isOpen={!!previewJob}
          onClose={() => setPreviewJob(null)}
          onApprove={onApprove}
          onReject={onReject}
          onSaveNote={onSaveNote}
          onSaveForLater={onSaveForLater}
          onPostToKaza={onPostToKaza}
        />
      )}
    </div>
  );
}