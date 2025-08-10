# Database Schema Design Summary

## Overview
This document explains the new normalized database schema designed specifically for Alex Chen's climate tech VC pipeline requirements.

## Current State vs New Schema

### Current System
- **Single Table**: One `deals` table with all data mixed together
- **Data Duplication**: Company information repeated for each deal
- **Limited Filtering**: Basic filter implementation without flexibility
- **No Enrichment**: Manual processing only

### New Normalized Schema
- **8 Core Tables**: Properly normalized with clear relationships
- **Flexible Filtering**: Alex's configurable preference system
- **Automated Enrichment**: Queue-based processing system
- **Performance Optimized**: Strategic indexes and views

## Core Tables Breakdown

### 1. `companies` Table
**Purpose**: Centralized company information with enrichment capabilities

**Key Features**:
- **UUID Primary Key**: For scalability and security
- **Company Details**: Name, website, description, founding year
- **Geographic Data**: City, state, country for Alex's geo preferences
- **Climate Tech Focus**: Boolean flags for climate tech and AI focus
- **Sector Arrays**: Flexible storage for multiple climate sub-sectors
- **Enrichment Tracking**: Status, confidence scores, last enriched timestamp
- **Data Quality**: Verification status and confidence scoring

**Alex's Benefits**:
- No duplicate company data across deals
- Rich company profiles for better decision making
- Automatic enrichment queue integration
- Geographic filtering for Alex's US/Canada/UK preference

### 2. `deals` Table
**Purpose**: Funding round information with Alex's scoring system

**Key Features**:
- **Normalized Structure**: References companies table via foreign key
- **Financial Data**: Amount raised, currency conversion, original format
- **Alex's Scoring**: Investment score (0-100) with automatic calculation
- **Review System**: Alex's review status and notes
- **Source Tracking**: URL, type, reliability for data provenance

**Alex's Benefits**:
- Clean separation of deal vs company data
- Built-in scoring system matching Alex's criteria
- Review workflow for managing pipeline
- Source reliability tracking for data quality

### 3. `investors` Table
**Purpose**: VC firm and investor tracking

**Key Features**:
- **Investor Profiles**: Name, type, website, focus areas
- **Geographic Focus**: Array of regions they invest in
- **Check Sizes**: Typical minimum and maximum investment amounts
- **Climate Focus**: Boolean flag for climate-focused investors

**Alex's Benefits**:
- Network mapping of climate investors
- Co-investment opportunity identification
- Check size compatibility analysis

### 4. `deal_investors` Table
**Purpose**: Many-to-many relationship between deals and investors

**Key Features**:
- **Role Tracking**: Lead vs participant investor identification
- **Investment Amounts**: Specific amounts when available
- **Unique Constraints**: Prevents duplicate relationships

**Alex's Benefits**:
- Complete funding round composition
- Lead investor identification for outreach
- Investment pattern analysis

## Alex's Filter System

### 5. `alex_filter_settings` Table
**Purpose**: Configurable filter preferences with flexible/strict modes

**Key Design**:
- **Setting Name**: Unique identifier for each filter type
- **JSONB Storage**: Flexible configuration storage
- **Enable/Disable**: Toggle filters on/off without losing configuration
- **Strict vs Flexible**: Control whether filters are hard requirements or preferences

**Current Filter Settings**:
1. **Stage Filter**: Seed/Series A preference with flexible mode
2. **AI Filter**: AI requirement with strict/flexible toggle
3. **Sector Filter**: Target climate tech sectors with flexibility
4. **Geography Filter**: US/Canada/UK preference
5. **Funding Size Filter**: $500K-$15M range with $1M-$8M optimal

### 6. `alex_deal_views` Table
**Purpose**: Saved filter combinations for different use cases

**Benefits**:
- **Multiple Views**: "All Deals", "Strict Filter", "Flexible Filter"
- **Quick Switching**: Toggle between filtering modes instantly
- **Custom Filters**: Create specialized views for specific searches

## Enrichment & Processing System

### 7. `enrichment_queue` Table
**Purpose**: Automated company data enrichment pipeline

**Features**:
- **Priority System**: 1-10 scale for processing order
- **Retry Logic**: Attempt tracking with failure handling
- **Status Tracking**: Pending → Processing → Completed/Failed
- **Error Logging**: Detailed error messages for debugging

**Alex's Benefits**:
- Automatic company research
- Priority processing for high-score deals
- Reliable data enrichment pipeline

### 8. `data_sources` Table
**Purpose**: Source health monitoring and reliability tracking

**Features**:
- **Health Monitoring**: Last scrape time and error tracking
- **Reliability Scores**: 0.0-1.0 scale for source quality
- **Active Status**: Enable/disable sources without data loss

