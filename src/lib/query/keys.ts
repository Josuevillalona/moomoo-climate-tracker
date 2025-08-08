// Query key factory for consistent cache key management
export const queryKeys = {
  // Dashboard related queries
  dashboard: {
    all: ['dashboard'] as const,
    metrics: () => [...queryKeys.dashboard.all, 'metrics'] as const,
    recentDeals: (limit?: number) => [...queryKeys.dashboard.all, 'recent-deals', limit] as const,
  },
  
  // Deals related queries
  deals: {
    all: ['deals'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.deals.all, 'list', filters] as const,
    detail: (id: number) => [...queryKeys.deals.all, 'detail', id] as const,
  },
} as const;