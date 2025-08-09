// Re-export all the refactored services for backward compatibility
export { MetricsService } from './MetricsService';
export { DealsService } from './DealsService';
export { BaseApiService } from './BaseApiService';

// Legacy FundingService that delegates to the new services
import { MetricsService } from './MetricsService';
import { DealsService } from './DealsService';
import {
  DashboardMetricsResponse,
  RecentDealsResponse,
  PaginatedDealsResponse,
  DealResponse,
  DealFilters
} from '../../types/api';

/**
 * Legacy FundingService for backward compatibility
 * Delegates to the new refactored services
 */
export class FundingService {
  /**
   * Fetch dashboard metrics including totals and aggregated data
   * @deprecated Use MetricsService.getDashboardMetrics() instead
   */
  static async getDashboardMetrics(): Promise<DashboardMetricsResponse> {
    return MetricsService.getDashboardMetrics();
  }

  /**
   * Fetch recent funding deals with optimized query
   * @deprecated Use DealsService.getRecentDeals() instead
   */
  static async getRecentDeals(limit: number = 10): Promise<RecentDealsResponse> {
    return DealsService.getRecentDeals(limit);
  }

  /**
   * Fetch paginated deals with filters
   * @deprecated Use DealsService.getDeals() instead
   */
  static async getDeals(
    filters: DealFilters = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedDealsResponse> {
    return DealsService.getDeals(filters, page, pageSize);
  }

  /**
   * Get a single deal by ID
   * @deprecated Use DealsService.getDealById() instead
   */
  static async getDealById(id: number): Promise<DealResponse> {
    return DealsService.getDealById(id);
  }

  /**
   * Search deals by company name or other criteria
   * @deprecated Use DealsService.searchDeals() instead
   */
  static async searchDeals(searchTerm: string, limit: number = 10): Promise<RecentDealsResponse> {
    return DealsService.searchDeals(searchTerm, limit);
  }
}
