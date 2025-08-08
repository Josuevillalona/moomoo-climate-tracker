import { queryKeys } from '../keys';

describe('Query Keys', () => {
  it('should generate consistent dashboard query keys', () => {
    expect(queryKeys.dashboard.all).toEqual(['dashboard']);
    expect(queryKeys.dashboard.metrics()).toEqual(['dashboard', 'metrics']);
    expect(queryKeys.dashboard.recentDeals()).toEqual(['dashboard', 'recent-deals', undefined]);
    expect(queryKeys.dashboard.recentDeals(5)).toEqual(['dashboard', 'recent-deals', 5]);
    expect(queryKeys.dashboard.recentDeals(10)).toEqual(['dashboard', 'recent-deals', 10]);
  });

  it('should generate consistent deals query keys', () => {
    expect(queryKeys.deals.all).toEqual(['deals']);
    expect(queryKeys.deals.list()).toEqual(['deals', 'list', undefined]);
    expect(queryKeys.deals.list({ status: 'active' })).toEqual(['deals', 'list', { status: 'active' }]);
    expect(queryKeys.deals.detail(123)).toEqual(['deals', 'detail', 123]);
  });

  it('should maintain key hierarchy for cache invalidation', () => {
    // Dashboard keys should be hierarchical
    const dashboardAll = queryKeys.dashboard.all;
    const dashboardMetrics = queryKeys.dashboard.metrics();
    const dashboardDeals = queryKeys.dashboard.recentDeals(5);
    
    expect(dashboardMetrics.slice(0, dashboardAll.length)).toEqual(dashboardAll);
    expect(dashboardDeals.slice(0, dashboardAll.length)).toEqual(dashboardAll);
    
    // Deals keys should be hierarchical
    const dealsAll = queryKeys.deals.all;
    const dealsList = queryKeys.deals.list();
    const dealsDetail = queryKeys.deals.detail(1);
    
    expect(dealsList.slice(0, dealsAll.length)).toEqual(dealsAll);
    expect(dealsDetail.slice(0, dealsAll.length)).toEqual(dealsAll);
  });
});