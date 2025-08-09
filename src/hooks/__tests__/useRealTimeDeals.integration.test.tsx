import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRealTimeDeals } from '../useRealTimeDeals';
import { supabase } from '@/lib/supabase';
import { DatabaseDeal, FundingDeal } from '@/types/api';
import { DashboardTransformer } from '@/lib/transformers/dashboard';

// Mock Supabase
jest.mock('@/lib/supabase');
jest.mock('@/lib/transformers/dashboard');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockDashboardTransformer = DashboardTransformer as jest.Mocked<typeof DashboardTransformer>;

// Mock channel for real-time subscriptions
const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
};

// Mock removeChannel function
const mockRemoveChannel = jest.fn();

// Sample test data
const mockDatabaseDeal: DatabaseDeal = {
  id: 123,
  created_at: '2024-01-20T10:00:00Z',
  company_name: 'CleanTech Solutions',
  amount_raised: 15000000,
  currency: 'USD',
  funding_stage: 'Series A',
  date_announced: '2024-01-20',
  lead_investors: 'Green Capital, Climate Ventures',
  other_investors: 'Eco Fund',
  climate_sub_sector: 'Solar Energy',
  geography_country: 'United States',
  source_url: 'https://example.com/news',
  raw_text_content: 'News content...',
  status: 'verified',
  funding_amount_str: '$15M',
};

const mockTransformedDeal: FundingDeal = {
  id: 123,
  companyName: 'CleanTech Solutions',
  fundingStage: 'Series A',
  amountRaised: 15000000,
  dateAnnounced: '2024-01-20',
  leadInvestors: ['Green Capital', 'Climate Ventures'],
  otherInvestors: ['Eco Fund'],
  climateSector: 'Solar Energy',
  country: 'United States',
  status: 'verified',
  createdAt: '2024-01-20T10:00:00Z',
  formattedAmount: '$15M',
  formattedDate: 'Jan 20, 2024',
  daysAgo: 1,
  allInvestors: ['Green Capital', 'Climate Ventures', 'Eco Fund'],
};

