import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Settings, Plus, Activity } from "lucide-react";
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

export default function Sources() {
  const { data: sources = [], isLoading } = useQuery<ScrapingSource[]>({
    queryKey: ["/api/scraping/sources"],
  });

  return (
    <div className="flex-1 overflow-auto">
      <Header 
        title="Scraping Sources"
        description="Manage and configure job scraping sources"
      />
      
      <div className="p-6 space-y-6">
        {/* Sources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-muted rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-20"></div>
                        <div className="h-3 bg-muted rounded w-16"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            sources.map((source) => {
              const iconClass = sourceIcons[source.name.toLowerCase()] || sourceIcons.default;
              
              return (
                <Card key={source.id} data-testid={`source-card-${source.name.toLowerCase()}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <i className={`${iconClass} text-primary`}></i>
                        </div>
                        <div>
                          <h3 className="font-semibold">{source.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">{source.type}</p>
                        </div>
                      </div>
                      <Switch 
                        checked={source.isActive ?? false} 
                        data-testid={`switch-${source.name.toLowerCase()}-active`}
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <Badge variant={source.isActive ? "default" : "secondary"}>
                          {source.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Last Scrape</span>
                        <span className="text-sm">
                          {source.lastScrape 
                            ? formatDistanceToNow(new Date(source.lastScrape), { addSuffix: true })
                            : "Never"
                          }
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          data-testid={`button-configure-${source.name.toLowerCase()}`}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Configure
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          data-testid={`button-test-${source.name.toLowerCase()}`}
                        >
                          <Activity className="mr-2 h-4 w-4" />
                          Test
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
          
          {/* Add New Source Card */}
          <Card className="border-dashed border-2 border-muted hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Add New Source</h3>
                  <p className="text-sm text-muted-foreground">Configure a custom scraping source</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  data-testid="button-add-source"
                >
                  Add Source
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Source Statistics */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Source Performance</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {sources.filter(s => s.isActive).length}
                </div>
                <div className="text-sm text-muted-foreground">Active Sources</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">
                  {sources.filter(s => s.lastScrape).length}
                </div>
                <div className="text-sm text-muted-foreground">Sources with Data</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">
                  {sources.filter(s => s.type === 'jobspy').length}
                </div>
                <div className="text-sm text-muted-foreground">JobSpy Sources</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