**Alex's Benefits**:
- Data source reliability awareness
- Pipeline health monitoring
- Quality-weighted scoring

## Key Functions & Views

### Alex's Scoring Function
```sql
calculate_alex_score()
```
**Purpose**: Automatically score deals based on Alex's criteria
**Inputs**: Stage, amount, AI focus, sectors, geography, media mentions
**Output**: 0-100 score with filter mode respect

**Scoring Breakdown**:
- **Stage Match**: 30 points for Seed/Series A
- **AI Requirement**: 25 points if AI-driven
- **Sector Match**: 25 points for target sectors
- **Geography**: 10 points for US, 7 for Canada/UK
- **Funding Size**: 15 points for optimal range
- **Proprietary Bonus**: 10 points for low media mention deals

### Useful Views

#### `alex_daily_prospects`
**Purpose**: Daily filtered view of high-scoring deals
**Criteria**: Score ≥ 60 and pending review status
**Sorting**: By score (desc), then by date (newest first)

#### `pipeline_health`
**Purpose**: Monitor data source performance
**Metrics**: Reliability scores, error counts, deals found last 7 days

## Migration Strategy

### Phase 1: Schema Implementation
1. **Create New Tables**: Deploy schema in parallel to existing system
2. **Data Migration**: Move existing deals data to normalized structure
3. **Validation**: Ensure data integrity and completeness

### Phase 2: Application Updates
1. **API Layer**: Update to use normalized schema
2. **AI Processing**: Integrate with new scoring function
3. **Dashboard**: Connect to new views and filter system

### Phase 3: Enrichment Activation
1. **Queue Processing**: Implement enrichment workers
2. **Source Monitoring**: Activate health tracking
3. **Alex's Interface**: Deploy filter management UI

## Performance Considerations

### Strategic Indexes
- **Primary Lookups**: Company name, deal date, investment score
- **Filter Columns**: All Alex's filter criteria indexed
- **Foreign Keys**: All relationship columns indexed
- **Composite Indexes**: Multi-column searches optimized

### Query Optimization
- **Views**: Pre-computed common queries
- **JSONB Indexes**: Filter settings searchable
- **Partial Indexes**: Filtered indexes for common conditions

## Security & Data Quality

### Row Level Security (RLS)
- **Enabled**: All tables protected
- **Policies**: Authenticated user access only
- **Future**: Can be refined for multi-user scenarios

### Data Quality Features
- **Confidence Scores**: All data has quality metrics
- **Source Tracking**: Complete data provenance
- **Verification Status**: Manual verification workflow
- **Duplicate Prevention**: Unique constraints and validation

## Alex's Benefits Summary

1. **Flexible Filtering**: Switch between strict and flexible modes instantly
2. **Automatic Scoring**: Deals scored according to investment criteria
3. **Rich Company Profiles**: Complete company information with enrichment
4. **Pipeline Management**: Clear review workflow with notes and status
5. **Data Quality**: Confidence scores and source reliability tracking
6. **Performance**: Fast queries with strategic indexing
7. **Scalability**: Normalized design supports growth
8. **Customization**: Configurable filters without code changes

This schema transforms the simple scraping system into a professional VC intelligence platform tailored specifically for Alex's investment focus and decision-making process.

## Implementation Verification

### Code Components Created ✅
- **TypeScript Types**: Complete interface definitions in `src/types/climate-schema.ts`
- **API Service**: Full CRUD operations in `src/lib/api/climate-vc-api.ts`
- **React Widgets**: AlexProspectsWidget, AIFocusedDealsWidget, PipelineHealthWidget
- **Dashboard**: Comprehensive AlexDashboard component
- **Migration Script**: Complete schema setup in `scripts/setup-alex-schema.sh`

### Schema Alignment ✅
- **8 Core Tables**: All implemented with proper relationships
- **UUID Primary Keys**: Used throughout for scalability
- **JSONB Filters**: Alex's configurable filter system implemented
- **Scoring Function**: calculate_alex_score() function included
- **Views**: alex_daily_prospects and pipeline_health views created
- **Indexes**: Strategic indexing for performance
- **RLS Policies**: Security implemented for all tables

### Alex's Workflow Integration ✅
- **Deal Scoring**: Automatic 0-100 scoring based on criteria
- **Review System**: Interested/Pass workflow with notes
- **Filter Management**: Configurable preferences with strict/flexible modes
- **Real-time Updates**: Live subscriptions for high-score deals
- **Pipeline Health**: Source monitoring and reliability tracking
- **AI Focus**: Dedicated AI deal filtering and signals

The implementation fully aligns with this design summary and provides Alex with a comprehensive VC intelligence platform.
