import { Button } from "@/components/ui/button";
import { Download, Play, Bell } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  title: string;
  description: string;
}

export function Header({ title, description }: HeaderProps) {
  const { toast } = useToast();

  const handleRunScraper = async () => {
    try {
      await apiRequest("POST", "/api/scrape/run", { maxJobs: 50 });
      toast({
        title: "Scraper Started",
        description: "Job scraping has been initiated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start scraper. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch("/api/jobs");
      const jobs = await response.json();
      
      const { convertJobsToCSV, downloadFile } = await import("@/lib/exportUtils");
      const csv = convertJobsToCSV(jobs);
      const timestamp = new Date().toISOString().split('T')[0];
      downloadFile(csv, `jobs-export-${timestamp}.csv`, 'text/csv');

      toast({
        title: "Export Complete",
        description: `Exported ${jobs.length} jobs to CSV successfully.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="secondary" 
            onClick={handleExportData}
            data-testid="button-export"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <Button 
            onClick={handleRunScraper}
            data-testid="button-run-scraper"
          >
            <Play className="mr-2 h-4 w-4" />
            Run Scraper
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            data-testid="button-notifications"
          >
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
