import { useQuery } from "@tanstack/react-query";
import { DashboardStats } from "@/types";

export function useStats() {
  return useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
