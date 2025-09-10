import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Users, 
  Clock, 
  Target,
  AlertTriangle,
  CheckCircle,
  Medal,
  Globe,
  Activity
} from "lucide-react";

interface ScrapingInsightsProps {
  totalJobs: number;
  veteranJobs: number;
  recentScrapeSuccess: boolean;
  lastScrapeTime: Date | null;
  sourcePerformance: Array<{
    source: string;
    successRate: number;
    jobsFound: number;
    avgTime: number;
  }>;
  recommendations: string[];
}

export function ScrapingInsights({
  totalJobs,
  veteranJobs,
  recentScrapeSuccess,
  lastScrapeTime,
  sourcePerformance,
  recommendations
}: ScrapingInsightsProps) {
  const veteranPercentage = totalJobs > 0 ? Math.round((veteranJobs / totalJobs) * 100) : 0;
  const topPerformer = sourcePerformance.reduce((best, current) => 
    current.successRate > best.successRate ? current : best, sourcePerformance[0]);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold">{totalJobs.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Medal className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Veteran Friendly</p>
                <p className="text-2xl font-bold text-amber-700">{veteranJobs}</p>
                <p className="text-xs text-muted-foreground">{veteranPercentage}% of total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${recentScrapeSuccess ? 'bg-green-100' : 'bg-red-100'}`}>
                {recentScrapeSuccess ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Scrape</p>
                <p className={`text-sm font-medium ${recentScrapeSuccess ? 'text-green-600' : 'text-red-600'}`}>
                  {recentScrapeSuccess ? 'Successful' : 'Failed'}
                </p>
                {lastScrapeTime && (
                  <p className="text-xs text-muted-foreground">
                    {lastScrapeTime.toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Best Source</p>
                <p className="text-sm font-medium capitalize">{topPerformer?.source || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">
                  {topPerformer?.successRate || 0}% success rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Source Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Source Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sourcePerformance.map((source, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-medium capitalize">{source.source}</span>
                  <Badge 
                    variant={source.successRate >= 80 ? "default" : 
                            source.successRate >= 60 ? "secondary" : "destructive"}
                  >
                    {source.successRate}% success
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {source.jobsFound} jobs
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {Math.round(source.avgTime / 60)}min avg
                  </span>
                </div>
              </div>
              <Progress value={source.successRate} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Smart Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Smart Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <Activity className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{rec}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Veteran Job Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Medal className="h-5 w-5 text-amber-600" />
            Veteran-Friendly Job Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Veteran-Friendly Rate</span>
            <span className="text-sm text-muted-foreground">{veteranPercentage}%</span>
          </div>
          <Progress value={veteranPercentage} className="h-3" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Common Keywords Found:</h4>
              <div className="flex flex-wrap gap-1">
                {['veteran', 'military', 'clearance', 'security clearance', 'defense'].map(keyword => (
                  <Badge key={keyword} variant="outline" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Top Industries:</h4>
              <div className="space-y-1">
                {[
                  { name: 'Government/Defense', percentage: 45 },
                  { name: 'Technology', percentage: 30 },
                  { name: 'Healthcare', percentage: 15 },
                  { name: 'Finance', percentage: 10 }
                ].map(industry => (
                  <div key={industry.name} className="flex items-center justify-between text-xs">
                    <span>{industry.name}</span>
                    <span className="text-muted-foreground">{industry.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}