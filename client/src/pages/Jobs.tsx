import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  Filter, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  Settings,
  TrendingUp
} from "lucide-react";
import { EnhancedJobsGrid } from "@/components/jobs/enhanced-jobs-grid";
import { useJobs } from "@/hooks/use-jobs";
import { useJobApproval } from "@/hooks/use-job-approval";
import { useToast } from "@/hooks/use-toast";
import { ScrapingControls } from "@/components/dashboard/scraping-controls";

export default function Jobs() {
  const [activeTab, setActiveTab] = useState("all");
  const { data: jobs = [], isLoading, refetch } = useJobs();
  const { approveJob, rejectJob, isApproving, isRejecting } = useJobApproval();
  const { toast } = useToast();

  // Filter jobs based on active tab
  const filteredJobs = jobs.filter(job => {
    switch (activeTab) {
      case 'pending':
        return job.status === 'pending';
      case 'approved':
        return job.status === 'approved';
      case 'rejected':
        return job.status === 'rejected';
      case 'veteran':
        return job.veteranKeywords && job.veteranKeywords.length > 0;
      default:
        return true;
    }
  });

  const handleApprove = async (jobId: string) => {
    try {
      await approveJob(jobId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve job. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (jobId: string) => {
    try {
      await rejectJob(jobId);
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to reject job. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Jobs Refreshed",
      description: "Job list has been updated with the latest data.",
    });
  };

  // Calculate stats for tabs
  const stats = {
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    approved: jobs.filter(j => j.status === 'approved').length,
    rejected: jobs.filter(j => j.status === 'rejected').length,
    veteran: jobs.filter(j => j.veteranKeywords && j.veteranKeywords.length > 0).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Management</h1>
          <p className="text-muted-foreground">
            Review, approve, and manage scraped job opportunities
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            data-testid="button-refresh-jobs"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <ScrapingControls />
          
          <Button variant="outline" data-testid="button-export-jobs">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold" data-testid="stat-total-jobs">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-700" data-testid="stat-pending-jobs">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-700" data-testid="stat-approved-jobs">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-700" data-testid="stat-rejected-jobs">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Badge className="bg-amber-100 text-amber-800 border-amber-300 h-4 w-4 p-0 flex items-center justify-center">
                <span className="text-xs">V</span>
              </Badge>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Veteran Friendly</p>
                <p className="text-2xl font-bold text-amber-700" data-testid="stat-veteran-jobs">{stats.veteran}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Tabs and List */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" data-testid="tab-all-jobs">
            All Jobs
            <Badge variant="secondary" className="ml-2">{stats.total}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending-jobs">
            Pending
            <Badge variant="secondary" className="ml-2">{stats.pending}</Badge>
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved-jobs">
            Approved
            <Badge variant="secondary" className="ml-2">{stats.approved}</Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected-jobs">
            Rejected
            <Badge variant="secondary" className="ml-2">{stats.rejected}</Badge>
          </TabsTrigger>
          <TabsTrigger value="veteran" data-testid="tab-veteran-jobs">
            Veteran Friendly
            <Badge variant="secondary" className="ml-2">{stats.veteran}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <EnhancedJobsGrid
            jobs={filteredJobs}
            isLoading={isLoading}
            onApprove={handleApprove}
            onReject={handleReject}
            onRefresh={handleRefresh}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}