describe('useRealTimeDeals Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockChannel.on.mockClear().mockReturnValue(mockChannel);
    mockChannel.subscribe.mockClear();
    mockChannel.unsubscribe.mockClear();
    mockRemoveChannel.mockClear();
    
    // Setup default mocks
    mockSupabase.channel = jest.fn().mockReturnValue(mockChannel);
    mockSupabase.removeChannel = mockRemoveChannel;
    
    mockDashboardTransformer.transformSingleDeal = jest.fn().mockReturnValue(mockTransformedDeal);
    
    // Mock channel methods with default successful behavior
    mockChannel.subscribe.mockImplementation((callback) => {
      // Simulate successful subscription
      setTimeout(() => callback('SUBSCRIBED'), 0);
      return mockChannel;
    });
  });

  afterEach(() => {
    // Clean up any pending timers
    jest.clearAllTimers();
    
    // Reset document visibility state
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
    });
  });

  describe('Basic Functionality', () => {
    it('should initialize with default state', async () => {
      const { result } = renderHook(() => useRealTimeDeals());

      expect(result.current.newDeals).toEqual([]);
      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionError).toBe(null);
      expect(result.current.lastUpdate).toBe(null);
      expect(result.current.newDealsCount).toBe(0);
      expect(typeof result.current.clearNewDeals).toBe('function');
      expect(typeof result.current.reconnect).toBe('function');
    });

    it('should establish real-time connection on mount', async () => {
      renderHook(() => useRealTimeDeals({ enabled: true }));

      await waitFor(() => {
        expect(mockSupabase.channel).toHaveBeenCalledWith(
          expect.stringMatching(/^deals-changes-\d+-[a-z0-9]+$/)
        );
      });

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'deals'
        },
        expect.any(Function)
      );

      expect(mockChannel.subscribe).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should not establish connection when disabled', async () => {
      renderHook(() => useRealTimeDeals({ enabled: false }));

      // Wait a bit to ensure no connection is attempted
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(mockSupabase.channel).not.toHaveBeenCalled();
    });

    it('should update connection status on successful subscription', async () => {
      const { result } = renderHook(() => useRealTimeDeals({ enabled: true }));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      expect(result.current.connectionError).toBe(null);
    });
  });

  describe('Real-time Deal Processing', () => {
    it('should process new deal insertions correctly', async () => {
      const mockOnNewDeal = jest.fn();
      
      const { result } = renderHook(() => 
        useRealTimeDeals({ 
          enabled: true, 
          onNewDeal: mockOnNewDeal 
        })
      );

      // Wait for connection
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Get the callback function passed to the channel
      const insertCallback = mockChannel.on.mock.calls[0][2];

      // Simulate new deal insertion
      act(() => {
        insertCallback({
          eventType: 'INSERT',
          new: mockDatabaseDeal,
          old: null,
          errors: null,
        });
      });

      await waitFor(() => {
        expect(result.current.newDeals).toHaveLength(1);
      });

      expect(result.current.newDeals[0]).toEqual(mockTransformedDeal);
      expect(result.current.newDealsCount).toBe(1);
      expect(result.current.lastUpdate).toBeInstanceOf(Date);
      expect(mockOnNewDeal).toHaveBeenCalledWith(mockTransformedDeal);
      expect(mockDashboardTransformer.transformSingleDeal).toHaveBeenCalledWith(mockDatabaseDeal);
    });

    it('should ignore non-INSERT events', async () => {
      const { result } = renderHook(() => useRealTimeDeals({ enabled: true }));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const insertCallback = mockChannel.on.mock.calls[0][2];

      // Simulate UPDATE event (should be ignored)
      act(() => {
        insertCallback({
          eventType: 'UPDATE',
          new: mockDatabaseDeal,
          old: mockDatabaseDeal,
          errors: null,
        });
      });

      // Wait a bit to ensure no deals are added
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(result.current.newDeals).toHaveLength(0);
    });

    it('should ignore events without new data', async () => {
      const { result } = renderHook(() => useRealTimeDeals({ enabled: true }));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const insertCallback = mockChannel.on.mock.calls[0][2];

      // Simulate INSERT event without new data
      act(() => {
        insertCallback({
          eventType: 'INSERT',
          new: null,
          old: null,
          errors: null,
        });
      });

      await waitFor(() => {
        expect(result.current.newDeals).toHaveLength(0);
      });
    });

    it('should handle multiple new deals correctly', async () => {
      const { result } = renderHook(() => 
        useRealTimeDeals({ enabled: true, maxNewDeals: 5 })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const insertCallback = mockChannel.on.mock.calls[0][2];

      // Add multiple deals
      const deals = [
        { ...mockDatabaseDeal, id: 1, company_name: 'Company 1' },
        { ...mockDatabaseDeal, id: 2, company_name: 'Company 2' },
        { ...mockDatabaseDeal, id: 3, company_name: 'Company 3' },
      ];

      deals.forEach((deal, index) => {
        mockDashboardTransformer.transformSingleDeal.mockReturnValueOnce({
          ...mockTransformedDeal,
          id: deal.id,
          companyName: deal.company_name,
        });

        act(() => {
          insertCallback({
            eventType: 'INSERT',
            new: deal,
            old: null,
            errors: null,
          });
        });
      });

      await waitFor(() => {
        expect(result.current.newDeals).toHaveLength(3);
      });

      expect(result.current.newDealsCount).toBe(3);
      expect(result.current.newDeals[0].companyName).toBe('Company 3'); // Most recent first
      expect(result.current.newDeals[1].companyName).toBe('Company 2');
      expect(result.current.newDeals[2].companyName).toBe('Company 1');
    });

    it('should limit new deals to maxNewDeals', async () => {
      const { result } = renderHook(() => 
        useRealTimeDeals({ enabled: true, maxNewDeals: 2 })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const insertCallback = mockChannel.on.mock.calls[0][2];

      // Add more deals than the limit
      for (let i = 1; i <= 4; i++) {
        const deal = { ...mockDatabaseDeal, id: i, company_name: `Company ${i}` };
        
        mockDashboardTransformer.transformSingleDeal.mockReturnValueOnce({
          ...mockTransformedDeal,
          id: deal.id,
          companyName: deal.company_name,
        });

        act(() => {
          insertCallback({
            eventType: 'INSERT',
            new: deal,
            old: null,
            errors: null,
          });
        });
      }

      await waitFor(() => {
        expect(result.current.newDeals).toHaveLength(2);
      });

      // Should keep only the most recent 2 deals
      expect(result.current.newDeals[0].companyName).toBe('Company 4');
      expect(result.current.newDeals[1].companyName).toBe('Company 3');
    });

    it('should handle transformation errors gracefully', async () => {
      const mockOnError = jest.fn();
      
      // Mock transformation to throw error
      mockDashboardTransformer.transformSingleDeal.mockImplementation(() => {
        throw new Error('Transformation failed');
      });

      const { result } = renderHook(() => 
        useRealTimeDeals({ 
          enabled: true, 
          onError: mockOnError 
        })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const insertCallback = mockChannel.on.mock.calls[0][2];

      act(() => {
        insertCallback({
          eventType: 'INSERT',
          new: mockDatabaseDeal,
          old: null,
          errors: null,
        });
      });

      await waitFor(() => {
        expect(result.current.connectionError).toContain('Failed to process new deal');
      });

      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to process new deal')
      );
      expect(result.current.newDeals).toHaveLength(0);
    });
  });

  describe('Connection Management', () => {
    it('should handle connection errors', async () => {
      const mockOnError = jest.fn();
      const mockOnConnectionChange = jest.fn();

      mockChannel.subscribe.mockImplementation((callback) => {
        setTimeout(() => callback('CHANNEL_ERROR', new Error('Connection failed')), 0);
        return mockChannel;
      });

      const { result } = renderHook(() => 
        useRealTimeDeals({ 
          enabled: true,
          onError: mockOnError,
          onConnectionChange: mockOnConnectionChange
        })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.connectionError).toContain('Real-time connection channel_error');
      });
      
      expect(mockOnError).toHaveBeenCalled();
      expect(mockOnConnectionChange).toHaveBeenCalledWith(false);
    });

    it('should attempt reconnection on connection errors', async () => {
      let subscribeCallCount = 0;
      
      mockChannel.subscribe.mockImplementation((callback) => {
        subscribeCallCount++;
        if (subscribeCallCount === 1) {
          // First attempt fails
          setTimeout(() => callback('CHANNEL_ERROR', new Error('Connection failed')), 0);
        } else {
          // Second attempt succeeds
          setTimeout(() => callback('SUBSCRIBED'), 0);
        }
        return mockChannel;
      });

      const { result } = renderHook(() => 
        useRealTimeDeals({ 
          enabled: true,
          reconnectAttempts: 2,
          reconnectDelay: 100
        })
      );

      // Initial connection fails
      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
      });

      // Wait for reconnection attempt
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      }, { timeout: 1000 });

      expect(subscribeCallCount).toBe(2);
    });

    it('should handle manual reconnection', async () => {
      const { result } = renderHook(() => useRealTimeDeals({ enabled: true }));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate connection loss
      act(() => {
        result.current.reconnect();
      });

      expect(mockRemoveChannel).toHaveBeenCalled();
      
      // Should attempt to reconnect
      await waitFor(() => {
        expect(mockSupabase.channel).toHaveBeenCalledTimes(2);
      });
    });

    it('should clean up on unmount', async () => {
      const { unmount } = renderHook(() => useRealTimeDeals({ enabled: true }));

      await waitFor(() => {
        expect(mockSupabase.channel).toHaveBeenCalled();
      });

      unmount();

      expect(mockRemoveChannel).toHaveBeenCalled();
    });

    it('should handle visibility change events', async () => {
      // Mock a connection that fails initially, then succeeds on reconnect
      let connectionAttempts = 0;
      mockChannel.subscribe.mockImplementation((callback) => {
        connectionAttempts++;
        if (connectionAttempts === 1) {
          setTimeout(() => callback('SUBSCRIBED'), 0);
        } else {
          setTimeout(() => callback('SUBSCRIBED'), 0);
        }
        return mockChannel;
      });

      const { result } = renderHook(() => useRealTimeDeals({ enabled: true }));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate connection loss by manually setting state
      act(() => {
        // Simulate going offline first
        const offlineEvent = new Event('offline');
        window.dispatchEvent(offlineEvent);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
      });

      // Simulate returning to visible while disconnected
      act(() => {
        Object.defineProperty(document, 'visibilityState', {
          value: 'visible',
          writable: true,
        });
        
        const event = new Event('visibilitychange');
        document.dispatchEvent(event);
      });

      // Should attempt reconnection when returning to visible state while disconnected
      await waitFor(() => {
        expect(mockSupabase.channel).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle online/offline events', async () => {
      const { result } = renderHook(() => useRealTimeDeals({ enabled: true }));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate going offline
      act(() => {
        const event = new Event('offline');
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        expect(result.current.connectionError).toBe('Network connection lost');
      });

      // Simulate coming back online
      act(() => {
        const event = new Event('online');
        window.dispatchEvent(event);
      });

      // Should attempt reconnection
      await waitFor(() => {
        expect(mockSupabase.channel).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Utility Functions', () => {
    it('should clear new deals correctly', async () => {
      const { result } = renderHook(() => useRealTimeDeals({ enabled: true }));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const insertCallback = mockChannel.on.mock.calls[0][2];

      // Add a new deal
      act(() => {
        insertCallback({
          eventType: 'INSERT',
          new: mockDatabaseDeal,
          old: null,
          errors: null,
        });
      });

      await waitFor(() => {
        expect(result.current.newDeals).toHaveLength(1);
      });

      // Clear new deals
      act(() => {
        result.current.clearNewDeals();
      });

      expect(result.current.newDeals).toHaveLength(0);
      expect(result.current.newDealsCount).toBe(0);
    });

    it('should handle callback functions correctly', async () => {
      const mockOnNewDeal = jest.fn();
      const mockOnConnectionChange = jest.fn();
      const mockOnError = jest.fn();

      renderHook(() => 
        useRealTimeDeals({
          enabled: true,
          onNewDeal: mockOnNewDeal,
          onConnectionChange: mockOnConnectionChange,
          onError: mockOnError,
        })
      );

      await waitFor(() => {
        expect(mockOnConnectionChange).toHaveBeenCalledWith(true);
      });

      const insertCallback = mockChannel.on.mock.calls[0][2];

      // Trigger new deal
      act(() => {
        insertCallback({
          eventType: 'INSERT',
          new: mockDatabaseDeal,
          old: null,
          errors: null,
        });
      });

      await waitFor(() => {
        expect(mockOnNewDeal).toHaveBeenCalledWith(mockTransformedDeal);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing Supabase client gracefully', async () => {
      // Mock missing Supabase client
      const originalChannel = mockSupabase.channel;
      mockSupabase.channel = undefined as any;

      const { result } = renderHook(() => useRealTimeDeals({ enabled: true }));

      await waitFor(() => {
        expect(result.current.connectionError).toContain('Failed to setup real-time subscription');
      });

      // Restore original mock
      mockSupabase.channel = originalChannel;
    });

    it('should handle rapid connection state changes', async () => {
      let callbackCount = 0;
      
      mockChannel.subscribe.mockImplementation((callback) => {
        callbackCount++;
        // Rapidly change states
        setTimeout(() => callback('SUBSCRIBED'), 0);
        setTimeout(() => callback('CHANNEL_ERROR', new Error('Error')), 10);
        setTimeout(() => callback('SUBSCRIBED'), 20);
        return mockChannel;
      });

      const { result } = renderHook(() => useRealTimeDeals({ enabled: true }));

      // Should eventually stabilize to connected state
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      }, { timeout: 1000 });
    });

    it('should handle component unmounting during async operations', async () => {
      const { unmount } = renderHook(() => useRealTimeDeals({ enabled: true }));

      // Wait for initial setup to start
      await new Promise(resolve => setTimeout(resolve, 150));

      // Unmount after setup has started
      unmount();

      // Should not throw errors or cause memory leaks
      expect(mockRemoveChannel).toHaveBeenCalled();
    });

    it('should handle malformed real-time payloads', async () => {
      const mockOnError = jest.fn();
      
      // Mock transformation to throw error for malformed data
      mockDashboardTransformer.transformSingleDeal.mockImplementation((deal) => {
        if (deal.invalid) {
          throw new Error('Invalid deal data structure');
        }
        return mockTransformedDeal;
      });
      
      const { result } = renderHook(() => 
        useRealTimeDeals({ 
          enabled: true, 
          onError: mockOnError 
        })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const insertCallback = mockChannel.on.mock.calls[0][2];

      // Send malformed payload
      act(() => {
        insertCallback({
          eventType: 'INSERT',
          new: { invalid: 'data' }, // Missing required fields
          old: null,
          errors: null,
        });
      });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalled();
      });

      expect(result.current.newDeals).toHaveLength(0);
    });
  });
});