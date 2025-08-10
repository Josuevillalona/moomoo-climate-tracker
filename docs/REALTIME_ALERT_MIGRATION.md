# Real-Time Alert System Migration Strategy

## 📊 **Table Migration Plan: `deals` → `deals_new`**

### **Current State Analysis**
- **Legacy Table**: `public.deals` (single denormalized table)
- **Target Schema**: Enhanced normalized schema with `deals_new`
- **Challenge**: Zero-downtime migration with real-time alerts

### **Recommended Migration Strategy**

#### **Phase 1: Schema Preparation**
```sql
-- 1. Create enhanced schema tables with "_new" suffix
CREATE TABLE public.deals_new (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id),
    amount_raised_usd BIGINT,
    original_amount VARCHAR(50),
    original_currency VARCHAR(10) DEFAULT 'USD',
    funding_stage VARCHAR(50),
    date_announced DATE,
    source_url TEXT NOT NULL,
    source_type VARCHAR(50),
    source_name VARCHAR(100),
    raw_text_content TEXT,
    confidence_score DECIMAL(3,2) DEFAULT 0.5,
    investment_score INTEGER, -- Alex's 0-100 score
    alex_review_status VARCHAR(20) DEFAULT 'pending',
    alex_notes TEXT,
    alex_review_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Index for real-time alerts performance
CREATE INDEX idx_deals_new_realtime ON deals_new(status, investment_score DESC, created_at DESC);
CREATE INDEX idx_deals_new_alex_score ON deals_new(investment_score DESC, alex_review_status);
```

#### **Phase 2: Dual-Write Implementation**
```typescript
// API service supports both tables during transition
export class FundingService {
  static async createDeal(dealData: any) {
    // Write to both legacy and new tables
    const [legacyResult, newResult] = await Promise.all([
      supabase.from('deals').insert(transformToLegacy(dealData)),
      supabase.from('deals_new').insert(transformToNew(dealData))
    ]);
    
    return newResult; // Return new format
  }
}
```

#### **Phase 3: Alert System Configuration**
```typescript
// Configure alerts to use deals_new table
const alertChannel = supabase
  .channel('realtime_alerts')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'deals_new', // Switch to new table
    filter: 'investment_score.gte.60' // Only high-score deals
  }, handleNewDeal)
  .subscribe();
```

#### **Phase 4: Migration & Cleanup**
```sql
-- After successful testing, rename tables
BEGIN;
  ALTER TABLE deals RENAME TO deals_legacy_backup;
  ALTER TABLE deals_new RENAME TO deals;
  -- Update all indexes and constraints
COMMIT;
```

## 🚨 **Enhanced Real-Time Alert System Features**

### **1. Customizable Filter Rules**
```typescript
interface AlertRule {
  name: string;
  filters: {
    investment_score_min: number; // Alex's scoring threshold
    funding_stages: string[];     // ['Seed', 'Series A']
    has_ai_focus: boolean;        // AI requirement
    climate_sectors: string[];    // Target sectors
    countries: string[];          // Geographic preference
    funding_range: { min: number; max: number };
  };
  notifications: {
    email: boolean;               // alex@climatevcp.com
    push: boolean;                // Browser notifications
    slack: boolean;               // Slack workspace alerts
  };
  priority: 'critical' | 'high' | 'medium' | 'low';
}
```

### **2. Real-Time Scoring & Alerts**
```sql
-- Database function for real-time scoring
CREATE OR REPLACE FUNCTION calculate_alex_score()
RETURNS TRIGGER AS $$
BEGIN
    -- Stage scoring (30 points max)
    NEW.investment_score := CASE 
        WHEN NEW.funding_stage IN ('Seed', 'Series A') THEN 30
        WHEN NEW.funding_stage = 'Pre-Seed' THEN 20
        ELSE 10
    END;
    
    -- AI bonus (25 points)
    IF (SELECT has_ai_focus FROM companies WHERE id = NEW.company_id) THEN
        NEW.investment_score := NEW.investment_score + 25;
    END IF;
    
    -- Sector match (25 points)
    -- Geography bonus (10 points)
    -- Funding size fit (10 points)
    
    -- Trigger alert if score >= threshold
    IF NEW.investment_score >= 70 THEN
        PERFORM pg_notify('high_score_deal', NEW.id::text);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on insert
CREATE TRIGGER score_deal_trigger
    BEFORE INSERT ON deals_new
    FOR EACH ROW
    EXECUTE FUNCTION calculate_alex_score();
```

