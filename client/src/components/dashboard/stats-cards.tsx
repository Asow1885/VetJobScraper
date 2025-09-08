import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Medal, CheckCircle, Globe } from "lucide-react";
import { useStats } from "@/hooks/use-stats";
import { Skeleton } from "@/components/ui/skeleton";

const statsConfig = [
  {
    key: "total" as const,
    title: "Total Jobs",
    icon: Briefcase,
    color: "bg-primary/10 text-primary",
    growth: "+12% from last week"
  },
  {
    key: "veteran" as const,
    title: "Veteran Jobs",
    icon: Medal,
    color: "bg-accent/10 text-accent",
    growth: "+8% from last week"
  },
  {
    key: "postedToKaza" as const,
    title: "Posted to KazaConnect",
    icon: CheckCircle,
    color: "bg-accent/10 text-accent",
    growth: "96.3% success rate"
  },
  {
    key: "activeSources" as const,
    title: "Active Sources",
    icon: Globe,
    color: "bg-secondary/10 text-secondary",
    growth: "LinkedIn, Indeed, Glassdoor +4"
  }
];

export function StatsCards() {
  const { data: stats, isLoading } = useStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              Failed to load statistics
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsConfig.map((config) => {
        const Icon = config.icon;
        const value = stats[config.key];
        
        return (
          <Card key={config.key} data-testid={`stats-card-${config.key}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    {config.title}
                  </p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {typeof value === 'number' ? value.toLocaleString() : value || 0}
                  </p>
                  <p className="text-accent text-sm mt-1">
                    {config.growth}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${config.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
