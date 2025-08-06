import { render, screen } from '@testing-library/react';
import DashboardSkeleton from '../DashboardSkeleton';

// Mock the lucide-react icons
jest.mock('lucide-react', () => ({
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  Home: () => <div data-testid="home-icon" />,
  Search: () => <div data-testid="search-icon" />,
  History: () => <div data-testid="history-icon" />,
  Bookmark: () => <div data-testid="bookmark-icon" />,
  Database: () => <div data-testid="database-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  MessageSquare: () => <div data-testid="message-square-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  MoreHorizontal: () => <div data-testid="more-horizontal-icon" />,
  Globe: () => <div data-testid="globe-icon" />,
}));

describe('DashboardSkeleton', () => {
  it('renders without crashing', () => {
    render(<DashboardSkeleton />);
    expect(screen.getByTestId('bar-chart-icon')).toBeInTheDocument();
  });

  it('displays sidebar skeleton with navigation items', () => {
    render(<DashboardSkeleton />);
    
    // Check for navigation icons (search appears in both sidebar and header)
    expect(screen.getByTestId('home-icon')).toBeInTheDocument();
    expect(screen.getAllByTestId('search-icon')).toHaveLength(2); // One in sidebar, one in header
    expect(screen.getByTestId('history-icon')).toBeInTheDocument();
    expect(screen.getByTestId('bookmark-icon')).toBeInTheDocument();
  });

  it('displays header skeleton with search and user elements', () => {
    render(<DashboardSkeleton />);
    
    // Check for header elements
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
  });

  it('displays main content skeleton with cards', () => {
    render(<DashboardSkeleton />);
    
    // Check for card elements
    expect(screen.getAllByTestId('more-horizontal-icon')).toHaveLength(7); // 7 cards with more horizontal icons
    expect(screen.getByTestId('globe-icon')).toBeInTheDocument();
  });

  it('has proper layout structure', () => {
    const { container } = render(<DashboardSkeleton />);
    
    // Check for main layout elements
    expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
    expect(container.querySelector('.w-64')).toBeInTheDocument(); // Sidebar
    expect(container.querySelector('.flex-1')).toBeInTheDocument(); // Main content
  });

  it('includes animated background elements', () => {
    const { container } = render(<DashboardSkeleton />);
    
    // Check for animated background elements
    expect(container.querySelector('.animate-gentle-pulse')).toBeInTheDocument();
    expect(container.querySelector('.animate-float')).toBeInTheDocument();
    expect(container.querySelector('.animate-drift')).toBeInTheDocument();
  });

  it('maintains proper spacing and layout consistency', () => {
    const { container } = render(<DashboardSkeleton />);
    
    // Check for grid layouts
    expect(container.querySelector('.grid')).toBeInTheDocument();
    expect(container.querySelector('.lg\\:grid-cols-3')).toBeInTheDocument();
    expect(container.querySelector('.lg\\:grid-cols-2')).toBeInTheDocument();
  });

  it('includes enhanced loading animations with staggered timing', () => {
    const { container } = render(<DashboardSkeleton />);
    
    // Check for enhanced animation classes
    expect(container.querySelector('.animate-fade-in')).toBeInTheDocument();
    expect(container.querySelector('.animate-slide-up')).toBeInTheDocument();
    
    // Check for staggered animation delays
    const elementsWithDelay = container.querySelectorAll('[style*="animation-delay"]');
    expect(elementsWithDelay.length).toBeGreaterThan(0);
  });

  it('has smooth transitions on skeleton elements', () => {
    const { container } = render(<DashboardSkeleton />);
    
    // Check that skeleton elements have transition classes
    const skeletonElements = container.querySelectorAll('.animate-shimmer');
    expect(skeletonElements.length).toBeGreaterThan(0);
    
    // Verify transition classes are applied
    skeletonElements.forEach(element => {
      expect(element).toHaveClass('transition-all', 'duration-300', 'ease-in-out');
    });
  });
});