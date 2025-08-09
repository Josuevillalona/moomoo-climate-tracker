# Code Refactoring Plan - Large Files (>400 lines)

## Files to Refactor:

### 1. Dashboard Page (1111 lines) - `/src/app/dashboard/page.tsx`
**Breakdown Strategy:**
- Extract sidebar into separate component: `DashboardSidebar.tsx`
- Extract header into separate component: `DashboardHeader.tsx`
- Extract metrics cards into: `MetricsSection.tsx`
- Extract charts section into: `ChartsSection.tsx`
- Extract recent deals into: `RecentDealsSection.tsx`
- Extract company signals into: `CompanySignalsSection.tsx`
- Extract news section into: `NewsSection.tsx`
- Extract fund returns into: `FundReturnsSection.tsx`
- Create main layout component: `DashboardLayout.tsx`
- Extract real-time logic into custom hook: `useRealtimeDashboard.ts`

### 2. Funding API Service (1087 lines) - `/src/lib/api/funding.ts`
**Breakdown Strategy:**
- Split into multiple service classes:
  - `MetricsService.ts` - Dashboard metrics
  - `DealsService.ts` - Deal operations
  - `RealtimeService.ts` - Real-time subscriptions
  - `AnalyticsService.ts` - Analytics tracking
- Create base service class: `BaseApiService.ts`
- Extract query builders: `QueryBuilders.ts`
- Extract data transformers: `DataTransformers.ts`

### 3. User Analytics (930 lines) - `/src/lib/analytics/userAnalytics.ts`
**Breakdown Strategy:**
- Split into:
  - `UserInteractionTracker.ts` - User interaction tracking
  - `PerformanceTracker.ts` - Performance metrics
  - `SessionManager.ts` - Session management
  - `AnalyticsReporter.ts` - Reporting and aggregation
  - `AnalyticsTypes.ts` - Type definitions

### 4. Other files >400 lines:
- Real-time deals test (1026 lines) - Split test suites
- Loading states component (404 lines) - Split by component type
- Analytics dashboard (484 lines) - Break into sections
- Real-time deals hook (459 lines) - Extract logic into services

## Implementation Order:
1. Dashboard page refactoring (highest impact)
2. Funding API service (core functionality)
3. Analytics system (supporting functionality)
4. Test file refactoring
5. Remaining components

## Benefits:
- Improved maintainability
- Better code organization
- Easier testing
- Reduced cognitive load
- Better reusability
- Improved performance (smaller bundle sizes)
