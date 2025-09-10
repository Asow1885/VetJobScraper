import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Play, 
  Square, 
  Settings, 
  Zap, 
  Clock,
  Target,
  Globe,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Activity,
  Users,
  MapPin
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ScrapingSource {
  id: string;
  name: string;
  displayName: string;
  enabled: boolean;
  avgJobsPerScrape: number;
  successRate: number;
  estimatedTime: number; // in seconds
  icon: string;
}

interface ScrapingProgress {
  source: string;
  status: 'waiting' | 'scraping' | 'completed' | 'failed';
  progress: number;
  jobsFound: number;
  currentAction: string;
  error?: string;
}

const DEFAULT_SOURCES: ScrapingSource[] = [
  {
    id: 'linkedin',
    name: 'linkedin',
    displayName: 'LinkedIn',
    enabled: true,
    avgJobsPerScrape: 25,
    successRate: 85,
    estimatedTime: 120,
    icon: '💼'
  },
  {
    id: 'indeed',
    name: 'indeed', 
    displayName: 'Indeed',
    enabled: true,
    avgJobsPerScrape: 30,
    successRate: 90,
    estimatedTime: 90,
    icon: '🔍'
  },
  {
    id: 'glassdoor',
    name: 'glassdoor',
    displayName: 'Glassdoor',
    enabled: false,
    avgJobsPerScrape: 15,
    successRate: 75,
    estimatedTime: 150,
    icon: '🏢'
  },
  {
    id: 'google',
    name: 'google',
    displayName: 'Google Jobs',
    enabled: false,
    avgJobsPerScrape: 20,
    successRate: 80,
    estimatedTime: 100,
    icon: '🌐'
  }
];

