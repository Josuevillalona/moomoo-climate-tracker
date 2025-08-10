# Recent Funding Rounds Widget Migration Guide

## Problem Statement

The new enhanced schema changes **WILL BREAK** the existing `EnhancedFundingRoundsWidget` because:

1. **Data Structure Changes**:
   - Old: Single `deals` table with denormalized company data
   - New: Normalized `deals` + `companies` + `investors` tables

2. **ID Type Changes**:
   - Old: `id: number` (auto-increment integers)
   - New: `id: string` (UUID)

3. **Field Name Changes**:
   - Old: `company_name`, `amount_raised`, `climate_sub_sector`
   - New: `company.name`, `amount_raised_usd`, `company.climate_sub_sectors[]`

4. **Enhanced Data**:
   - New: Investment scoring, AI focus, verification status
   - New: Investor relationships, confidence scores

## Migration Strategy

### Option 1: Gradual Migration (Recommended)

**Phase 1: Create Backward-Compatible Widget**
- ✅ Created `EnhancedFundingRoundsWidget-v2.tsx` 
- Supports both old and new schema via `useNewSchema` prop
- Automatic data normalization based on schema type

**Phase 2: Update Dashboard Usage**
```tsx
// In RecentDealsSection.tsx - detect schema type
const isUsingNewSchema = recentDeals.some(deal => 
  typeof deal.id === 'string' && 'company' in deal
);

<EnhancedFundingRoundsWidget
  size="expanded"
  useNewSchema={isUsingNewSchema}  // 👈 New prop
  deals={recentDeals}
  // ... other props
/>
```

**Phase 3: Complete Migration**
- Run database schema migration
- Update API endpoints to return new schema data
- Set `useNewSchema={true}` permanently

### Option 2: Direct Replacement

**Immediate Steps**:
1. Run database migration
2. Update API services to use new schema
3. Replace old widget with enhanced version
4. Update all component usages

## Enhanced Features with New Schema

### 🎯 Investment Scoring
```tsx
// Shows Alex's 0-100 investment scores
<div className="px-2 py-1 rounded-full font-semibold text-xs bg-green-50 text-green-600">
  {deal.investment_score}
</div>
```

### 🧠 AI Focus Indicators
```tsx
// Highlights AI-powered companies
{deal.company?.has_ai_focus && (
  <Badge className="bg-purple-100 text-purple-800">
    <Brain className="w-3 h-3 mr-1" />
    AI
  </Badge>
)}
```

### ✅ Verification Status
```tsx
// Shows verified companies
{deal.company?.verification_status === 'verified' && (
  <Badge className="bg-green-100 text-green-800">
    <Sparkles className="w-3 h-3 mr-1" />
    Verified
  </Badge>
)}
```

### 👥 Enhanced Investor Display
```tsx
// Lead vs participant investors
<span>{deal.leadInvestor || 'Undisclosed'}</span>
{deal.otherInvestors?.length > 0 && (
  <div className="text-xs text-gray-400">
    +{deal.otherInvestors.length} others
  </div>
)}
```

## Data Transformation Logic

### Old Schema → Display Format
```tsx
const oldDeal = {
  id: 123,                    // number
  company_name: "ClimateAI",
  amount_raised: 5000000,
  climate_sub_sector: "Energy Storage",
  lead_investors: "GV, Kleiner Perkins"
};

// Transformed to:
const normalized = {
  id: "123",
  companyName: "ClimateAI",
  fundingAmount: 5000000,
  sector: "Energy Storage",
  leadInvestor: "GV",
  hasAiFocus: false,           // Unknown in old schema
  investmentScore: 0,          // Not available
  verificationStatus: 'pending'
};
```

