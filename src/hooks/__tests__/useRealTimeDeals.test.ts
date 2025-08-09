import { renderHook, act, waitFor } from '@testing-library/react';
import { useRealTimeDeals, useRealTimeNotifications } from '../useRealTimeDeals';
import { supabase } from '../../lib/supabase';
import { DashboardTransformer } from '../../lib/transformers/dashboard';
import { DatabaseDeal, FundingDeal } from '../../types/api';

// Mock dependencies
jest.mock('../../lib/supabase', () => ({
  supabase: {
    channel: jest.fn(),
    removeChannel: jest.fn(),
  },
}));

jest.mock('../../lib/transformers/dashboard', () => ({
  DashboardTransformer: {
    transformSingleDeal: jest.fn(),
  },
}));

// Mock RealtimeChannel
const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
};

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockTransformer = DashboardTransformer as jest.Mocked<typeof DashboardTransformer>;

describe('useRealTimeDeals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.channel.mockReturnValue(mockChannel as any);
    // Ensure we start with real timers
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useRealTimeDeals());

    expect(result.current.newDeals).toEqual([]);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.connectionError).toBe(null);
    expect(result.current.lastUpdate).toBe(null);
    expect(result.current.newDealsCount).toBe(0);
  });

  it('should setup subscription when enabled', async () => {
    renderHook(() => useRealTimeDeals({ enabled: true }));

    // Wait for the subscription setup timeout
    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalled();
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

  it('should not setup subscription when disabled', () => {
    renderHook(() => useRealTimeDeals({ enabled: false }));

    expect(mockSupabase.channel).not.toHaveBeenCalled();
  });

  it('should handle new deal insertion', async () => {
    const mockDeal: DatabaseDeal = {
      id: 1,
      created_at: '2024-01-01T00:00:00Z',
      company_name: 'Test Company',
      amount_raised: 1000000,
      currency: 'USD',
      funding_stage: 'Series A',
      date_announced: '2024-01-01',
      lead_investors: 'Test VC',
      other_investors: null,
      climate_sub_sector: 'Clean Energy',
      geography_country: 'USA',
      source_url: null,
      raw_text_content: null,
      status: 'NEW',
      funding_amount_str: '$1M',
    };

    const mockTransformedDeal: FundingDeal = {
      id: 1,
      companyName: 'Test Company',
      fundingStage: 'Series A',
      amountRaised: 1000000,
      dateAnnounced: '2024-01-01',
      leadInvestors: ['Test VC'],
      otherInvestors: [],
      climateSector: 'Clean Energy',
      country: 'USA',
      status: 'NEW',
      createdAt: '2024-01-01T00:00:00Z',
      formattedAmount: '$1M',
      formattedDate: 'Jan 1, 2024',
      daysAgo: 1,
      allInvestors: ['Test VC'],
    };

    mockTransformer.transformSingleDeal.mockReturnValue(mockTransformedDeal);

    let subscribeCallback: (status: string, error?: Error) => void;
    let changeHandler: (payload: any) => void;

    mockChannel.on.mockImplementation((event, config, handler) => {
      changeHandler = handler;
      return mockChannel;
    });

    mockChannel.subscribe.mockImplementation((callback) => {
      subscribeCallback = callback;
      return mockChannel;
    });

    const { result } = renderHook(() => useRealTimeDeals({ enabled: true }));

    // Wait for subscription setup
    await waitFor(() => {
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    // Simulate successful subscription
    act(() => {
      if (subscribeCallback) {
        subscribeCallback('SUBSCRIBED');
      }
    });

    expect(result.current.isConnected).toBe(true);

    // Simulate new deal insertion
    act(() => {
      if (changeHandler) {
        changeHandler({
          eventType: 'INSERT',
          new: mockDeal,
          old: null,
          errors: null,
        });
      }
    });

    await waitFor(() => {
      expect(result.current.newDeals).toHaveLength(1);
      expect(result.current.newDeals[0]).toEqual(mockTransformedDeal);
      expect(result.current.newDealsCount).toBe(1);
      expect(result.current.lastUpdate).toBeInstanceOf(Date);
    });

    expect(mockTransformer.transformSingleDeal).toHaveBeenCalledWith(mockDeal);
  });

  it('should handle connection errors', async () => {
    let subscribeCallback: (status: string, error?: Error) => void;

    mockChannel.subscribe.mockImplementation((callback) => {
      subscribeCallback = callback;
      return mockChannel;
    });

    const { result } = renderHook(() => useRealTimeDeals({ enabled: true }));

    // Wait for subscription setup
    await waitFor(() => {
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    const testError = new Error('Connection failed');

    act(() => {
      if (subscribeCallback) {
        subscribeCallback('CHANNEL_ERROR', testError);
      }
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionError).toContain('Connection failed');
    });
  });

  it('should clear new deals when clearNewDeals is called', async () => {
    const mockDeal: DatabaseDeal = {
      id: 1,
      created_at: '2024-01-01T00:00:00Z',
      company_name: 'Test Company',
      amount_raised: 1000000,
      currency: 'USD',
      funding_stage: 'Series A',
      date_announced: '2024-01-01',
      lead_investors: 'Test VC',
      other_investors: null,
      climate_sub_sector: 'Clean Energy',
      geography_country: 'USA',
      source_url: null,
      raw_text_content: null,
      status: 'NEW',
      funding_amount_str: '$1M',
    };

    const mockTransformedDeal: FundingDeal = {
      id: 1,
      companyName: 'Test Company',
      fundingStage: 'Series A',
      amountRaised: 1000000,
      dateAnnounced: '2024-01-01',
      leadInvestors: ['Test VC'],
      otherInvestors: [],
      climateSector: 'Clean Energy',
      country: 'USA',
      status: 'NEW',
      createdAt: '2024-01-01T00:00:00Z',
      formattedAmount: '$1M',
      formattedDate: 'Jan 1, 2024',
      daysAgo: 1,
      allInvestors: ['Test VC'],
    };

    mockTransformer.transformSingleDeal.mockReturnValue(mockTransformedDeal);

    let subscribeCallback: (status: string, error?: Error) => void;
    let changeHandler: (payload: any) => void;

    mockChannel.on.mockImplementation((event, config, handler) => {
      changeHandler = handler;
      return mockChannel;
    });

    mockChannel.subscribe.mockImplementation((callback) => {
      subscribeCallback = callback;
      return mockChannel;
    });

    const { result } = renderHook(() => useRealTimeDeals({ enabled: true }));

    // Wait for subscription setup
    await waitFor(() => {
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    // Setup connection and add a deal
    act(() => {
      if (subscribeCallback) {
        subscribeCallback('SUBSCRIBED');
      }
    });

    act(() => {
      if (changeHandler) {
        changeHandler({
          eventType: 'INSERT',
          new: mockDeal,
          old: null,
          errors: null,
        });
      }
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

  it('should limit the number of new deals stored', async () => {
    const maxNewDeals = 3;
    
    mockTransformer.transformSingleDeal.mockImplementation((deal) => ({
      id: deal.id,
      companyName: deal.company_name || 'Test Company',
      fundingStage: 'Series A',
      amountRaised: 1000000,
      dateAnnounced: '2024-01-01',
      leadInvestors: ['Test VC'],
      otherInvestors: [],
      climateSector: 'Clean Energy',
      country: 'USA',
      status: 'NEW',
      createdAt: deal.created_at,
      formattedAmount: '$1M',
      formattedDate: 'Jan 1, 2024',
      daysAgo: 1,
      allInvestors: ['Test VC'],
    }));

    let subscribeCallback: (status: string, error?: Error) => void;
    let changeHandler: (payload: any) => void;

    mockChannel.on.mockImplementation((event, config, handler) => {
      changeHandler = handler;
      return mockChannel;
    });

    mockChannel.subscribe.mockImplementation((callback) => {
      subscribeCallback = callback;
      return mockChannel;
    });

    const { result } = renderHook(() => 
      useRealTimeDeals({ enabled: true, maxNewDeals })
    );

    // Wait for subscription setup
    await waitFor(() => {
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    act(() => {
      if (subscribeCallback) {
        subscribeCallback('SUBSCRIBED');
      }
    });

    // Add more deals than the limit
    for (let i = 1; i <= 5; i++) {
      act(() => {
        if (changeHandler) {
          changeHandler({
          eventType: 'INSERT',
          new: {
            id: i,
            created_at: '2024-01-01T00:00:00Z',
            company_name: `Company ${i}`,
            amount_raised: 1000000,
            currency: 'USD',
            funding_stage: 'Series A',
            date_announced: '2024-01-01',
            lead_investors: 'Test VC',
            other_investors: null,
            climate_sub_sector: 'Clean Energy',
            geography_country: 'USA',
            source_url: null,
            raw_text_content: null,
            status: 'NEW',
            funding_amount_str: '$1M',
          },
          old: null,
          errors: null,
        });
        }
      });
    }

    await waitFor(() => {
      expect(result.current.newDeals).toHaveLength(maxNewDeals);
      expect(result.current.newDealsCount).toBe(maxNewDeals);
      // Should keep the most recent deals (highest IDs)
      expect(result.current.newDeals[0].id).toBe(5);
      expect(result.current.newDeals[1].id).toBe(4);
      expect(result.current.newDeals[2].id).toBe(3);
    });
  });

  it('should cleanup subscription on unmount', async () => {
    const { unmount } = renderHook(() => useRealTimeDeals({ enabled: true }));

    // Wait for subscription setup
    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalled();
    });

    unmount();

    expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });

  it('should call onNewDeal callback when new deal is received', async () => {
    const onNewDeal = jest.fn();
    const mockDeal: DatabaseDeal = {
      id: 1,
      created_at: '2024-01-01T00:00:00Z',
      company_name: 'Test Company',
      amount_raised: 1000000,
      currency: 'USD',
      funding_stage: 'Series A',
      date_announced: '2024-01-01',
      lead_investors: 'Test VC',
      other_investors: null,
      climate_sub_sector: 'Clean Energy',
      geography_country: 'USA',
      source_url: null,
      raw_text_content: null,
      status: 'NEW',
      funding_amount_str: '$1M',
    };

    const mockTransformedDeal: FundingDeal = {
      id: 1,
      companyName: 'Test Company',
      fundingStage: 'Series A',
      amountRaised: 1000000,
      dateAnnounced: '2024-01-01',
      leadInvestors: ['Test VC'],
      otherInvestors: [],
      climateSector: 'Clean Energy',
      country: 'USA',
      status: 'NEW',
      createdAt: '2024-01-01T00:00:00Z',
      formattedAmount: '$1M',
      formattedDate: 'Jan 1, 2024',
      daysAgo: 1,
      allInvestors: ['Test VC'],
    };

    mockTransformer.transformSingleDeal.mockReturnValue(mockTransformedDeal);

    let subscribeCallback: (status: string, error?: Error) => void;
    let changeHandler: (payload: any) => void;

    mockChannel.on.mockImplementation((event, config, handler) => {
      changeHandler = handler;
      return mockChannel;
    });

    mockChannel.subscribe.mockImplementation((callback) => {
      subscribeCallback = callback;
      return mockChannel;
    });

    renderHook(() => useRealTimeDeals({ enabled: true, onNewDeal }));

    // Wait for subscription setup
    await waitFor(() => {
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    act(() => {
      if (subscribeCallback) {
        subscribeCallback('SUBSCRIBED');
      }
    });

    act(() => {
      if (changeHandler) {
        changeHandler({
          eventType: 'INSERT',
          new: mockDeal,
          old: null,
          errors: null,
        });
      }
    });

    await waitFor(() => {
      expect(onNewDeal).toHaveBeenCalledWith(mockTransformedDeal);
    });
  });

  it('should handle transformation errors gracefully', async () => {
    const onError = jest.fn();
    const mockDeal: DatabaseDeal = {
      id: 1,
      created_at: '2024-01-01T00:00:00Z',
      company_name: 'Test Company',
      amount_raised: 1000000,
      currency: 'USD',
      funding_stage: 'Series A',
      date_announced: '2024-01-01',
      lead_investors: 'Test VC',
      other_investors: null,
      climate_sub_sector: 'Clean Energy',
      geography_country: 'USA',
      source_url: null,
      raw_text_content: null,
      status: 'NEW',
      funding_amount_str: '$1M',
    };

    // Mock transformer to throw an error
    mockTransformer.transformSingleDeal.mockImplementation(() => {
      throw new Error('Transformation failed');
    });

    let subscribeCallback: (status: string, error?: Error) => void;
    let changeHandler: (payload: any) => void;

    mockChannel.on.mockImplementation((event, config, handler) => {
      changeHandler = handler;
      return mockChannel;
    });

    mockChannel.subscribe.mockImplementation((callback) => {
      subscribeCallback = callback;
      return mockChannel;
    });

    const { result } = renderHook(() => useRealTimeDeals({ enabled: true, onError }));

    // Wait for subscription setup
    await waitFor(() => {
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    act(() => {
      if (subscribeCallback) {
        subscribeCallback('SUBSCRIBED');
      }
    });

    act(() => {
      if (changeHandler) {
        changeHandler({
          eventType: 'INSERT',
          new: mockDeal,
          old: null,
          errors: null,
        });
      }
    });

    await waitFor(() => {
      expect(result.current.connectionError).toContain('Failed to process new deal: Transformation failed');
      expect(onError).toHaveBeenCalledWith('Failed to process new deal: Transformation failed');
    });
  });

  it('should ignore non-INSERT events', async () => {
    const mockDeal: DatabaseDeal = {
      id: 1,
      created_at: '2024-01-01T00:00:00Z',
      company_name: 'Test Company',
      amount_raised: 1000000,
      currency: 'USD',
      funding_stage: 'Series A',
      date_announced: '2024-01-01',
      lead_investors: 'Test VC',
      other_investors: null,
      climate_sub_sector: 'Clean Energy',
      geography_country: 'USA',
      source_url: null,
      raw_text_content: null,
      status: 'NEW',
      funding_amount_str: '$1M',
    };

    let subscribeCallback: (status: string, error?: Error) => void;
    let changeHandler: (payload: any) => void;

    mockChannel.on.mockImplementation((event, config, handler) => {
      changeHandler = handler;
      return mockChannel;
    });

    mockChannel.subscribe.mockImplementation((callback) => {
      subscribeCallback = callback;
      return mockChannel;
    });

    const { result } = renderHook(() => useRealTimeDeals({ enabled: true }));

    // Wait for subscription setup
    await waitFor(() => {
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    act(() => {
      if (subscribeCallback) {
        subscribeCallback('SUBSCRIBED');
      }
    });

    // Simulate UPDATE event (should be ignored)
    act(() => {
      if (changeHandler) {
        changeHandler({
          eventType: 'UPDATE',
          new: mockDeal,
          old: mockDeal,
          errors: null,
        });
      }
    });

    // Should not add any new deals
    expect(result.current.newDeals).toHaveLength(0);
    expect(mockTransformer.transformSingleDeal).not.toHaveBeenCalled();
  });

  it('should ignore events with no new data', async () => {
    let subscribeCallback: (status: string, error?: Error) => void;
    let changeHandler: (payload: any) => void;

    mockChannel.on.mockImplementation((event, config, handler) => {
      changeHandler = handler;
      return mockChannel;
    });

    mockChannel.subscribe.mockImplementation((callback) => {
      subscribeCallback = callback;
      return mockChannel;
    });

    const { result } = renderHook(() => useRealTimeDeals({ enabled: true }));

    // Wait for subscription setup
    await waitFor(() => {
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    act(() => {
      if (subscribeCallback) {
        subscribeCallback('SUBSCRIBED');
      }
    });

    // Simulate INSERT event with no new data
    act(() => {
      if (changeHandler) {
        changeHandler({
          eventType: 'INSERT',
          new: null,
          old: null,
          errors: null,
        });
      }
    });

    // Should not add any new deals
    expect(result.current.newDeals).toHaveLength(0);
    expect(mockTransformer.transformSingleDeal).not.toHaveBeenCalled();
  });

  it('should call onConnectionChange callback', async () => {
    const onConnectionChange = jest.fn();
    let subscribeCallback: (status: string, error?: Error) => void;

    mockChannel.subscribe.mockImplementation((callback) => {
      subscribeCallback = callback;
      return mockChannel;
    });

    renderHook(() => useRealTimeDeals({ enabled: true, onConnectionChange }));

    // Wait for subscription setup
    await waitFor(() => {
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    act(() => {
      if (subscribeCallback) {
        subscribeCallback('SUBSCRIBED');
      }
    });

    expect(onConnectionChange).toHaveBeenCalledWith(true);

    act(() => {
      if (subscribeCallback) {
        subscribeCallback('CHANNEL_ERROR', new Error('Connection lost'));
      }
    });

    expect(onConnectionChange).toHaveBeenCalledWith(false);
  });

  it('should handle reconnect function', async () => {
    let subscribeCallback: (status: string, error?: Error) => void;

    mockChannel.subscribe.mockImplementation((callback) => {
      subscribeCallback = callback;
      return mockChannel;
    });

    const { result } = renderHook(() => useRealTimeDeals({ enabled: true }));

    // Wait for subscription setup
    await waitFor(() => {
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    // Simulate connection
    act(() => {
      if (subscribeCallback) {
        subscribeCallback('SUBSCRIBED');
      }
    });

    expect(result.current.isConnected).toBe(true);

    // Simulate connection error
    act(() => {
      if (subscribeCallback) {
        subscribeCallback('CHANNEL_ERROR', new Error('Connection lost'));
      }
    });

    expect(result.current.isConnected).toBe(false);

    // Manual reconnect
    act(() => {
      result.current.reconnect();
    });

    // Should attempt to create new subscription
    await waitFor(() => {
      expect(mockSupabase.removeChannel).toHaveBeenCalled();
    });
  });

  it('should handle subscription setup with delay', async () => {
    jest.useFakeTimers();
    
    const { result } = renderHook(() => useRealTimeDeals({ enabled: true }));

    // Initially not connected
    expect(result.current.isConnected).toBe(false);

    // Fast-forward the setup delay
    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalled();
    });

    jest.useRealTimers();
  });

  it('should handle reconnection attempts with exponential backoff', async () => {
    jest.useFakeTimers();
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    
    let subscribeCallback: (status: string, error?: Error) => void;

    mockChannel.subscribe.mockImplementation((callback) => {
      subscribeCallback = callback;
      return mockChannel;
    });

    renderHook(() => useRealTimeDeals({ 
      enabled: true, 
      reconnectAttempts: 2,
      reconnectDelay: 1000 
    }));

    // Wait for initial subscription setup
    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    // Clear previous setTimeout calls
    setTimeoutSpy.mockClear();

    // Simulate connection error that triggers reconnection
    act(() => {
      if (subscribeCallback) {
        subscribeCallback('CHANNEL_ERROR', new Error('Connection failed'));
      }
    });

    // Should schedule a reconnection with exponential backoff (1000 * 2^(1-1) = 1000 for first attempt)
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000);

    // Fast-forward to trigger reconnection
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should attempt to create new subscription
    await waitFor(() => {
      expect(mockSupabase.removeChannel).toHaveBeenCalled();
    });

    setTimeoutSpy.mockRestore();
    jest.useRealTimers();
  });

  it('should handle browser visibility changes', async () => {
    // Mock document.visibilityState
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      value: 'visible',
    });

    let subscribeCallback: (status: string, error?: Error) => void;

    mockChannel.subscribe.mockImplementation((callback) => {
      subscribeCallback = callback;
      return mockChannel;
    });

    const { result } = renderHook(() => useRealTimeDeals({ enabled: true }));

    // Wait for subscription setup
    await waitFor(() => {
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    // Simulate disconnection
    act(() => {
      if (subscribeCallback) {
        subscribeCallback('CHANNEL_ERROR', new Error('Connection lost'));
      }
    });

    expect(result.current.isConnected).toBe(false);

    // Clear previous calls
    mockSupabase.channel.mockClear();

    // Simulate visibility change to visible (should trigger reconnect)
    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Should attempt to reconnect after a delay
    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('should handle online/offline events', async () => {
    let subscribeCallback: (status: string, error?: Error) => void;

    mockChannel.subscribe.mockImplementation((callback) => {
      subscribeCallback = callback;
      return mockChannel;
    });

    const { result } = renderHook(() => useRealTimeDeals({ enabled: true }));

    // Wait for subscription setup
    await waitFor(() => {
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    // Simulate connection
    act(() => {
      if (subscribeCallback) {
        subscribeCallback('SUBSCRIBED');
      }
    });

    expect(result.current.isConnected).toBe(true);

    // Simulate going offline
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.connectionError).toBe('Network connection lost');

    // Clear previous calls
    mockSupabase.channel.mockClear();

    // Simulate coming back online (should trigger reconnect)
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    // Should attempt to reconnect after a delay
    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('should not reconnect when component is unmounted', async () => {
    let subscribeCallback: (status: string, error?: Error) => void;

    mockChannel.subscribe.mockImplementation((callback) => {
      subscribeCallback = callback;
      return mockChannel;
    });

    const { result, unmount } = renderHook(() => useRealTimeDeals({ enabled: true }));

    // Wait for subscription setup
    await waitFor(() => {
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    // Unmount the component
    unmount();

    // Clear previous calls
    mockSupabase.channel.mockClear();

    // Try to reconnect after unmounting
    act(() => {
      result.current.reconnect();
    });

    // Should not attempt to create new subscription
    expect(mockSupabase.channel).not.toHaveBeenCalled();
  });

  it('should cleanup when disabled', async () => {
    const { rerender } = renderHook(
      ({ enabled }) => useRealTimeDeals({ enabled }),
      { initialProps: { enabled: true } }
    );

    // Wait for subscription setup
    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalled();
    });

    // Clear previous calls
    mockSupabase.removeChannel.mockClear();

    // Disable the hook
    rerender({ enabled: false });

    // Should cleanup the subscription
    expect(mockSupabase.removeChannel).toHaveBeenCalled();
  });
});

describe('useRealTimeNotifications', () => {
  it('should initialize with empty notifications', () => {
    const { result } = renderHook(() => useRealTimeNotifications());

    expect(result.current.notifications).toEqual([]);
  });

  it('should add notifications', () => {
    const { result } = renderHook(() => useRealTimeNotifications());

    act(() => {
      result.current.addNotification('Test message', 'info');
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toMatchObject({
      message: 'Test message',
      type: 'info',
    });
    expect(result.current.notifications[0].id).toBeDefined();
    expect(result.current.notifications[0].timestamp).toBeInstanceOf(Date);
  });

  it('should add notifications with default type', () => {
    const { result } = renderHook(() => useRealTimeNotifications());

    act(() => {
      result.current.addNotification('Test message');
    });

    expect(result.current.notifications[0].type).toBe('info');
  });

  it('should remove notifications by id', () => {
    const { result } = renderHook(() => useRealTimeNotifications());

    act(() => {
      result.current.addNotification('Test message 1', 'info');
      result.current.addNotification('Test message 2', 'error');
    });

    expect(result.current.notifications).toHaveLength(2);

    const firstNotificationId = result.current.notifications[1].id;

    act(() => {
      result.current.removeNotification(firstNotificationId);
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].message).toBe('Test message 2');
  });

  it('should clear all notifications', () => {
    const { result } = renderHook(() => useRealTimeNotifications());

    act(() => {
      result.current.addNotification('Test message 1', 'info');
      result.current.addNotification('Test message 2', 'error');
    });

    expect(result.current.notifications).toHaveLength(2);

    act(() => {
      result.current.clearNotifications();
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('should limit notifications to 10', () => {
    const { result } = renderHook(() => useRealTimeNotifications());

    // Add 12 notifications
    act(() => {
      for (let i = 1; i <= 12; i++) {
        result.current.addNotification(`Test message ${i}`, 'info');
      }
    });

    // Should only keep the last 10
    expect(result.current.notifications).toHaveLength(10);
    expect(result.current.notifications[0].message).toBe('Test message 12');
    expect(result.current.notifications[9].message).toBe('Test message 3');
  });
});