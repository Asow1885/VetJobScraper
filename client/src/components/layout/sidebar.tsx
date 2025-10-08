import { Link, useLocation } from "wouter";
import { 
  Search, 
  BarChart3, 
  Briefcase, 
  Globe, 
  Link as LinkIcon, 
  Settings, 
  FileText,
  Medal,
  CheckCircle,
  Sparkles,
  User
} from "lucide-react";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { useStats } from "@/hooks/use-stats";

const navigationItems = [
  { path: "/", label: "Dashboard", icon: BarChart3 },
  { path: "/jobs", label: "Jobs", icon: Briefcase, badge: true },
  { path: "/recommendations", label: "AI Matches", icon: Sparkles },
  { path: "/profile", label: "Profile", icon: User },
  { path: "/sources", label: "Sources", icon: Globe },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const { data: stats } = useStats();

  return (
    <aside className="w-64 bg-card border-r border-border flex-shrink-0 transition-all duration-300 ease-in-out">
      <div className="p-6">
        {/* Logo */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
            <Search className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">VetJobScraper</h1>
            <p className="text-xs text-muted-foreground">Pro Dashboard</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            
            return (
              <Link key={item.path} href={item.path}>
                <a
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  data-testid={`nav-link-${item.label.toLowerCase()}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  
                  {/* Badge for jobs count */}
                  {item.badge && stats && (
                    <span className="ml-auto bg-accent text-accent-foreground px-2 py-1 rounded-full text-xs font-medium">
                      {stats.total.toLocaleString()}
                    </span>
                  )}
                  
                  {/* Status indicator for KazaConnect */}
                  {item.status && (
                    <StatusIndicator status="active" className="ml-auto" />
                  )}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* System Status */}
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold text-sm mb-2">System Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Scraping</span>
              <span className="text-accent font-medium flex items-center">
                <StatusIndicator status="active" className="mr-2" />
                Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">API</span>
              <span className="text-accent font-medium flex items-center">
                <StatusIndicator status="active" className="mr-2" />
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Queue</span>
              <span className="text-muted-foreground font-medium">
                {stats?.pending || 0} pending
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
