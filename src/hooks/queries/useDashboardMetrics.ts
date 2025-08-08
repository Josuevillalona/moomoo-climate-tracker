import { useQuery } from '@tanstack/react-query';
import { FundingService } from '../../lib/api/funding';
import { queryKeys } from '../../lib/query/keys';
import { DashboardMetrics } from '../../types/api';

export function useDashboardMetrics() {
  return useQuery({
    queryKey: queryKeys.dashboard.metrics(),
    queryFn: async (): Promise<DashboardMetrics> => {
      const response = await FundingService.getDashboardMetrics();
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (!response.data) {
        throw new Error('No metrics data received');
      }
      
      return response.data;
    },
    // Metrics are relatively stable, cache for longer
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    // Enable background refetch for fresh data
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    refetchIntervalInBackground: false,
  });
}