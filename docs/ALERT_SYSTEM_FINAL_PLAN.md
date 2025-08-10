# 🚨 **Real-Time Alert System Implementation Plan**

## **Table Strategy: `deals_new` vs `deals`**

### ✅ **RECOMMENDATION: Use `deals_new` for Enhanced Schema**

Based on your requirements and the analysis, here's the recommended approach:

#### **Current State**
- **Legacy**: `public.deals` (single table, denormalized)
- **Enhanced**: New normalized schema with `deals_new` as the core table

#### **Migration Strategy**
```sql
-- Phase 1: Create new enhanced schema
CREATE TABLE deals_new (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id),
    amount_raised_usd BIGINT,
    funding_stage VARCHAR(50),
    date_announced DATE,
    investment_score INTEGER, -- Alex's 0-100 scoring
    alex_review_status VARCHAR(20) DEFAULT 'pending',
    source_url TEXT,
    status VARCHAR(20) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT now()
);

-- Real-time alert optimized index
CREATE INDEX idx_deals_new_alerts ON deals_new(
    investment_score DESC, 
    created_at DESC
) WHERE status = 'new' AND investment_score >= 60;
```

## **🎯 Enhanced Alert System Features**

### **1. Customizable Filter Rules**
```typescript
interface AlertRule {
  name: "AI Seed Deals" | "Industrial Series A" | "Stealth Opportunities";
  filters: {
    investment_score_min: 70;      // Alex's threshold
    funding_stages: ["Seed"];      // Target stages
    has_ai_focus: true;            // AI requirement
    countries: ["United States"];  // Geographic filter
    funding_range: { min: 500000, max: 5000000 };
  };
  notifications: {
    email: true;    // alex@climatevcp.com
    push: true;     // Browser notifications
    slack: true;    // Slack integration
  };
  priority: "critical" | "high" | "medium";
}
```

### **2. Real-Time Scoring Function**
```sql
CREATE OR REPLACE FUNCTION calculate_alex_score()
RETURNS TRIGGER AS $$
BEGIN
    -- Initialize score
    NEW.investment_score := 0;
    
    -- Stage scoring (30 points max)
    NEW.investment_score := NEW.investment_score + CASE 
        WHEN NEW.funding_stage = 'Seed' THEN 30
        WHEN NEW.funding_stage = 'Series A' THEN 25
        WHEN NEW.funding_stage = 'Pre-Seed' THEN 20
        ELSE 10
    END;
    
    -- AI focus bonus (25 points)
    IF (SELECT has_ai_focus FROM companies WHERE id = NEW.company_id) THEN
        NEW.investment_score := NEW.investment_score + 25;
    END IF;
    
    -- Climate sector match (25 points)
    IF (SELECT climate_sub_sectors && ARRAY['Industrial Automation', 'Supply Chain', 'Energy Storage'] 
        FROM companies WHERE id = NEW.company_id) THEN
        NEW.investment_score := NEW.investment_score + 25;
    END IF;
    
    -- Geography bonus (10 points)
    NEW.investment_score := NEW.investment_score + CASE 
        WHEN (SELECT headquarters_country FROM companies WHERE id = NEW.company_id) = 'United States' THEN 10
        WHEN (SELECT headquarters_country FROM companies WHERE id = NEW.company_id) IN ('Canada', 'United Kingdom') THEN 7
        ELSE 3
    END;
    
    -- Funding size fit (10 points)
    NEW.investment_score := NEW.investment_score + CASE 
        WHEN NEW.amount_raised_usd BETWEEN 1000000 AND 8000000 THEN 10
        WHEN NEW.amount_raised_usd BETWEEN 500000 AND 15000000 THEN 7
        ELSE 3
    END;
    
    -- Trigger real-time alert if high score
    IF NEW.investment_score >= 70 THEN
        PERFORM pg_notify('high_score_deal', 
            json_build_object(
                'deal_id', NEW.id,
                'score', NEW.investment_score,
                'company_id', NEW.company_id
            )::text
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to deals_new table
CREATE TRIGGER alex_scoring_trigger
    BEFORE INSERT OR UPDATE ON deals_new
    FOR EACH ROW
    EXECUTE FUNCTION calculate_alex_score();
```

