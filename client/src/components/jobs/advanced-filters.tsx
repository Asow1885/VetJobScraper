import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Filter, 
  X, 
  Save, 
  Clock, 
  MapPin, 
  DollarSign,
  Briefcase,
  Medal,
  Calendar,
  ChevronDown
} from "lucide-react";
import { Job } from "@shared/schema";

export interface AdvancedFilters {
  search: string;
  sources: string[];
  jobTypes: string[];
  locations: string[];
  salaryRange: [number, number];
  veteranFriendly: boolean | null;
  dateRange: { from: Date | null; to: Date | null };
  status: string[];
}

interface AdvancedFiltersProps {
  jobs: Job[];
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
  onSaveSearch?: (name: string, filters: AdvancedFilters) => void;
  savedSearches?: Array<{ name: string; filters: AdvancedFilters }>;
  onLoadSearch?: (filters: AdvancedFilters) => void;
}

export function AdvancedFilters({
  jobs,
  filters,
  onFiltersChange,
  onSaveSearch,
  savedSearches = [],
  onLoadSearch
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState("");

  // Extract unique values from jobs for filter options
  const uniqueSources = [...new Set(jobs.map(job => job.source))];
  const uniqueJobTypes = [...new Set(jobs.map(job => job.jobType).filter(Boolean))];
  const uniqueLocations = [...new Set(jobs.map(job => job.location).filter(Boolean))];
  
  const maxSalary = Math.max(...jobs.map(job => job.salaryMax || 0).filter(Boolean), 200000);
  const minSalary = Math.min(...jobs.map(job => job.salaryMin || 0).filter(Boolean), 0);

  const handleFilterChange = (key: keyof AdvancedFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleMultiSelectChange = (key: keyof AdvancedFilters, value: string, checked: boolean) => {
    const currentValues = filters[key] as string[];
    const newValues = checked 
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    handleFilterChange(key, newValues);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: "",
      sources: [],
      jobTypes: [],
      locations: [],
      salaryRange: [minSalary, maxSalary],
      veteranFriendly: null,
      dateRange: { from: null, to: null },
      status: []
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.sources.length > 0) count++;
    if (filters.jobTypes.length > 0) count++;
    if (filters.locations.length > 0) count++;
    if (filters.salaryRange[0] > minSalary || filters.salaryRange[1] < maxSalary) count++;
    if (filters.veteranFriendly !== null) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.status.length > 0) count++;
    return count;
  };

  const activeCount = getActiveFilterCount();

  return (
    <div className="space-y-4">
      {/* Quick Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-9 px-3">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
              {activeCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {activeCount}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="start">
            <Card className="border-0 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  Advanced Filters
                  <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Search Jobs</Label>
                  <Input
                    placeholder="Search by title, company, or description..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    data-testid="input-advanced-search"
                  />
                </div>

                {/* Salary Range */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Salary Range
                  </Label>
                  <div className="px-2">
                    <Slider
                      min={minSalary}
                      max={maxSalary}
                      step={5000}
                      value={filters.salaryRange}
                      onValueChange={(value) => handleFilterChange('salaryRange', value)}
                      className="w-full"
                      data-testid="slider-salary-range"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>${filters.salaryRange[0].toLocaleString()}</span>
                      <span>${filters.salaryRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Sources */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Job Sources</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {uniqueSources.map(source => (
                      <div key={source} className="flex items-center space-x-2">
                        <Checkbox
                          id={`source-${source}`}
                          checked={filters.sources.includes(source)}
                          onCheckedChange={(checked) => 
                            handleMultiSelectChange('sources', source, checked as boolean)
                          }
                          data-testid={`checkbox-source-${source}`}
                        />
                        <Label 
                          htmlFor={`source-${source}`} 
                          className="text-sm capitalize cursor-pointer"
                        >
                          {source}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Job Types */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Job Types
                  </Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {uniqueJobTypes.map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type}`}
                          checked={filters.jobTypes.includes(type)}
                          onCheckedChange={(checked) => 
                            handleMultiSelectChange('jobTypes', type, checked as boolean)
                          }
                          data-testid={`checkbox-type-${type}`}
                        />
                        <Label 
                          htmlFor={`type-${type}`} 
                          className="text-sm capitalize cursor-pointer"
                        >
                          {type}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Locations */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Locations
                  </Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {uniqueLocations.slice(0, 10).map(location => (
                      <div key={location} className="flex items-center space-x-2">
                        <Checkbox
                          id={`location-${location}`}
                          checked={filters.locations.includes(location)}
                          onCheckedChange={(checked) => 
                            handleMultiSelectChange('locations', location, checked as boolean)
                          }
                          data-testid={`checkbox-location-${location}`}
                        />
                        <Label 
                          htmlFor={`location-${location}`} 
                          className="text-sm cursor-pointer truncate"
                        >
                          {location}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Veteran Friendly */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Medal className="h-4 w-4" />
                    Veteran Status
                  </Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="veteran-friendly"
                        checked={filters.veteranFriendly === true}
                        onCheckedChange={(checked) => 
                          handleFilterChange('veteranFriendly', checked ? true : null)
                        }
                        data-testid="checkbox-veteran-friendly"
                      />
                      <Label htmlFor="veteran-friendly" className="text-sm cursor-pointer">
                        Veteran Friendly Only
                      </Label>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex flex-col space-y-2">
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearAllFilters}
                      className="flex-1"
                      data-testid="button-clear-filters"
                    >
                      Clear All
                    </Button>
                    {onSaveSearch && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const name = prompt("Save search as:");
                          if (name) onSaveSearch(name, filters);
                        }}
                        className="flex-1"
                        data-testid="button-save-search"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>

        {/* Active Filter Tags */}
        {filters.search && (
          <Badge variant="secondary" className="gap-1">
            Search: {filters.search}
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => handleFilterChange('search', '')}
            />
          </Badge>
        )}
        
        {filters.sources.map(source => (
          <Badge key={source} variant="secondary" className="gap-1">
            {source}
            <X 
              className="h-3 w-3 cursor-pointer"
              onClick={() => handleMultiSelectChange('sources', source, false)}
            />
          </Badge>
        ))}

        {filters.veteranFriendly && (
          <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800">
            <Medal className="h-3 w-3" />
            Veteran Friendly
            <X 
              className="h-3 w-3 cursor-pointer"
              onClick={() => handleFilterChange('veteranFriendly', null)}
            />
          </Badge>
        )}
      </div>

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Saved Searches
          </Label>
          <div className="flex flex-wrap gap-2">
            {savedSearches.map((search, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => onLoadSearch?.(search.filters)}
                className="h-7 px-2 text-xs"
                data-testid={`button-saved-search-${index}`}
              >
                {search.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}