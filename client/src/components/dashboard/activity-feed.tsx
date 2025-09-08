import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Upload, RotateCcw, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ScrapingLog } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

const activityIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertCircle,
  info: RotateCcw
};

const activityColors = {
  success: "bg-accent text-accent-foreground",
  error: "bg-destructive text-destructive-foreground",
  warning: "bg-yellow-500 text-yellow-50",
  info: "bg-secondary text-secondary-foreground"
};

function getActivityType(status: string): keyof typeof activityIcons {
  switch (status) {
    case "success": return "success";
    case "error": return "error";
    case "warning": return "warning";
    default: return "info";
  }
}

export function ActivityFeed() {
  const { data: logs = [], isLoading } = useQuery<ScrapingLog[]>({
    queryKey: ["/api/logs/scraping"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Scraping Activity</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="flex items-start space-x-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 bg-muted rounded-full flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2" data-testid="activity-feed">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Scraping Activity</h3>
          <Button variant="ghost" size="sm" data-testid="button-view-all">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent activity to display
            </div>
          ) : (
            logs.slice(0, 4).map((log) => {
              const activityType = getActivityType(log.status);
              const Icon = activityIcons[activityType];
              const colorClass = activityColors[activityType];
              
              return (
                <div 
                  key={log.id} 
                  className="flex items-start space-x-4 p-4 bg-muted/50 rounded-lg"
                  data-testid={`activity-item-${log.id}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{log.message}</p>
                    <p className="text-sm text-muted-foreground">
                      {(log.jobsFound ?? 0) > 0 && `Found ${log.jobsFound} jobs • `}
                      {log.timestamp ? formatDistanceToNow(new Date(log.timestamp), { addSuffix: true }) : 'Just now'}
                    </p>
                    {(log.jobsFound ?? 0) > 0 && (
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full">
                          Jobs: {log.jobsFound ?? 0}
                        </span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          Status: {log.status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
