import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FundingDeal } from '@/types/api';

export interface NewDealsNotificationProps {
  newDealsCount: number;
  isVisible: boolean;
  onDismiss: () => void;
  onViewDeals?: () => void;
  className?: string;
  autoHideDuration?: number;
}

export function NewDealsNotification({
  newDealsCount,
  isVisible,
  onDismiss,
  onViewDeals,
  className,
  autoHideDuration = 5000,
}: NewDealsNotificationProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isVisible && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoHideDuration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 300); // Match animation duration
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed top-20 right-6 z-50 bg-gradient-to-r from-brand-green/95 to-brand-tree-medium/95 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg border border-brand-green/20',
        !isExiting && 'animate-notification-slide',
        isExiting && 'animate-notification-exit',
        className
      )}
      role="alert"
    >
      <div className="flex items-center space-x-3">
        {/* Animated indicator */}
        <div className="relative">
          <div className="w-3 h-3 bg-brand-yellow rounded-full animate-pulse-green"></div>
          <div className="absolute inset-0 w-3 h-3 bg-brand-yellow rounded-full animate-ping opacity-75"></div>
        </div>
        
        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">
              {newDealsCount} new deal{newDealsCount > 1 ? 's' : ''} added
            </span>
          </div>
          <div className="flex items-center space-x-1 mt-1 text-xs text-brand-yellow/90">
            <Clock className="w-3 h-3" />
            <span>Just now</span>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center space-x-2">
          {onViewDeals && (
            <button
              onClick={onViewDeals}
              className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
            >
              View
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Compact version for smaller spaces
export interface CompactNewDealsIndicatorProps {
  newDealsCount: number;
  isVisible: boolean;
  onClick?: () => void;
  className?: string;
}

export function CompactNewDealsIndicator({
  newDealsCount,
  isVisible,
  onClick,
  className,
}: CompactNewDealsIndicatorProps) {
  if (!isVisible || newDealsCount === 0) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center space-x-2 bg-brand-green/90 hover:bg-brand-green text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg animate-bounce-in transition-colors',
        className
      )}
    >
      <div className="w-2 h-2 bg-brand-yellow rounded-full animate-pulse"></div>
      <span>{newDealsCount} new</span>
    </button>
  );
}

// Badge indicator for showing new deals count
export interface NewDealsBadgeProps {
  count: number;
  isVisible: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function NewDealsBadge({
  count,
  isVisible,
  className,
  size = 'md',
}: NewDealsBadgeProps) {
  if (!isVisible || count === 0) return null;

  const sizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm',
  };

  return (
    <div
      className={cn(
        'absolute -top-1 -right-1 bg-brand-green text-white rounded-full flex items-center justify-center font-bold animate-bounce-in',
        sizeClasses[size],
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </div>
  );
}