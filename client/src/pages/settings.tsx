import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Save, TestTube, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const [kazaApiUrl, setKazaApiUrl] = useState(process.env.VITE_KAZA_CONNECT_API_URL || "");
  const [kazaApiKey, setKazaApiKey] = useState("");
  const [autoScheduler, setAutoScheduler] = useState(true);
  const [scrapingInterval, setScrapingInterval] = useState("2");
  const [postingInterval, setPostingInterval] = useState("30");
  const [maxJobsPerScrape, setMaxJobsPerScrape] = useState("50");
  
  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your configuration has been updated successfully.",
    });
  };

  const handleTestConnection = () => {
    toast({
      title: "Testing Connection",
      description: "Attempting to connect to KazaConnect API...",
    });
  };

  return (
    <div className="flex-1 overflow-auto">
      <Header 
        title="Settings"
        description="Configure scraping parameters and integrations"
      />
      
      <div className="p-6 space-y-6">
        {/* KazaConnect Integration */}
        <Card data-testid="kaza-connect-settings">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">KazaConnect Integration</h3>
                <p className="text-sm text-muted-foreground">Configure API connection to your KazaConnect app</p>
              </div>
              <Badge variant="outline" className="bg-accent/10 text-accent">
                Connected
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kaza-api-url">API URL</Label>
                <Input
                  id="kaza-api-url"
                  type="url"
                  placeholder="https://api.kazaconnect.com"
                  value={kazaApiUrl}
                  onChange={(e) => setKazaApiUrl(e.target.value)}
                  data-testid="input-kaza-api-url"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kaza-api-key">API Key</Label>
                <Input
                  id="kaza-api-key"
                  type="password"
                  placeholder="Your KazaConnect API key"
                  value={kazaApiKey}
                  onChange={(e) => setKazaApiKey(e.target.value)}
                  data-testid="input-kaza-api-key"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                onClick={handleTestConnection}
                data-testid="button-test-connection"
              >
                <TestTube className="mr-2 h-4 w-4" />
                Test Connection
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Scraping Configuration */}
        <Card data-testid="scraping-settings">
          <CardHeader>
            <h3 className="text-lg font-semibold">Scraping Configuration</h3>
            <p className="text-sm text-muted-foreground">Configure automatic job scraping parameters</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Auto Scheduler</Label>
                <p className="text-sm text-muted-foreground">Automatically run scraping on schedule</p>
              </div>
              <Switch 
                checked={autoScheduler} 
                onCheckedChange={setAutoScheduler}
                data-testid="switch-auto-scheduler"
              />
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scraping-interval">Scraping Interval (hours)</Label>
                <Select value={scrapingInterval} onValueChange={setScrapingInterval}>
                  <SelectTrigger data-testid="select-scraping-interval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Every Hour</SelectItem>
                    <SelectItem value="2">Every 2 Hours</SelectItem>
                    <SelectItem value="4">Every 4 Hours</SelectItem>
                    <SelectItem value="6">Every 6 Hours</SelectItem>
                    <SelectItem value="12">Every 12 Hours</SelectItem>
                    <SelectItem value="24">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="posting-interval">Posting Interval (minutes)</Label>
                <Select value={postingInterval} onValueChange={setPostingInterval}>
                  <SelectTrigger data-testid="select-posting-interval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">Every 15 min</SelectItem>
                    <SelectItem value="30">Every 30 min</SelectItem>
                    <SelectItem value="60">Every Hour</SelectItem>
                    <SelectItem value="120">Every 2 Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max-jobs">Max Jobs per Scrape</Label>
                <Input
                  id="max-jobs"
                  type="number"
                  min="10"
                  max="500"
                  value={maxJobsPerScrape}
                  onChange={(e) => setMaxJobsPerScrape(e.target.value)}
                  data-testid="input-max-jobs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Veteran Keywords */}
        <Card data-testid="veteran-keywords-settings">
          <CardHeader>
            <h3 className="text-lg font-semibold">Veteran Keywords</h3>
            <p className="text-sm text-muted-foreground">Keywords used to identify veteran-friendly jobs</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="veteran, military, clearance, security clearance, veteran friendly, military experience..."
              className="min-h-[100px]"
              defaultValue="veteran, military, clearance, security clearance, veteran friendly, military experience, veteran preferred, former military, ex-military, military background, veteran hiring, military transition, veteran owned"
              data-testid="textarea-veteran-keywords"
            />
            <p className="text-xs text-muted-foreground">
              Separate keywords with commas. These will be used to identify and flag veteran-friendly job postings.
            </p>
          </CardContent>
        </Card>

        {/* Search Terms */}
        <Card data-testid="search-terms-settings">
          <CardHeader>
            <h3 className="text-lg font-semibold">Search Terms</h3>
            <p className="text-sm text-muted-foreground">Terms used when searching for jobs on various platforms</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="veteran preferred, military experience, security clearance..."
              className="min-h-[80px]"
              defaultValue="veteran preferred, military experience, security clearance, veteran friendly"
              data-testid="textarea-search-terms"
            />
            <p className="text-xs text-muted-foreground">
              These terms will be used as search queries on job platforms like LinkedIn, Indeed, and Glassdoor.
            </p>
          </CardContent>
        </Card>

        {/* Save Actions */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline"
            data-testid="button-reset-settings"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button 
            onClick={handleSaveSettings}
            data-testid="button-save-settings"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
