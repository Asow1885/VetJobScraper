import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { User, X } from "lucide-react";

const userProfileSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  militaryBranch: z.string().optional(),
  yearsOfService: z.coerce.number().min(0).max(50).optional(),
  minSalary: z.coerce.number().min(0).optional(),
  clearanceLevel: z.string().optional(),
});

type UserProfileForm = z.infer<typeof userProfileSchema>;

// For demo purposes, using a hardcoded user ID
const DEMO_USER_ID = "demo-user";

export default function Profile() {
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [jobTypeInput, setJobTypeInput] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState("");

  const { toast } = useToast();

  const { data: user, isLoading } = useQuery({
    queryKey: [`/api/users/${DEMO_USER_ID}`],
    retry: false,
    enabled: true,
  });

  const form = useForm<UserProfileForm>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      militaryBranch: user?.militaryBranch || "",
      yearsOfService: user?.yearsOfService || undefined,
      minSalary: user?.minSalary || undefined,
      clearanceLevel: user?.clearanceLevel || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/users/${DEMO_USER_ID}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${DEMO_USER_ID}`] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UserProfileForm) => {
    updateProfileMutation.mutate({
      ...data,
      skills,
      desiredJobTypes: jobTypes,
      desiredLocations: locations,
    });
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const addJobType = () => {
    if (jobTypeInput.trim() && !jobTypes.includes(jobTypeInput.trim())) {
      setJobTypes([...jobTypes, jobTypeInput.trim()]);
      setJobTypeInput("");
    }
  };

  const removeJobType = (jobType: string) => {
    setJobTypes(jobTypes.filter(jt => jt !== jobType));
  };

  const addLocation = () => {
    if (locationInput.trim() && !locations.includes(locationInput.trim())) {
      setLocations([...locations, locationInput.trim()]);
      setLocationInput("");
    }
  };

  const removeLocation = (location: string) => {
    setLocations(locations.filter(l => l !== location));
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <User className="h-8 w-8" />
            Your Profile
          </h1>
          <p className="text-muted-foreground mt-2">
            Set up your preferences to get personalized job recommendations
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Tell us about yourself</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John Doe" data-testid="input-full-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="john@example.com" data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Military Background */}
            <Card>
              <CardHeader>
                <CardTitle>Military Background</CardTitle>
                <CardDescription>Your service information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="militaryBranch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Military Branch</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-military-branch">
                            <SelectValue placeholder="Select your branch" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="army">Army</SelectItem>
                          <SelectItem value="navy">Navy</SelectItem>
                          <SelectItem value="air force">Air Force</SelectItem>
                          <SelectItem value="marines">Marines</SelectItem>
                          <SelectItem value="coast guard">Coast Guard</SelectItem>
                          <SelectItem value="space force">Space Force</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="yearsOfService"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Service</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" max="50" placeholder="5" data-testid="input-years-service" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clearanceLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Security Clearance Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-clearance">
                            <SelectValue placeholder="Select your clearance level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="confidential">Confidential</SelectItem>
                          <SelectItem value="secret">Secret</SelectItem>
                          <SelectItem value="top secret">Top Secret</SelectItem>
                          <SelectItem value="ts/sci">TS/SCI</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Skills & Expertise</CardTitle>
                <CardDescription>Add your key skills and competencies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="e.g., JavaScript, Project Management"
                    data-testid="input-add-skill"
                  />
                  <Button type="button" onClick={addSkill} data-testid="button-add-skill">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="pl-3 pr-1 py-1" data-testid={`badge-skill-${skill}`}>
                      {skill}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1 ml-1"
                        onClick={() => removeSkill(skill)}
                        data-testid={`button-remove-skill-${skill}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Job Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Job Preferences</CardTitle>
                <CardDescription>What kind of job are you looking for?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Desired Job Types</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={jobTypeInput}
                      onChange={(e) => setJobTypeInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addJobType())}
                      placeholder="e.g., Full-time, Remote, Contract"
                      data-testid="input-add-job-type"
                    />
                    <Button type="button" onClick={addJobType} data-testid="button-add-job-type">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {jobTypes.map((jobType) => (
                      <Badge key={jobType} variant="secondary" className="pl-3 pr-1 py-1">
                        {jobType}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1 ml-1"
                          onClick={() => removeJobType(jobType)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Desired Locations</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLocation())}
                      placeholder="e.g., Washington DC, Remote, San Diego"
                      data-testid="input-add-location"
                    />
                    <Button type="button" onClick={addLocation} data-testid="button-add-location">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {locations.map((location) => (
                      <Badge key={location} variant="secondary" className="pl-3 pr-1 py-1">
                        {location}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1 ml-1"
                          onClick={() => removeLocation(location)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="minSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Salary ($)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" step="1000" placeholder="75000" data-testid="input-min-salary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button 
                type="submit" 
                disabled={updateProfileMutation.isPending}
                data-testid="button-save-profile"
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}