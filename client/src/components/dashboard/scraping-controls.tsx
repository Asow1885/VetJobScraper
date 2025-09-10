import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Play, AlertTriangle, CheckCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function ScrapingControls() {
  const [maxJobs, setMaxJobs] = useState(20);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const scrapingMutation = useMutation({
    mutationFn: async (data: { maxJobs: number }) => {
      const response = await fetch('/api/scrape/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to start scraping');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Scraping Started",
        description: `Job scraping initiated for ${maxJobs} jobs across multiple sources.`,
        variant: "default",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Scraping Failed",
        description: error.message || "Failed to start job scraping. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleStartScraping = () => {
    if (maxJobs < 1 || maxJobs > 100) {
      toast({
        title: "Invalid Input",
        description: "Please enter a number between 1 and 100.",
        variant: "destructive",
      });
      return;
    }
    scrapingMutation.mutate({ maxJobs });
  };

  return (
    <Card data-testid="scraping-controls">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Job Scraping Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="maxJobs">Maximum Jobs to Scrape</Label>
          <Input
            id="maxJobs"
            type="number"
            min="1"
            max="100"
            value={maxJobs}
            onChange={(e) => setMaxJobs(parseInt(e.target.value) || 1)}
            disabled={scrapingMutation.isPending}
            data-testid="input-max-jobs"
          />
          <p className="text-sm text-muted-foreground">
            Jobs will be scraped from LinkedIn, Indeed, and other sources internationally.
          </p>
        </div>

        {scrapingMutation.isPending && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Scraping in progress... This may take a few minutes.
            </AlertDescription>
          </Alert>
        )}

        {scrapingMutation.isError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to start scraping. Please check your connection and try again.
            </AlertDescription>
          </Alert>
        )}

        {scrapingMutation.isSuccess && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Scraping started successfully! Check the jobs list for new results.
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleStartScraping}
          disabled={scrapingMutation.isPending}
          className="w-full"
          data-testid="button-start-scraping"
        >
          {scrapingMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scraping...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Start Scraping
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Searches across {maxJobs <= 10 ? '3' : maxJobs <= 50 ? '6' : '12'} different job categories</p>
          <p>• Covers major international markets (US, Canada, UK, EU, Asia-Pacific)</p>
          <p>• Automatically detects veteran-friendly positions</p>
          <p>• Rate limited to prevent service blocking</p>
        </div>
      </CardContent>
    </Card>
  );
}