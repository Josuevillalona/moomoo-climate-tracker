import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NewDealsNotification, CompactNewDealsIndicator, NewDealsBadge } from '../NewDealsNotification';

// Mock the CSS animations
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

describe('NewDealsNotification', () => {
  const defaultProps = {
    newDealsCount: 3,
    isVisible: true,
    onDismiss: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders notification with correct count', () => {
    render(<NewDealsNotification {...defaultProps} />);
    
    expect(screen.getByText('3 new deals added')).toBeInTheDocument();
    expect(screen.getByText('Just now')).toBeInTheDocument();
  });

  it('renders singular form for single deal', () => {
    render(<NewDealsNotification {...defaultProps} newDealsCount={1} />);
    
    expect(screen.getByText('1 new deal added')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    render(<NewDealsNotification {...defaultProps} isVisible={false} />);
    
    expect(screen.queryByText('3 new deals added')).not.toBeInTheDocument();
  });

  it('calls onDismiss when close button is clicked', () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    render(<NewDealsNotification {...defaultProps} onDismiss={onDismiss} />);
    
    const closeButton = screen.getByLabelText('Dismiss notification');
    fireEvent.click(closeButton);
    
    // Fast-forward through the animation
    jest.advanceTimersByTime(300);
    
    expect(onDismiss).toHaveBeenCalledTimes(1);
    
    jest.useRealTimers();
  });

  it('calls onViewDeals when view button is clicked', () => {
    const onViewDeals = jest.fn();
    render(<NewDealsNotification {...defaultProps} onViewDeals={onViewDeals} />);
    
    const viewButton = screen.getByText('View');
    fireEvent.click(viewButton);
    
    expect(onViewDeals).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after specified duration', () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    render(
      <NewDealsNotification 
        {...defaultProps} 
        onDismiss={onDismiss}
        autoHideDuration={1000}
      />
    );
    
    // Fast-forward through auto-hide duration + animation
    jest.advanceTimersByTime(1300);
    
    expect(onDismiss).toHaveBeenCalledTimes(1);
    
    jest.useRealTimers();
  });

  it('does not auto-dismiss when duration is 0', async () => {
    const onDismiss = jest.fn();
    render(
      <NewDealsNotification 
        {...defaultProps} 
        onDismiss={onDismiss}
        autoHideDuration={0}
      />
    );
    
    // Wait a bit to ensure it doesn't auto-dismiss
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(onDismiss).not.toHaveBeenCalled();
  });
});

describe('CompactNewDealsIndicator', () => {
  const defaultProps = {
    newDealsCount: 5,
    isVisible: true,
    onClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with correct count', () => {
    render(<CompactNewDealsIndicator {...defaultProps} />);
    
    expect(screen.getByText('5 new')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    render(<CompactNewDealsIndicator {...defaultProps} isVisible={false} />);
    
    expect(screen.queryByText('5 new')).not.toBeInTheDocument();
  });

  it('does not render when count is 0', () => {
    render(<CompactNewDealsIndicator {...defaultProps} newDealsCount={0} />);
    
    expect(screen.queryByText('0 new')).not.toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<CompactNewDealsIndicator {...defaultProps} onClick={onClick} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('NewDealsBadge', () => {
  const defaultProps = {
    count: 7,
    isVisible: true,
  };

  it('renders with correct count', () => {
    render(<NewDealsBadge {...defaultProps} />);
    
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('renders 99+ for counts over 99', () => {
    render(<NewDealsBadge {...defaultProps} count={150} />);
    
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    render(<NewDealsBadge {...defaultProps} isVisible={false} />);
    
    expect(screen.queryByText('7')).not.toBeInTheDocument();
  });

  it('does not render when count is 0', () => {
    render(<NewDealsBadge {...defaultProps} count={0} />);
    
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { rerender } = render(<NewDealsBadge {...defaultProps} size="sm" />);
    let badge = screen.getByText('7');
    expect(badge).toHaveClass('w-4', 'h-4', 'text-xs');

    rerender(<NewDealsBadge {...defaultProps} size="md" />);
    badge = screen.getByText('7');
    expect(badge).toHaveClass('w-5', 'h-5', 'text-xs');

    rerender(<NewDealsBadge {...defaultProps} size="lg" />);
    badge = screen.getByText('7');
    expect(badge).toHaveClass('w-6', 'h-6', 'text-sm');
  });
});