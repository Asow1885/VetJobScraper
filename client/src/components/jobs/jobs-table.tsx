import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Check, X, ExternalLink, Medal, MapPin, DollarSign, Building2 } from "lucide-react";
import { Job } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const sourceIcons: Record<string, string> = {
  linkedin: "fab fa-linkedin-in",
  indeed: "fas fa-briefcase", 
  glassdoor: "fas fa-glass-whiskey",
  google: "fab fa-google"
};

interface JobRowProps {
  job: Job;
  onApprove?: (jobId: string) => void;
  onReject?: (jobId: string) => void;
  onView?: (jobId: string) => void;
}

function JobRow({ job, onApprove, onReject, onView }: JobRowProps) {
  const isVeteranFriendly = job.veteranKeywords && job.veteranKeywords.length > 0;
  const hasSalary = job.salaryMin || job.salaryMax;

  const formatSalary = () => {
    if (!hasSalary) return null;
    if (job.salaryMin && job.salaryMax) {
      return `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`;
    }
    if (job.salaryMin) return `$${job.salaryMin.toLocaleString()}+`;
    if (job.salaryMax) return `Up to $${job.salaryMax.toLocaleString()}`;
    return null;
  };

  const getStatusBadge = () => {
    switch (job.status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Rejected</Badge>;
      case 'posted':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Posted</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending Review</Badge>;
    }
  };
  
  return (
    <tr className={`hover:bg-muted/30 transition-colors border-l-4 ${
      isVeteranFriendly ? 'border-l-amber-400 bg-amber-50/20' : 'border-l-blue-400'
    }`} data-testid={`job-row-${job.id}`}>
      {/* Title & Company */}
      <td className="px-6 py-4">
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground text-lg leading-tight line-clamp-2">
                {job.title}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground font-medium">{job.company}</span>
              </div>
            </div>
            {isVeteranFriendly && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 flex items-center gap-1">
                    <Medal className="h-3 w-3" />
                    Veteran
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Keywords: {job.veteranKeywords?.join(", ")}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {job.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{job.location}</span>
              </div>
            )}
            
            {hasSalary && (
              <div className="flex items-center gap-1 text-sm text-green-700 bg-green-50 px-2 py-1 rounded-md border border-green-200">
                <DollarSign className="h-3 w-3" />
                <span className="font-semibold">{formatSalary()}</span>
              </div>
            )}

            {job.jobType && job.jobType !== 'nan' && job.jobType !== 'None' && (
              <Badge variant="outline" className="text-xs capitalize">
                {job.jobType}
              </Badge>
            )}
          </div>
        </div>
      </td>

      {/* Source */}
      <td className="px-6 py-4">
        <Badge variant="outline" className="capitalize">
          {job.source}
        </Badge>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        {getStatusBadge()}
      </td>

      {/* Scraped Date */}
      <td className="px-6 py-4 text-sm text-muted-foreground">
        {job.scrapedDate ? formatDistanceToNow(new Date(job.scrapedDate), { addSuffix: true }) : 'Unknown'}
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-1">
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(job.id)}
              data-testid={`button-view-${job.id}`}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}

          {job.url && job.url !== 'nan' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(job.url, '_blank')}
              data-testid={`button-external-${job.id}`}
              className="h-8 w-8 p-0"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}

          {job.status === 'pending' && onApprove && onReject && (
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReject(job.id)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                data-testid={`button-reject-${job.id}`}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onApprove(job.id)}
                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                data-testid={`button-approve-${job.id}`}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

interface JobsTableProps {
  jobs?: Job[];
  isLoading?: boolean;
  onApprove?: (jobId: string) => void;
  onReject?: (jobId: string) => void;
  onView?: (jobId: string) => void;
}

export function JobsTable({ 
  jobs = [], 
  isLoading = false, 
  onApprove, 
  onReject, 
  onView 
}: JobsTableProps) {
  return (
    <Card data-testid="jobs-table" className="overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Job Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Scraped
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={5} className="px-6 py-6">
                      <div className="animate-pulse flex items-center space-x-4">
                        <div className="space-y-2 flex-1">
                          <div className="h-5 bg-muted rounded w-3/4"></div>
                          <div className="h-4 bg-muted rounded w-1/2"></div>
                          <div className="flex space-x-2">
                            <div className="h-3 bg-muted rounded w-16"></div>
                            <div className="h-3 bg-muted rounded w-20"></div>
                          </div>
                        </div>
                        <div className="h-6 bg-muted rounded w-16"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center space-y-2">
                      <Eye className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground font-medium">No jobs to display</p>
                      <p className="text-sm text-muted-foreground">Adjust your filters or run a new scrape to see jobs here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <JobRow 
                    key={job.id} 
                    job={job} 
                    onApprove={onApprove}
                    onReject={onReject}
                    onView={onView}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