export function EnhancedScrapingControls() {
  const [maxJobs, setMaxJobs] = useState(20);
  const [sources, setSources] = useState<ScrapingSource[]>(DEFAULT_SOURCES);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [scrapingProgress, setScrapingProgress] = useState<ScrapingProgress[]>([]);
  const [isScrapingActive, setIsScrapingActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedCompletion, setEstimatedCompletion] = useState(0);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const enabledSources = sources.filter(s => s.enabled);
  const totalEstimatedTime = enabledSources.reduce((sum, s) => sum + s.estimatedTime, 0);
  const expectedJobs = enabledSources.reduce((sum, s) => sum + Math.min(s.avgJobsPerScrape, maxJobs / enabledSources.length), 0);

  // Timer for elapsed time
  useEffect(() => {
    if (!isScrapingActive) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isScrapingActive]);

  // Simulate scraping progress (in real implementation, this would come from WebSocket or polling)
  useEffect(() => {
    if (!isScrapingActive) return;

    const simulateProgress = () => {
      setScrapingProgress(prev => {
        return prev.map(p => {
          if (p.status === 'scraping' && p.progress < 100) {
            const increment = Math.random() * 15 + 5; // 5-20% increments
            const newProgress = Math.min(100, p.progress + increment);
            
            let currentAction = p.currentAction;
            if (newProgress < 25) currentAction = `Connecting to ${p.source}...`;
            else if (newProgress < 50) currentAction = 'Searching job listings...';
            else if (newProgress < 75) currentAction = 'Processing results...';
            else if (newProgress < 95) currentAction = 'Filtering veteran-friendly jobs...';
            else currentAction = 'Finalizing...';

            const jobsFound = Math.floor((newProgress / 100) * (Math.random() * 15 + 5));

            if (newProgress >= 100) {
              return { ...p, status: 'completed', progress: 100, currentAction: 'Completed!', jobsFound };
            }

            return { ...p, progress: newProgress, currentAction, jobsFound };
          }
          return p;
        });
      });
    };

    const interval = setInterval(simulateProgress, 1500);
    return () => clearInterval(interval);
  }, [isScrapingActive]);

  const scrapingMutation = useMutation({
    mutationFn: async (data: { maxJobs: number; sources: string[] }) => {
      const response = await fetch('/api/scrape/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to start scraping');
      return response.json();
    },
    onSuccess: () => {
      setIsScrapingActive(true);
      setEstimatedCompletion(totalEstimatedTime);
      
      // Initialize progress for each enabled source
      const initialProgress = enabledSources.map(source => ({
        source: source.displayName,
        status: 'waiting' as const,
        progress: 0,
        jobsFound: 0,
        currentAction: 'Queued for scraping...'
      }));
      
      setScrapingProgress(initialProgress);

      // Start first source immediately
      if (initialProgress.length > 0) {
        setScrapingProgress(prev => 
          prev.map((p, index) => 
            index === 0 ? { ...p, status: 'scraping', currentAction: `Connecting to ${p.source}...` } : p
          )
        );
      }

      toast({
        title: "Scraping Started! 🚀",
        description: `Searching ${enabledSources.length} job sources for up to ${maxJobs} positions.`,
      });
    },
    onError: (error: any) => {
      setIsScrapingActive(false);
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

    if (enabledSources.length === 0) {
      toast({
        title: "No Sources Selected",
        description: "Please enable at least one job source.",
        variant: "destructive",
      });
      return;
    }

    scrapingMutation.mutate({ 
      maxJobs, 
      sources: enabledSources.map(s => s.name) 
    });
  };

  const handleStopScraping = () => {
    setIsScrapingActive(false);
    setScrapingProgress([]);
    toast({
      title: "Scraping Stopped",
      description: "Job scraping has been cancelled.",
      variant: "default",
    });
  };

  const toggleSource = (sourceId: string) => {
    setSources(prev => 
      prev.map(s => 
        s.id === sourceId ? { ...s, enabled: !s.enabled } : s
      )
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const overallProgress = scrapingProgress.length > 0 
    ? scrapingProgress.reduce((sum, p) => sum + p.progress, 0) / scrapingProgress.length 
    : 0;

  const totalJobsFound = scrapingProgress.reduce((sum, p) => sum + p.jobsFound, 0);
  const completedSources = scrapingProgress.filter(p => p.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Main Scraping Controls */}
      <Card data-testid="enhanced-scraping-controls">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Smart Job Scraper
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAdvancedMode(!isAdvancedMode)}
              data-testid="button-toggle-advanced"
            >
              <Settings className="h-4 w-4 mr-2" />
              {isAdvancedMode ? 'Simple' : 'Advanced'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Job Count Input */}
          <div className="space-y-3">
            <Label htmlFor="maxJobs" className="text-base font-medium">How many jobs to find?</Label>
            <div className="flex items-center gap-4">
              <Input
                id="maxJobs"
                type="number"
                min="1"
                max="100"
                value={maxJobs}
                onChange={(e) => setMaxJobs(parseInt(e.target.value) || 1)}
                disabled={isScrapingActive}
                className="w-24 text-center text-lg font-semibold"
                data-testid="input-max-jobs"
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>Expected to find ~{expectedJobs} jobs from {enabledSources.length} sources</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Estimated time: {Math.ceil(totalEstimatedTime / 60)} minutes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Source Selection (Advanced Mode) */}
          {isAdvancedMode && (
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Job Sources
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sources.map(source => (
                  <div
                    key={source.id}
                    className={`p-4 border rounded-lg transition-all cursor-pointer ${
                      source.enabled 
                        ? 'border-primary bg-primary/5 shadow-sm' 
                        : 'border-muted hover:border-muted-foreground/50'
                    }`}
                    onClick={() => toggleSource(source.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={source.enabled}
                        onCheckedChange={() => toggleSource(source.id)}
                        data-testid={`checkbox-source-${source.id}`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{source.icon}</span>
                          <span className="font-medium">{source.displayName}</span>
                          <Badge variant="outline" className="text-xs">
                            {source.successRate}% success
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ~{source.avgJobsPerScrape} jobs • {Math.ceil(source.estimatedTime / 60)}min
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleStartScraping}
              disabled={isScrapingActive || enabledSources.length === 0}
              className="flex-1 h-12 text-base"
              data-testid="button-start-scraping"
            >
              {isScrapingActive ? (
                <>
                  <Activity className="mr-2 h-5 w-5 animate-pulse" />
                  Scraping in Progress...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Start Smart Scraping
                </>
              )}
            </Button>
            
            {isScrapingActive && (
              <Button
                variant="outline"
                onClick={handleStopScraping}
                className="h-12"
                data-testid="button-stop-scraping"
              >
                <Square className="mr-2 h-4 w-4" />
                Stop
              </Button>
            )}
          </div>

          {/* Preview Info */}
          {!isScrapingActive && enabledSources.length > 0 && (
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Scraping Preview
              </h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{enabledSources.length}</p>
                  <p className="text-xs text-muted-foreground">Sources</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">~{expectedJobs}</p>
                  <p className="text-xs text-muted-foreground">Expected Jobs</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{Math.ceil(totalEstimatedTime / 60)}m</p>
                  <p className="text-xs text-muted-foreground">Est. Time</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time Progress Display */}
      {isScrapingActive && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary animate-pulse" />
                Scraping Progress
              </CardTitle>
              <Badge variant="outline" className="text-primary">
                {formatTime(elapsedTime)} elapsed
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-3" />
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">{totalJobsFound}</p>
                  <p className="text-xs text-muted-foreground">Jobs Found</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{completedSources}</p>
                  <p className="text-xs text-muted-foreground">Sources Done</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{scrapingProgress.length}</p>
                  <p className="text-xs text-muted-foreground">Total Sources</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Individual Source Progress */}
            <div className="space-y-4">
              <h4 className="font-medium">Source Details</h4>
              {scrapingProgress.map((progress, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {progress.status === 'waiting' && <Clock className="h-4 w-4 text-yellow-500" />}
                      {progress.status === 'scraping' && <Activity className="h-4 w-4 text-blue-500 animate-pulse" />}
                      {progress.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {progress.status === 'failed' && <AlertCircle className="h-4 w-4 text-red-500" />}
                      
                      <span className="font-medium">{progress.source}</span>
                      <Badge 
                        variant={
                          progress.status === 'completed' ? 'default' :
                          progress.status === 'scraping' ? 'secondary' :
                          progress.status === 'failed' ? 'destructive' : 'outline'
                        }
                        className="text-xs"
                      >
                        {progress.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {progress.jobsFound > 0 && (
                        <span className="text-green-600 font-medium">
                          <Users className="h-3 w-3 inline mr-1" />
                          {progress.jobsFound} jobs
                        </span>
                      )}
                      <span className="text-muted-foreground">{Math.round(progress.progress)}%</span>
                    </div>
                  </div>
                  
                  {progress.status === 'scraping' && (
                    <div className="space-y-1">
                      <Progress value={progress.progress} className="h-1.5" />
                      <p className="text-xs text-muted-foreground">{progress.currentAction}</p>
                    </div>
                  )}
                  
                  {progress.error && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{progress.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}