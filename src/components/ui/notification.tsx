import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NotificationProps {
  id?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number; // in milliseconds, 0 means no auto-dismiss
  onDismiss?: (id?: string) => void;
  showCloseButton?: boolean;
  className?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
  animate?: boolean;
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: {
    bg: 'bg-green-50 border-green-200',
    text: 'text-green-800',
    icon: 'text-green-600',
    accent: 'bg-green-500',
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-800',
    icon: 'text-red-600',
    accent: 'bg-red-500',
  },
  warning: {
    bg: 'bg-yellow-50 border-yellow-200',
    text: 'text-yellow-800',
    icon: 'text-yellow-600',
    accent: 'bg-yellow-500',
  },
  info: {
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-800',
    icon: 'text-blue-600',
    accent: 'bg-blue-500',
  },
};

export function Notification({
  id,
  type = 'info',
  title,
  message,
  duration = 5000,
  onDismiss,
  showCloseButton = true,
  className,
  animate = true,
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const Icon = iconMap[type];
  const colors = colorMap[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleDismiss = () => {
    if (animate) {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onDismiss?.(id);
      }, 300); // Match animation duration
    } else {
      setIsVisible(false);
      onDismiss?.(id);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'relative flex items-start space-x-3 p-4 border rounded-lg shadow-lg backdrop-blur-sm',
        colors.bg,
        animate && !isExiting && 'animate-notification-slide',
        animate && isExiting && 'animate-notification-exit',
        className
      )}
      role="alert"
    >
      {/* Accent bar */}
      <div className={cn('absolute left-0 top-0 bottom-0 w-1 rounded-l-lg', colors.accent)} />
      
      {/* Icon */}
      <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', colors.icon)} />
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={cn('text-sm font-medium', colors.text)}>
            {title}
          </h4>
        )}
        <p className={cn('text-sm', title ? 'mt-1' : '', colors.text)}>
          {message}
        </p>
      </div>
      
      {/* Close button */}
      {showCloseButton && (
        <button
          onClick={handleDismiss}
          className={cn(
            'flex-shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors',
            colors.text
          )}
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// Notification container for managing multiple notifications
export interface NotificationContainerProps {
  notifications: Array<NotificationProps & { id: string }>;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
  className?: string;
  maxNotifications?: number;
}

export function NotificationContainer({
  notifications,
  position = 'top-right',
  className,
  maxNotifications = 5,
}: NotificationContainerProps) {
  const positionClasses = {
    'top-right': 'fixed top-4 right-4 z-50',
    'top-left': 'fixed top-4 left-4 z-50',
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'top-center': 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50',
  };

  const visibleNotifications = notifications.slice(0, maxNotifications);

  if (visibleNotifications.length === 0) return null;

  return (
    <div className={cn(positionClasses[position], className)}>
      <div className="space-y-2 w-80">
        {visibleNotifications.map((notification) => (
          <Notification key={notification.id} {...notification} />
        ))}
      </div>
    </div>
  );
}

// Hook for managing notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Array<NotificationProps & { id: string }>>([]);

  const addNotification = (notification: Omit<NotificationProps, 'id'> & { id?: string }) => {
    const id = notification.id || `notification-${Date.now()}-${Math.random()}`;
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const dismissNotification = (id?: string) => {
    if (id) {
      removeNotification(id);
    }
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    dismissNotification,
  };
}