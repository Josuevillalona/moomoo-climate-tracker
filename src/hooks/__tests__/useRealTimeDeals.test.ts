import { renderHook, act, waitFor } from '@testing-library/react';
import { useRealTimeDeals } from '../useRealTimeDeals';
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
};

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockTransformer = DashboardTransformer as jest.Mocked<typeof DashboardTransformer>;

describe('useRealTimeDeals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.channel.mockReturnValue(mockChannel as any);
  });

  afterEach(() => {
    jest.clearAllTimers();
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
});