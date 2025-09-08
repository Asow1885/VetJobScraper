import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2, Search } from "lucide-react";
import { useJobs } from "@/hooks/use-jobs";
import { Job } from "@shared/schema";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

const sourceIcons: Record<string, string> = {
  linkedin: "fab fa-linkedin-in",
  indeed: "fas fa-briefcase", 
  glassdoor: "fas fa-glass-whiskey",
  google: "fab fa-google"
};

function JobRow({ job }: { job: Job }) {
  const sourceIcon = sourceIcons[job.source] || "fas fa-globe";
  const isVeteranFriendly = job.veteranKeywords && job.veteranKeywords.length > 0;
  
  return (
    <tr className="hover:bg-muted/30 transition-colors" data-testid={`job-row-${job.id}`}>
      <td className="px-6 py-4">
        <div className="flex items-center">
          <div className="flex-1">
            <p className="font-medium text-foreground">{job.title}</p>
            <div className="flex items-center space-x-2 mt-1">
              {isVeteranFriendly && (
                <Badge variant="secondary" className="bg-accent/10 text-accent">
                  Veteran Friendly
                </Badge>
              )}
              {job.jobType && (
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  {job.jobType}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-foreground">{job.company}</td>
      <td className="px-6 py-4 text-sm text-muted-foreground">{job.location || 'Remote'}</td>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <i className={`${sourceIcon} text-primary`}></i>
          <span className="text-sm text-muted-foreground capitalize">{job.source}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <Badge 
          variant={job.postedToKaza ? "default" : "secondary"}
          className={job.postedToKaza ? "bg-accent/10 text-accent" : "bg-yellow-100 text-yellow-800"}
        >
          {job.postedToKaza ? "Posted to KazaConnect" : "Pending Review"}
        </Badge>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" data-testid={`button-view-${job.id}`}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" data-testid={`button-edit-${job.id}`}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" data-testid={`button-delete-${job.id}`}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function JobsTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  const { data: jobs = [], isLoading } = useJobs({
    source: sourceFilter && sourceFilter !== 'all' ? sourceFilter : undefined,
    status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
    limit: 10
  });

  const filteredJobs = jobs.filter(job => 
    searchTerm === "" || 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card data-testid="jobs-table">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Jobs</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
                data-testid="input-search-jobs"
              />
              <Button size="sm" data-testid="button-search">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-40" data-testid="select-source-filter">
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
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Job Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="animate-pulse">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No jobs found
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <JobRow key={job.id} job={job} />
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing 1-{Math.min(10, filteredJobs.length)} of {filteredJobs.length} jobs
            </p>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled data-testid="button-previous">
                Previous
              </Button>
              <Button variant="default" size="sm" data-testid="button-page-1">
                1
              </Button>
              <Button variant="outline" size="sm" data-testid="button-next">
                Next
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
