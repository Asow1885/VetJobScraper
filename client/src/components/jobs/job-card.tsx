import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  MapPin, 
  Building2, 
  DollarSign, 
  Clock, 
  ExternalLink, 
  Medal,
  Check,
  X,
  Eye,
  MoreVertical
} from "lucide-react";
import { Job } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface JobCardProps {
  job: Job;
  onApprove?: (jobId: string) => void;
  onReject?: (jobId: string) => void;
  onView?: (jobId: string) => void;
  compact?: boolean;
}

const getSourceIcon = (source: string) => {
  const icons: Record<string, string> = {
    linkedin: "linkedin",
    indeed: "briefcase",
    glassdoor: "glass-martini",
    google: "search"
  };
  return icons[source] || "globe";
};

const getSourceColor = (source: string) => {
  const colors: Record<string, string> = {
    linkedin: "bg-blue-50 text-blue-700 border-blue-200",
    indeed: "bg-blue-50 text-blue-700 border-blue-200", 
    glassdoor: "bg-green-50 text-green-700 border-green-200",
    google: "bg-orange-50 text-orange-700 border-orange-200"
  };
  return colors[source] || "bg-gray-50 text-gray-700 border-gray-200";
};

export function JobCard({ job, onApprove, onReject, onView, compact = false }: JobCardProps) {
  const isVeteranFriendly = job.veteranKeywords && job.veteranKeywords.length > 0;
  const hasSalary = job.salaryMin || job.salaryMax;
  const scrapedDate = job.scrapedDate ? new Date(job.scrapedDate) : null;

  const formatSalary = () => {
    if (!hasSalary) return null;
    if (job.salaryMin && job.salaryMax) {
      return `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`;
    }
    if (job.salaryMin) return `$${job.salaryMin.toLocaleString()}+`;
    if (job.salaryMax) return `Up to $${job.salaryMax.toLocaleString()}`;
    return null;
  };

  return (
    <Card 
      className={`group hover:shadow-lg transition-all duration-200 border-l-4 ${
        isVeteranFriendly ? 'border-l-amber-400 bg-amber-50/30' : 'border-l-blue-400'
      } ${compact ? 'p-3' : 'p-0'}`}
      data-testid={`job-card-${job.id}`}
    >
      <CardContent className={compact ? "p-0" : "p-6"}>
        {/* Header with title, company, and quick actions */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 mb-2">
              <div className="flex-1">
                <h3 className={`font-bold text-foreground leading-tight ${
                  compact ? 'text-lg' : 'text-xl'
                } line-clamp-2 group-hover:text-primary transition-colors`}>
                  {job.title}
                </h3>
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
                      Veteran Friendly
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Keywords: {job.veteranKeywords?.join(", ")}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onView && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(job.id)}
                className="h-8 w-8 p-0"
                data-testid={`button-view-${job.id}`}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              data-testid={`button-menu-${job.id}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Key information row */}
        <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
          {job.location && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">{job.location}</span>
            </div>
          )}
          
          {hasSalary && (
            <div className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded-md border border-green-200">
              <DollarSign className="h-4 w-4 flex-shrink-0" />
              <span className="font-semibold">{formatSalary()}</span>
            </div>
          )}

          {job.jobType && job.jobType !== 'nan' && job.jobType !== 'None' && (
            <Badge variant="outline" className="capitalize">
              {job.jobType}
            </Badge>
          )}

          <Badge 
            variant="outline" 
            className={`capitalize ${getSourceColor(job.source)}`}
          >
            {job.source}
          </Badge>
        </div>

        {/* Description preview */}
        {job.description && job.description !== 'nan' && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
              {job.description}
            </p>
          </div>
        )}

        <Separator className="my-4" />

        {/* Footer with actions and metadata */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {scrapedDate && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Scraped {formatDistanceToNow(scrapedDate, { addSuffix: true })}</span>
              </div>
            )}
            
            <Badge 
              variant={job.status === 'pending' ? 'secondary' : 'default'}
              className={`text-xs ${
                job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                job.status === 'approved' ? 'bg-green-100 text-green-800' :
                job.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}
            >
              {job.status}
            </Badge>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {job.url && job.url !== 'nan' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(job.url, '_blank')}
                className="h-8 px-3 text-xs"
                data-testid={`button-external-${job.id}`}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Job
              </Button>
            )}

            {job.status === 'pending' && onApprove && onReject && (
              <div className="flex items-center gap-1">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onApprove(job.id)}
                  className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                  data-testid={`button-approve-${job.id}`}
                  title="Approve job"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReject(job.id)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  data-testid={`button-reject-${job.id}`}
                  title="Reject job"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}