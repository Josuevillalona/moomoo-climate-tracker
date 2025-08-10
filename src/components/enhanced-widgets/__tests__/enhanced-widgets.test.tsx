/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import types to verify they compile correctly
import {
  EnhancedFundingDeal,
  NewsArticle,
  UserPreferences,
  FundingFilters,
  NewsFilters,
  ReportConfig,
} from '../../../types/enhanced-widgets';

// Import components to verify they compile correctly
import EnhancedWidgetWrapper from '../EnhancedWidgetWrapper';
import WidgetErrorBoundary from '../common/WidgetErrorBoundary';
import WidgetLoadingState from '../common/WidgetLoadingState';
import WidgetHeader from '../common/WidgetHeader';

describe('Enhanced Widget Infrastructure', () => {
  describe('TypeScript Types', () => {
    it('should have properly defined enhanced funding deal type', () => {
      const mockDeal: EnhancedFundingDeal = {
        // Base FundingDeal properties
        id: 1,
        companyName: 'Test Company',
        fundingStage: 'Series A',
        amountRaised: 1000000,
        dateAnnounced: '2024-01-01',
        leadInvestors: ['Test VC'],
        otherInvestors: ['Other VC'],
        climateSector: 'Clean Energy',
        country: 'USA',
        status: 'active',
        createdAt: '2024-01-01',
        formattedAmount: '$1M',
        formattedDate: 'Jan 1, 2024',
        daysAgo: 30,
        allInvestors: ['Test VC', 'Other VC'],
        
        // Enhanced properties
        signals: [{
          type: 'growth_indicator',
          description: 'Strong growth metrics',
          confidence: 0.8,
          source: 'financial_data'
        }],
        relevanceScore: 0.9,
        matchedFilters: ['Series A', 'Clean Energy'],
        isNew: true,
        highlightUntil: new Date('2024-01-02')
      };

      expect(mockDeal.id).toBe(1);
      expect(mockDeal.signals).toHaveLength(1);
      expect(mockDeal.isNew).toBe(true);
    });

    it('should have properly defined news article type', () => {
      const mockArticle: NewsArticle = {
        id: '1',
        title: 'Test Article',
        description: 'Test description',
        source: 'Test Source',
        publishedAt: new Date('2024-01-01'),
        relevanceScore: 0.8,
        signals: [{
          type: 'funding',
          confidence: 0.9,
          extractedData: { amount: 1000000 }
        }],
        relatedCompanies: ['Test Company'],
        category: 'funding' as any,
        url: 'https://example.com'
      };

      expect(mockArticle.title).toBe('Test Article');
      expect(mockArticle.signals).toHaveLength(1);
    });

    it('should have properly defined user preferences type', () => {
      const mockPreferences: UserPreferences = {
        id: '1',
        userId: 'user1',
        defaultFilters: {
          funding: {
            stages: [{
              id: '1',
              name: 'Series A',
              selected: true
            }],
            sectors: ['Clean Energy'],
            fundingRange: { min: 0, max: 10000000 },
            dateRange: { start: new Date(), end: new Date() },
            keywords: ['climate']
          },
          news: {
            categories: ['funding' as any],
            signalTypes: ['funding'],
            relevanceThreshold: 0.5,
            dateRange: { start: new Date(), end: new Date() },
            sources: ['TechCrunch'],
            relatedToFundingFilters: true
          }
        },
        notificationSettings: {
          email: true,
          push: false,
          frequency: 'daily',
          fundingAlerts: true,
          newsAlerts: true,
          reportGeneration: true
        },
        dashboardLayout: {
          widgetSizes: { 'funding': 'expanded' },
          widgetOrder: ['funding', 'news', 'reports'],
          gridColumns: 3
        },
        reportTemplates: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(mockPreferences.userId).toBe('user1');
      expect(mockPreferences.notificationSettings.frequency).toBe('daily');
    });
  });

  describe('Widget Components', () => {
    it('should render WidgetLoadingState', () => {
      render(
        <WidgetLoadingState 
          title="Test Widget" 
          size="normal" 
          type="funding" 
        />
      );
      
      // WidgetLoadingState renders skeleton content, not the title text
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('should render WidgetHeader', () => {
      render(
        <WidgetHeader 
          title="Test Header" 
          subtitle="Test subtitle"
        />
      );
      
      expect(screen.getByText('Test Header')).toBeInTheDocument();
      expect(screen.getByText('Test subtitle')).toBeInTheDocument();
    });

    it('should render EnhancedWidgetWrapper with children', () => {
      render(
        <EnhancedWidgetWrapper 
          title="Test Widget"
          size="normal"
        >
          <div>Test Content</div>
        </EnhancedWidgetWrapper>
      );
      
      expect(screen.getByText('Test Widget')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render loading state when loading prop is true', () => {
      render(
        <EnhancedWidgetWrapper 
          title="Test Widget"
          size="normal"
          loading={true}
          type="funding"
        >
          <div>Test Content</div>
        </EnhancedWidgetWrapper>
      );
      
      // Should show loading skeleton instead of content
      expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
    });
  });
});