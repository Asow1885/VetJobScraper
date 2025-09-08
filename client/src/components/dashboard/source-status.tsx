import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { useQuery } from "@tanstack/react-query";
import { ScrapingSource } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

const sourceIcons: Record<string, string> = {
  linkedin: "fab fa-linkedin-in",
  indeed: "fas fa-briefcase",
  glassdoor: "fas fa-glass-whiskey",
  google: "fab fa-google",
  default: "fas fa-globe"
};

function getSourceStatus(source: ScrapingSource): 'active' | 'warning' | 'error' | 'inactive' {
  if (!source.isActive) return 'inactive';
  
  if (!source.lastScrape) return 'warning';
  
  const lastScrapeTime = new Date(source.lastScrape).getTime();
  const now = Date.now();
  const hoursSinceLastScrape = (now - lastScrapeTime) / (1000 * 60 * 60);
  
  if (hoursSinceLastScrape > 6) return 'error';
  if (hoursSinceLastScrape > 3) return 'warning';
  
  return 'active';
}

function getStatusText(status: string): string {
  switch (status) {
    case 'active': return 'Active';
    case 'warning': return 'Slow';
    case 'error': return 'Error';
    case 'inactive': return 'Inactive';
    default: return 'Unknown';
  }
}

export function SourceStatus() {
  const { data: sources = [], isLoading } = useQuery<ScrapingSource[]>({
    queryKey: ["/api/scraping/sources"],
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Source Status</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-muted rounded-full"></div>
                    <div className="space-y-1">
                      <div className="h-4 bg-muted rounded w-16"></div>
                      <div className="h-3 bg-muted rounded w-20"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-muted rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Add KazaConnect status manually since it's not a scraping source
  const kazaConnectStatus = {
    id: 'kaza-connect',
    name: 'KazaConnect',
    type: 'api',
    url: null,
    isActive: true,
    lastScrape: new Date(),
    config: null
  };

  const allSources = [...sources, kazaConnectStatus];

  return (
    <Card data-testid="source-status">
      <CardHeader>
        <h3 className="text-lg font-semibold">Source Status</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {allSources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sources configured
            </div>
          ) : (
            allSources.map((source) => {
              const status = source.id === 'kaza-connect' ? 'active' : getSourceStatus(source);
              const iconClass = sourceIcons[source.name.toLowerCase()] || sourceIcons.default;
              const isKazaConnect = source.id === 'kaza-connect';
              
              return (
                <div 
                  key={source.id} 
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  data-testid={`source-item-${source.name.toLowerCase()}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${isKazaConnect ? 'bg-accent/10' : 'bg-primary/10'} rounded-full flex items-center justify-center`}>
                      <i className={`${iconClass} ${isKazaConnect ? 'text-accent' : 'text-primary'} text-sm`}></i>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{source.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {isKazaConnect 
                          ? 'API Status'
                          : source.lastScrape 
                            ? `Last: ${formatDistanceToNow(new Date(source.lastScrape), { addSuffix: true })}`
                            : 'Never scraped'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusIndicator status={status} />
                    <span className={`text-xs font-medium ${
                      status === 'active' ? 'text-accent' : 
                      status === 'warning' ? 'text-yellow-600' : 
                      status === 'error' ? 'text-destructive' : 
                      'text-muted-foreground'
                    }`}>
                      {isKazaConnect ? 'Connected' : getStatusText(status)}
                    </span>
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