### New Schema → Display Format
```tsx
const newDeal = {
  id: "uuid-string",
  company: {
    name: "ClimateAI",
    has_ai_focus: true,
    climate_sub_sectors: ["Energy Storage", "AI"],
    verification_status: "verified"
  },
  amount_raised_usd: 5000000,
  investment_score: 85,
  investors: [
    { role: "lead", investor: { name: "GV" } },
    { role: "participant", investor: { name: "Kleiner Perkins" } }
  ]
};

// Transformed to:
const normalized = {
  id: "uuid-string",
  companyName: "ClimateAI",
  fundingAmount: 5000000,
  sector: "Energy Storage",
  leadInvestor: "GV",
  otherInvestors: ["Kleiner Perkins"],
  hasAiFocus: true,            // ✅ Available
  investmentScore: 85,         // ✅ Available
  verificationStatus: "verified"
};
```

## Implementation Steps

### 1. Update the Widget
```bash
# Backup current widget
cp src/components/enhanced-widgets/funding/EnhancedFundingRoundsWidget.tsx \
   src/components/enhanced-widgets/funding/EnhancedFundingRoundsWidget-old.tsx

# Replace with new version
cp src/components/enhanced-widgets/funding/EnhancedFundingRoundsWidget-v2.tsx \
   src/components/enhanced-widgets/funding/EnhancedFundingRoundsWidget.tsx
```

### 2. Update Props Interface
```tsx
// In types/enhanced-widgets.ts
export interface EnhancedFundingRoundsProps {
  size: 'normal' | 'expanded';
  filters: FundingFilters;
  onFilterChange: (filters: FundingFilters) => void;
  realTimeEnabled: boolean;
  deals: FundingDeal[] | EnhancedDeal[];  // 👈 Support both types
  useNewSchema?: boolean;                 // 👈 New prop
  loading?: boolean;
  error?: Error | null;
}
```

### 3. Update Dashboard Usage
```tsx
// In RecentDealsSection.tsx
import { EnhancedDeal } from '@/types/climate-schema';

// Detect schema type
const detectSchemaType = (deals: any[]): boolean => {
  if (deals.length === 0) return false;
  const firstDeal = deals[0];
  return typeof firstDeal.id === 'string' && 'company' in firstDeal;
};

const isNewSchema = detectSchemaType(recentDeals);

<EnhancedFundingRoundsWidget
  size="expanded"
  useNewSchema={isNewSchema}
  deals={recentDeals}
  // ... other props
/>
```

### 4. Update API Integration
```tsx
// New API service usage
import { climateVCApi } from '@/lib/api/climate-vc-api';

// For new schema
const { data: enhancedDeals } = await climateVCApi.searchDeals({
  alex_review_status: ['pending', 'interested'],
  investment_score_min: 60
});

// Pass to widget
<EnhancedFundingRoundsWidget
  deals={enhancedDeals?.deals || []}
  useNewSchema={true}
  // ...
/>
```

## Testing Strategy

### 1. Test Old Schema (Before Migration)
```tsx
const oldTestDeals = [
  {
    id: 1,
    companyName: "Test Company",
    amountRaised: 1000000,
    fundingStage: "Seed",
    // ... old format
  }
];

<EnhancedFundingRoundsWidget
  deals={oldTestDeals}
  useNewSchema={false}
/>
```

### 2. Test New Schema (After Migration)
```tsx
const newTestDeals = [
  {
    id: "uuid-123",
    company: { name: "Test Company", has_ai_focus: true },
    amount_raised_usd: 1000000,
    investment_score: 75,
    // ... new format
  }
];

<EnhancedFundingRoundsWidget
  deals={newTestDeals}
  useNewSchema={true}
/>
```

## Benefits of New Widget

### ✅ Backward Compatibility
- Works with existing old schema data
- Graceful degradation for missing fields
- No breaking changes during migration

### ✅ Enhanced Features
- Investment scoring display
- AI focus indicators
- Verification badges
- Better investor relationships
- Source quality indicators

### ✅ Future-Proof
- Ready for Alex's enhanced pipeline
- Supports real-time scoring updates
- Extensible for additional signals

## Migration Timeline

1. **Week 1**: Deploy updated widget with backward compatibility
2. **Week 2**: Run database schema migration
3. **Week 3**: Update API endpoints to new schema
4. **Week 4**: Enable new schema features, test thoroughly
5. **Week 5**: Remove old schema support

This approach ensures zero downtime and smooth transition to the enhanced schema while immediately benefiting from Alex's investment intelligence features.
