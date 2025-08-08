import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { FundingDeal } from '@/types/api';
import { Sparkles, TrendingUp } from 'lucide-react';

export interface NewDealHighlightProps {
  deal: FundingDeal;
  isNew: boolean;
  children: React.ReactNode;
  className?: string;
  highlightDuration?: number; // in milliseconds
  onHighlightEnd?: () => void;
}

export function NewDealHighlight({
  deal,
  isNew,
  children,
  className,
  highlightDuration = 10000, // 10 seconds
  onHighlightEnd,
}: NewDealHighlightProps) {
  const [showHighlight, setShowHighlight] = useState(isNew);
  const [isAnimating, setIsAnimating] = useState(isNew);

  useEffect(() => {
    if (isNew) {
      setShowHighlight(true);
      setIsAnimating(true);

      // Remove highlight after duration
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(() => {
          setShowHighlight(false);
          onHighlightEnd?.();
        }, 500); // Allow fade-out animation
      }, highlightDuration);

      return () => clearTimeout(timer);
    }
  }, [isNew, highlightDuration, onHighlightEnd]);

  return (
    <div
      className={cn(
        'relative transition-all duration-500',
        showHighlight && isAnimating && 'animate-new-item-highlight',
        showHighlight && !isAnimating && 'animate-fade-out',
        className
      )}
    >
      {/* New deal indicator */}
      {showHighlight && (
        <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 z-10">
          <div className="flex items-center space-x-1">
            <div className="w-1 h-8 bg-gradient-to-b from-brand-green to-brand-yellow rounded-full animate-pulse"></div>
            <div className="bg-brand-green text-white px-2 py-1 rounded-r-md text-xs font-medium animate-slide-in-left">
              <div className="flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>NEW</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Glow effect for new deals */}
      {showHighlight && (
        <div className="absolute inset-0 bg-gradient-to-r from-brand-green/10 via-brand-yellow/10 to-brand-green/10 rounded-lg animate-glow-pulse pointer-events-none" />
      )}

      {/* Content */}
      <div
        className={cn(
          'relative transition-all duration-300',
          showHighlight && 'transform scale-[1.02] shadow-lg border-brand-green/30'
        )}
      >
        {children}
      </div>

      {/* Floating animation for new deals */}
      {showHighlight && isAnimating && (
        <div className="absolute top-2 right-2 animate-float-gentle">
          <TrendingUp className="w-4 h-4 text-brand-green opacity-60" />
        </div>
      )}
    </div>
  );
}

// Wrapper component for deal list items
export interface AnimatedDealItemProps {
  deal: FundingDeal;
  isNew: boolean;
  index: number;
  children: React.ReactNode;
  className?: string;
}

export function AnimatedDealItem({
  deal,
  isNew,
  index,
  children,
  className,
}: AnimatedDealItemProps) {
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    // Stagger the entrance animation
    const timer = setTimeout(() => {
      setHasEntered(true);
    }, index * 100);

    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      className={cn(
        'transition-all duration-500',
        !hasEntered && 'opacity-0 transform translate-y-4',
        hasEntered && 'opacity-100 transform translate-y-0',
        className
      )}
      style={{
        transitionDelay: `${index * 50}ms`,
      }}
    >
      <NewDealHighlight deal={deal} isNew={isNew}>
        {children}
      </NewDealHighlight>
    </div>
  );
}

// Hook for managing new deal highlights
export function useNewDealHighlights(dealIds: number[]) {
  const [highlightedDeals, setHighlightedDeals] = useState<Set<number>>(new Set());

  const addHighlight = (dealId: number) => {
    setHighlightedDeals(prev => new Set(Array.from(prev).concat(dealId)));
  };

  const removeHighlight = (dealId: number) => {
    setHighlightedDeals(prev => {
      const newSet = new Set(prev);
      newSet.delete(dealId);
      return newSet;
    });
  };

  const clearHighlights = () => {
    setHighlightedDeals(new Set());
  };

  const isHighlighted = (dealId: number) => {
    return highlightedDeals.has(dealId);
  };

  // Auto-add highlights for new deal IDs
  useEffect(() => {
    dealIds.forEach(id => {
      if (!highlightedDeals.has(id)) {
        addHighlight(id);
      }
    });
  }, [dealIds]);

  return {
    highlightedDeals,
    addHighlight,
    removeHighlight,
    clearHighlights,
    isHighlighted,
  };
}