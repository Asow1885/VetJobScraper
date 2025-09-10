import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Activity,
  Globe,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";

interface ScrapingProgress {
  id: string;
  source: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  jobsFound: number;
  estimatedTime?: number;
  error?: string;
}

interface SourcePerformance {
  source: string;
  successRate: number;
  avgJobsPerScrape: number;
  lastScrape: Date | null;
  totalJobs: number;
}

interface ScrapingProgressProps {
  isActive: boolean;
  currentScrapes: ScrapingProgress[];
  sourcePerformance: SourcePerformance[];
  onCancel?: () => void;
}

export function ScrapingProgress({ 
  isActive, 
  currentScrapes, 
  sourcePerformance,
  onCancel 
}: ScrapingProgressProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status: ScrapingProgress['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: ScrapingProgress['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  const totalJobs = currentScrapes.reduce((sum, scrape) => sum + scrape.jobsFound, 0);
  const completedScrapes = currentScrapes.filter(s => s.status === 'completed').length;
  const overallProgress = currentScrapes.length > 0 
    ? (currentScrapes.reduce((sum, s) => sum + s.progress, 0) / currentScrapes.length)
    : 0;

  if (!isActive && currentScrapes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      {isActive && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600 animate-pulse" />
                Scraping in Progress
              </CardTitle>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-blue-700">
                  {formatTime(elapsedTime)}
                </Badge>
                {onCancel && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCancel}
                    className="h-8 px-3"
                    data-testid="button-cancel-scraping"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{totalJobs}</p>
                <p className="text-xs text-muted-foreground">Jobs Found</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{completedScrapes}</p>
                <p className="text-xs text-muted-foreground">Sources Done</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{currentScrapes.length}</p>
                <p className="text-xs text-muted-foreground">Total Sources</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Source Progress */}
      {currentScrapes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Source Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentScrapes.map((scrape) => (
              <div key={scrape.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(scrape.status)}
                    <span className="font-medium capitalize">{scrape.source}</span>
                    <Badge className={getStatusColor(scrape.status)}>
                      {scrape.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {scrape.jobsFound > 0 && (
                      <span>{scrape.jobsFound} jobs</span>
                    )}
                    {scrape.estimatedTime && scrape.status === 'running' && (
                      <span>~{Math.ceil(scrape.estimatedTime / 60)}min</span>
                    )}
                  </div>
                </div>
                
                {scrape.status === 'running' && (
                  <div className="space-y-1">
                    <Progress value={scrape.progress} className="h-1.5" />
                    <p className="text-xs text-muted-foreground">
                      {scrape.progress < 30 && "Connecting to source..."}
                      {scrape.progress >= 30 && scrape.progress < 60 && "Searching job listings..."}
                      {scrape.progress >= 60 && scrape.progress < 90 && "Processing results..."}
                      {scrape.progress >= 90 && "Finalizing..."}
                    </p>
                  </div>
                )}
                
                {scrape.error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                    <AlertCircle className="h-4 w-4" />
                    <span>{scrape.error}</span>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Source Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Source Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sourcePerformance.map((source) => (
              <div 
                key={source.source}
                className="p-4 rounded-lg border bg-muted/30 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium capitalize flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {source.source}
                  </h4>
                  <Badge 
                    variant={source.successRate >= 80 ? "default" : 
                            source.successRate >= 60 ? "secondary" : "destructive"}
                    className="text-xs"
                  >
                    {Math.round(source.successRate)}%
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Avg Jobs
                    </span>
                    <span className="font-medium">{source.avgJobsPerScrape}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Total Found
                    </span>
                    <span className="font-medium">{source.totalJobs}</span>
                  </div>
                  
                  {source.lastScrape && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last Scrape
                      </span>
                      <span className="font-medium text-xs">
                        {new Date(source.lastScrape).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Performance</span>
                    <span>{Math.round(source.successRate)}%</span>
                  </div>
                  <Progress value={source.successRate} className="h-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}