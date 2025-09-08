import { useQuery } from "@tanstack/react-query";
import { Job } from "@shared/schema";

interface UseJobsParams {
  source?: string;
  status?: string;
  veteranOnly?: boolean;
  limit?: number;
  offset?: number;
}

export function useJobs(params: UseJobsParams = {}) {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const queryString = queryParams.toString();
  const url = `/api/jobs${queryString ? `?${queryString}` : ''}`;

  return useQuery<Job[]>({
    queryKey: ['/api/jobs', params],
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useJob(id: string) {
  return useQuery<Job>({
    queryKey: ["/api/jobs", id],
    enabled: !!id,
  });
}
