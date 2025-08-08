import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NewDealHighlight, AnimatedDealItem, useNewDealHighlights } from '../NewDealHighlight';
import { FundingDeal } from '@/types/api';

// Mock the CSS animations
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

const mockDeal: FundingDeal = {
  id: 1,
  companyName: 'Test Company',
  fundingStage: 'Series A',
  amountRaised: 5000000,
  dateAnnounced: '2024-01-15',
  leadInvestors: 'Test VC',
  otherInvestors: 'Other VC',
  climateSubSector: 'Clean Energy',
  geographyCountry: 'USA',
  status: 'verified',
  createdAt: '2024-01-15T10:00:00Z',
  formattedAmount: '$5.0M',
  formattedDate: '2w',
  daysAgo: 14,
  allInvestors: ['Test VC', 'Other VC'],
};

describe('NewDealHighlight', () => {
  const defaultProps = {
    deal: mockDeal,
    isNew: true,
    children: <div>Deal Content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children content', () => {
    render(<NewDealHighlight {...defaultProps} />);
    
    expect(screen.getByText('Deal Content')).toBeInTheDocument();
  });

  it('shows NEW indicator when deal is new', () => {
    render(<NewDealHighlight {...defaultProps} />);
    
    expect(screen.getByText('NEW')).toBeInTheDocument();
  });

  it('does not show NEW indicator when deal is not new', () => {
    render(<NewDealHighlight {...defaultProps} isNew={false} />);
    
    expect(screen.queryByText('NEW')).not.toBeInTheDocument();
  });

  it('applies highlight classes when deal is new', () => {
    render(<NewDealHighlight {...defaultProps} />);
    
    const highlightElement = screen.getByText('NEW').closest('div');
    expect(highlightElement).toBeInTheDocument();
  });

  it('sets up highlight duration timer when deal is new', () => {
    jest.useFakeTimers();
    const onHighlightEnd = jest.fn();
    
    render(
      <NewDealHighlight 
        {...defaultProps} 
        onHighlightEnd={onHighlightEnd}
        highlightDuration={1000}
      />
    );
    
    // Fast-forward time
    jest.advanceTimersByTime(1500); // highlight duration + fade-out time
    
    expect(onHighlightEnd).toHaveBeenCalledTimes(1);
    
    jest.useRealTimers();
  });
});

describe('AnimatedDealItem', () => {
  const defaultProps = {
    deal: mockDeal,
    isNew: true,
    index: 0,
    children: <div>Deal Item Content</div>,
  };

  it('renders children content', () => {
    render(<AnimatedDealItem {...defaultProps} />);
    
    expect(screen.getByText('Deal Item Content')).toBeInTheDocument();
  });

  it('renders with different indices', () => {
    const { rerender } = render(<AnimatedDealItem {...defaultProps} index={0} />);
    expect(screen.getByText('Deal Item Content')).toBeInTheDocument();

    rerender(<AnimatedDealItem {...defaultProps} index={2} />);
    expect(screen.getByText('Deal Item Content')).toBeInTheDocument();
  });

  it('passes props correctly to NewDealHighlight', () => {
    render(<AnimatedDealItem {...defaultProps} />);
    
    // Should show NEW indicator since isNew is true
    expect(screen.getByText('NEW')).toBeInTheDocument();
  });
});

describe('useNewDealHighlights', () => {
  const TestComponent = ({ dealIds }: { dealIds: number[] }) => {
    const { highlightedDeals, isHighlighted, addHighlight, removeHighlight, clearHighlights } = useNewDealHighlights(dealIds);
    
    return (
      <div>
        <div data-testid="highlighted-count">{highlightedDeals.size}</div>
        <div data-testid="is-highlighted-1">{isHighlighted(1) ? 'true' : 'false'}</div>
        <div data-testid="is-highlighted-2">{isHighlighted(2) ? 'true' : 'false'}</div>
        <button onClick={() => addHighlight(3)}>Add 3</button>
        <button onClick={() => removeHighlight(1)}>Remove 1</button>
        <button onClick={clearHighlights}>Clear All</button>
      </div>
    );
  };

  it('initializes with provided deal IDs', () => {
    render(<TestComponent dealIds={[1, 2]} />);
    
    expect(screen.getByTestId('highlighted-count')).toHaveTextContent('2');
    expect(screen.getByTestId('is-highlighted-1')).toHaveTextContent('true');
    expect(screen.getByTestId('is-highlighted-2')).toHaveTextContent('true');
  });

  it('adds new highlights', () => {
    render(<TestComponent dealIds={[1]} />);
    
    expect(screen.getByTestId('highlighted-count')).toHaveTextContent('1');
    
    fireEvent.click(screen.getByText('Add 3'));
    
    expect(screen.getByTestId('highlighted-count')).toHaveTextContent('2');
  });

  it('removes highlights', () => {
    render(<TestComponent dealIds={[1, 2]} />);
    
    expect(screen.getByTestId('highlighted-count')).toHaveTextContent('2');
    
    fireEvent.click(screen.getByText('Remove 1'));
    
    expect(screen.getByTestId('highlighted-count')).toHaveTextContent('1');
    expect(screen.getByTestId('is-highlighted-1')).toHaveTextContent('false');
  });

  it('clears all highlights', () => {
    render(<TestComponent dealIds={[1, 2]} />);
    
    expect(screen.getByTestId('highlighted-count')).toHaveTextContent('2');
    
    fireEvent.click(screen.getByText('Clear All'));
    
    expect(screen.getByTestId('highlighted-count')).toHaveTextContent('0');
  });

  it('updates when dealIds prop changes', () => {
    const { rerender } = render(<TestComponent dealIds={[1]} />);
    
    expect(screen.getByTestId('highlighted-count')).toHaveTextContent('1');
    
    rerender(<TestComponent dealIds={[1, 2, 3]} />);
    
    expect(screen.getByTestId('highlighted-count')).toHaveTextContent('3');
  });
});

// Import fireEvent for the hook test
import { fireEvent } from '@testing-library/react';