### **3. Multi-Channel Alert System**
```typescript
class EnhancedAlertService {
  // Real-time subscription
  subscribeToAlerts(rules: AlertRule[]) {
    return supabase
      .channel('alex_alerts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'deals_new',
        filter: 'investment_score=gte.60'
      }, (payload) => {
        this.processNewDeal(payload.new, rules);
      })
      .subscribe();
  }
  
  // Multi-channel notifications
  async sendAlerts(deal: EnhancedDeal, matchingRules: AlertRule[]) {
    for (const rule of matchingRules) {
      // Email alert
      if (rule.notifications.email) {
        await this.sendEmail({
          to: 'alex@climatevcp.com',
          subject: `🚨 ${rule.name}: ${deal.company.name} - Score ${deal.investment_score}/100`,
          template: 'deal-alert-v2',
          data: {
            ruleName: rule.name,
            companyName: deal.company.name,
            amount: formatAmount(deal.amount_raised_usd),
            stage: deal.funding_stage,
            score: deal.investment_score,
            aiFlag: deal.company.has_ai_focus,
            sectors: deal.company.climate_sub_sectors,
            country: deal.company.headquarters_country,
            actionUrl: `https://app.climatevcp.com/deals/${deal.id}`
          }
        });
      }
      
      // Slack alert with rich formatting
      if (rule.notifications.slack) {
        await this.sendSlack({
          channel: '#alex-deal-alerts',
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `🎯 *${rule.name}* alert triggered!\n*Score: ${deal.investment_score}/100*`
              }
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: `*Company:*\n${deal.company.name}` },
                { type: "mrkdwn", text: `*Amount:*\n${formatAmount(deal.amount_raised_usd)}` },
                { type: "mrkdwn", text: `*Stage:*\n${deal.funding_stage}` },
                { type: "mrkdwn", text: `*Location:*\n${deal.company.headquarters_country}` }
              ]
            },
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: { type: "plain_text", text: "👍 Interested" },
                  style: "primary",
                  action_id: `interested_${deal.id}`
                },
                {
                  type: "button",
                  text: { type: "plain_text", text: "👎 Pass" },
                  action_id: `pass_${deal.id}`
                },
                {
                  type: "button",
                  text: { type: "plain_text", text: "🔗 View Details" },
                  url: `https://app.climatevcp.com/deals/${deal.id}`
                }
              ]
            }
          ]
        });
      }
    }
  }
}
```

## **📊 Implementation Components Created**

### ✅ **Components Built**
1. **`CustomizableAlertSystem.tsx`** - Main alert dashboard widget
2. **`AlertConfigDialog.tsx`** - Rule configuration interface
3. **`useRealtimeAlerts.ts`** - Real-time subscription hook
4. **`deals-new-service.ts`** - Enhanced API service for new schema
5. **`REALTIME_ALERT_MIGRATION.md`** - Complete migration guide

### ✅ **Key Features**
- **Real-Time Scoring**: Automatic deal scoring on insert
- **Customizable Rules**: Alex can configure multiple alert rules
- **Multi-Channel Alerts**: Email, Push, Slack notifications
- **Connection Health**: Monitor real-time connection status
- **Rule Management**: Create, edit, pause/activate rules
- **Performance Optimized**: Strategic indexes for fast queries

## **🚀 Immediate Implementation Steps**

### **Step 1: Database Migration**
```bash
# Run the enhanced schema setup
./scripts/setup-alex-schema.sh

# This creates:
# - companies table
# - deals_new table (your new core table)
# - investors table
# - deal_investors table
# - alex_filter_settings table
# - Scoring function and triggers
```

### **Step 2: Update API Layer**
```typescript
// Switch to using deals_new in your services
import { DealsNewService } from '@/lib/api/deals-new-service';

// Replace existing calls:
// OLD: FundingService.getRecentDeals()
// NEW: DealsNewService.getEnhancedDeals({ limit: 5 })
```

### **Step 3: Deploy Alert System**
```typescript
// Add to your dashboard
import { CustomizableAlertSystem } from '@/components/enhanced-widgets/alerts';

<CustomizableAlertSystem 
  size="expanded"
  enableNotifications={true}
  enableEmailAlerts={true}
/>
```

## **🎯 Alex's Immediate Value**

### **Pre-configured Alert Rules**
1. **"AI Seed Goldmine"** - Seed + AI + Score ≥70 + North America
2. **"Series A Industrial"** - Series A + Industrial/Supply Chain + Score ≥60
3. **"Stealth Opportunities"** - Score ≥80 + Low media mentions
4. **"Climate Leaders"** - Top sectors + Score ≥75 + $2M+ funding

### **Real-Time Benefits**
- **Instant Alerts**: New deals matching criteria trigger immediate notifications
- **Smart Scoring**: Automatic 0-100 scoring based on Alex's investment thesis
- **Multi-Channel**: Email, browser push, and Slack notifications
- **Zero Latency**: Real-time database triggers for immediate response
- **Rich Context**: Full company profiles, funding details, and source tracking

## **📈 Expected Performance**

### **Alert Latency**: < 2 seconds from deal creation to notification
### **Scoring Accuracy**: Tuned to Alex's specific investment criteria
### **Connection Reliability**: Automatic reconnection with health monitoring
### **Customization**: Fully configurable without code changes

## **🔄 Migration Timeline**

- **Day 1**: Deploy enhanced schema alongside existing tables
- **Day 2**: Set up dual-write system (write to both old and new tables)
- **Day 3**: Deploy alert system using deals_new
- **Day 4**: Test and refine scoring algorithm
- **Day 5**: Switch all reads to deals_new
- **Day 6**: Full production deployment
- **Day 7**: Remove legacy table dependencies

This approach ensures **zero downtime** while providing Alex with immediate access to the enhanced real-time alert system using the `deals_new` table structure!
