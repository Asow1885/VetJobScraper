import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Sparkles,
  TrendingUp,
  MapPin,
  DollarSign,
  Medal,
  CheckCircle,
  ExternalLink,
  X,
  AlertCircle,
  Lightbulb
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { JobRecommendation } from "@shared/schema";

// For demo purposes, using a hardcoded user ID
const DEMO_USER_ID = "demo-user";

export default function Recommendations() {
  const { toast } = useToast();

  const { data: recommendations = [], isLoading } = useQuery<JobRecommendation[]>({
    queryKey: [`/api/recommendations/${DEMO_USER_ID}`],
    retry: false,
    enabled: false, // Disabled for demo
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/recommendations/generate/${DEMO_USER_ID}`, {
        method: "POST",
        body: JSON.stringify({ limit: 20 }),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error('Failed to generate recommendations');
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/recommendations/${DEMO_USER_ID}`] });
      toast({
        title: "Recommendations Generated! ✨",
        description: `Found ${data.recommendations?.length || 0} matching jobs for you.`,
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate recommendations. Please try again.",
        variant: "destructive",
      });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/recommendations/${id}/dismiss`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error('Failed to dismiss recommendation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/recommendations/${DEMO_USER_ID}`] });
      toast({
        title: "Recommendation Dismissed",
        description: "This job has been removed from your recommendations.",
      });
    },
  });

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-gray-600";
  };

  const getMatchScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent Match";
    if (score >= 60) return "Good Match";
    if (score >= 40) return "Fair Match";
    return "Weak Match";
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              AI Job Recommendations
            </h1>
            <p className="text-muted-foreground mt-2">
              Personalized job matches based on your profile and preferences
            </p>
          </div>
          
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            size="lg"
            data-testid="button-generate-recommendations"
          >
            {generateMutation.isPending ? (
              <>Generating...</>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Recommendations
              </>
            )}
          </Button>
        </div>

        {/* Info Alert */}
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            Set up your profile with skills, preferences, and desired locations to get personalized recommendations!
          </AlertDescription>
        </Alert>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading recommendations...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && recommendations.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Sparkles className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Recommendations Yet</h3>
              <p className="text-muted-foreground mb-6">
                Click "Generate Recommendations" to get AI-powered job matches based on your profile.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Recommendations List */}
        {!isLoading && recommendations.length > 0 && (
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <Card key={rec.id} className="hover:shadow-md transition-shadow" data-testid={`card-recommendation-${rec.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="default" className="text-sm">
                          {rec.matchScore}% Match
                        </Badge>
                        <span className={`text-sm font-medium ${getMatchScoreColor(rec.matchScore)}`}>
                          {getMatchScoreLabel(rec.matchScore)}
                        </span>
                      </div>
                      <CardTitle className="text-xl mb-1" data-testid={`text-job-title-${rec.id}`}>
                        Job Title Here
                      </CardTitle>
                      <CardDescription>Company Name • Location</CardDescription>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissMutation.mutate(rec.id)}
                      disabled={dismissMutation.isPending}
                      data-testid={`button-dismiss-${rec.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Match Score Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Match Score</span>
                      <span className="font-medium">{rec.matchScore}%</span>
                    </div>
                    <Progress value={rec.matchScore} className="h-2" />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Match Indicators */}
                  <div className="flex flex-wrap gap-2">
                    {rec.veteranMatch && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                        <Medal className="h-3 w-3 mr-1" />
                        Veteran Friendly
                      </Badge>
                    )}
                    {rec.locationMatch && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <MapPin className="h-3 w-3 mr-1" />
                        Location Match
                      </Badge>
                    )}
                    {rec.salaryMatch && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <DollarSign className="h-3 w-3 mr-1" />
                        Salary Match
                      </Badge>
                    )}
                  </div>

                  {/* Matched Skills */}
                  {rec.skillMatches && rec.skillMatches.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Matching Skills
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {rec.skillMatches.map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Match Reasons */}
                  {rec.matchReasons && rec.matchReasons.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        Why This Matches
                      </h4>
                      <ul className="space-y-1">
                        {rec.matchReasons.map((reason, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Match Details Breakdown */}
                  {rec.matchDetails && typeof rec.matchDetails === 'object' && 'breakdown' in rec.matchDetails && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <h4 className="text-sm font-medium mb-2">Match Breakdown</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                        {rec.matchDetails.breakdown && typeof rec.matchDetails.breakdown === 'object' && (
                          <>
                            <div>
                              <p className="text-muted-foreground">Skills</p>
                              <p className="font-medium">{'skills' in rec.matchDetails.breakdown ? String(rec.matchDetails.breakdown.skills) : 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Veteran</p>
                              <p className="font-medium">{'veteran' in rec.matchDetails.breakdown ? String(rec.matchDetails.breakdown.veteran) : 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Location</p>
                              <p className="font-medium">{'location' in rec.matchDetails.breakdown ? String(rec.matchDetails.breakdown.location) : 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Salary</p>
                              <p className="font-medium">{'salary' in rec.matchDetails.breakdown ? String(rec.matchDetails.breakdown.salary) : 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Job Type</p>
                              <p className="font-medium">{'jobType' in rec.matchDetails.breakdown ? String(rec.matchDetails.breakdown.jobType) : 'N/A'}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="default" className="flex-1" data-testid={`button-view-job-${rec.id}`}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Job Details
                    </Button>
                    <Button variant="outline" data-testid={`button-apply-${rec.id}`}>
                      Apply Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}