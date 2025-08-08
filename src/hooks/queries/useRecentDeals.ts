import { useQuery } from '@tanstack/react-query';
import { FundingService } from '../../lib/api/funding';
import { queryKeys } from '../../lib/query/keys';
import { FundingDeal } from '../../types/api';

export function useRecentDeals(limit: number = 5) {
  return useQuery({
    queryKey: queryKeys.dashboard.recentDeals(limit),
    queryFn: async (): Promise<FundingDeal[]> => {
      const response = await FundingService.getRecentDeals(limit);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data || [];
    },
    // Recent deals change more frequently, shorter cache time
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    // More frequent background refetch for recent deals
    refetchInterval: 2 * 60 * 1000, // 2 minutes
    refetchIntervalInBackground: false,
  });
}