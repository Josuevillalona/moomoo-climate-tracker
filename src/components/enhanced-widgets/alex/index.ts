// Alex's Climate VC Dashboard Components
// Enhanced widgets specifically designed for Alex's investment workflow

export { default as AlexDashboard } from './AlexDashboard';
export { default as AlexProspectsWidget } from './AlexProspectsWidget';
export { default as AIFocusedDealsWidget } from './AIFocusedDealsWidget';
export { default as PipelineHealthWidget } from './PipelineHealthWidget';

// Types for Alex's components
export type {
  Deal,
  EnhancedDeal,
  Company,
  Investor,
  DealInvestor,
  AlexDashboardMetrics,
  AlexDealFilters,
  AlexFilterSettings,
  AlexDealView,
  DataSource,
  PipelineHealth,
  SectorBreakdown,
  StageBreakdown,
  GeographicBreakdown,
  ApiResponse
} from '../../../types/climate-schema';

// API service
export { climateVCApi, ClimateVCApiService } from '../../../lib/api/climate-vc-api';