### **3. Multi-Channel Notifications**
```typescript
class AlertNotificationService {
  async sendAlerts(deal: EnhancedDeal, matchingRules: AlertRule[]) {
    const promises = [];
    
    for (const rule of matchingRules) {
      // Email alerts
      if (rule.notifications.email) {
        promises.push(this.sendEmail({
          to: 'alex@climatevcp.com',
          subject: `🚨 ${rule.name}: ${deal.company.name}`,
          template: 'deal-alert',
          data: {
            companyName: deal.company.name,
            amount: formatAmount(deal.amount_raised_usd),
            stage: deal.funding_stage,
            score: deal.investment_score,
            sectors: deal.company.climate_sub_sectors,
            country: deal.company.headquarters_country,
            sourceUrl: deal.source_url
          }
        }));
      }
      
      // Slack alerts
      if (rule.notifications.slack) {
        promises.push(this.sendSlack({
          channel: '#deal-alerts',
          message: `🎯 *${rule.name}* - Score: ${deal.investment_score}/100\n` +
                  `🏢 ${deal.company.name} (${deal.company.headquarters_country})\n` +
                  `💰 ${formatAmount(deal.amount_raised_usd)} ${deal.funding_stage}\n` +
                  `🌿 ${deal.company.climate_sub_sectors.join(', ')}\n` +
                  `🔗 <${deal.source_url}|View Deal>`
        }));
      }
    }
    
    await Promise.all(promises);
  }
}
```

## 📈 **Performance Optimizations**

### **Strategic Indexes for Real-Time Queries**
```sql
-- Core alert indexes
CREATE INDEX idx_deals_new_alerts_hot ON deals_new(
  investment_score DESC, 
  created_at DESC
) WHERE status = 'new' AND investment_score >= 60;

-- Filter-specific indexes
CREATE INDEX idx_deals_new_ai_filter ON deals_new(created_at DESC)
  WHERE EXISTS (
    SELECT 1 FROM companies c 
    WHERE c.id = deals_new.company_id 
    AND c.has_ai_focus = true
  );

-- Geography filter
CREATE INDEX idx_deals_new_geo_filter ON deals_new(created_at DESC)
  WHERE EXISTS (
    SELECT 1 FROM companies c 
    WHERE c.id = deals_new.company_id 
    AND c.headquarters_country IN ('United States', 'Canada', 'United Kingdom')
  );
```

### **Real-Time Connection Health**
```typescript
// Monitor connection health for alerts
export const useAlertConnectionHealth = () => {
  const [status, setStatus] = useState<'connected' | 'reconnecting' | 'failed'>('connected');
  const [lastHeartbeat, setLastHeartbeat] = useState<Date>(new Date());
  
  useEffect(() => {
    const channel = supabase.channel('heartbeat')
      .on('presence', { event: 'sync' }, () => {
        setStatus('connected');
        setLastHeartbeat(new Date());
      })
      .subscribe();
      
    // Heartbeat check every 30 seconds
    const interval = setInterval(() => {
      const timeSinceHeartbeat = Date.now() - lastHeartbeat.getTime();
      if (timeSinceHeartbeat > 60000) { // 1 minute
        setStatus('reconnecting');
      }
    }, 30000);
    
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);
  
  return { status, lastHeartbeat };
};
```

## 🎯 **Alex's Immediate Value**

### **Pre-configured Alert Rules**
1. **"AI Seed Goldmine"**: Seed + AI focus + Score ≥70 + US/CA/UK
2. **"Series A Industrial"**: Series A + Industrial/Supply Chain + Score ≥60
3. **"Stealth Opportunities"**: Score ≥80 + Low media mentions + Pending review
4. **"Climate Leaders"**: Top climate sectors + Score ≥75 + $2M+ funding

### **Real-Time Dashboard Integration**
- **Live Badge**: Shows connection status and today's matches
- **Alert History**: Recent matches with rule triggering details
- **Performance Metrics**: Rule effectiveness and match quality
- **Quick Actions**: Mark as "Interested" or "Pass" directly from alerts

## 🔄 **Implementation Timeline**

### **Week 1**: Schema Setup
- Create `deals_new` and related tables
- Set up dual-write system
- Deploy scoring function

### **Week 2**: Alert System Core
- Build real-time subscription system
- Create alert rule management UI
- Implement notification channels

### **Week 3**: Testing & Refinement
- Test with live data
- Refine scoring algorithm based on Alex's feedback
- Performance optimization

### **Week 4**: Migration & Launch
- Switch to `deals_new` as primary table
- Full alert system activation
- Monitor and optimize

This migration strategy ensures Alex gets immediate value from the enhanced alert system while maintaining system stability during the transition from the legacy `deals` table to the new normalized schema.
