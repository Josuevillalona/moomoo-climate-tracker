/**
 * Utility functions for formatting data across the application
 */

/**
 * Format currency with various options and locales
 */
export function formatCurrency(
  amount: number,
  options: {
    locale?: string;
    currency?: string;
    notation?: 'standard' | 'compact';
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const {
    locale = 'en-US',
    currency = 'USD',
    notation = 'compact',
    minimumFractionDigits = 0,
    maximumFractionDigits = 1
  } = options;

  if (amount === 0) return '$0';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation,
      minimumFractionDigits,
      maximumFractionDigits
    }).format(amount);
  } catch (error) {
    // Fallback for unsupported locales or currencies
    return `$${amount.toLocaleString()}`;
  }
}

/**
 * Format numbers with appropriate scaling and locale support
 */
export function formatNumber(
  num: number,
  options: {
    locale?: string;
    notation?: 'standard' | 'compact';
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const {
    locale = 'en-US',
    notation = 'compact',
    minimumFractionDigits = 0,
    maximumFractionDigits = 1
  } = options;

  try {
    return new Intl.NumberFormat(locale, {
      notation,
      minimumFractionDigits,
      maximumFractionDigits
    }).format(num);
  } catch (error) {
    // Fallback
    return num.toLocaleString();
  }
}

/**
 * Format percentage with customizable precision
 */
export function formatPercentage(
  value: number,
  total: number,
  options: {
    decimals?: number;
    showSign?: boolean;
    locale?: string;
  } = {}
): string {
  const { decimals = 1, showSign = false, locale = 'en-US' } = options;
  
  if (total === 0) return '0%';
  
  const percentage = (value / total) * 100;
  const sign = showSign && percentage > 0 ? '+' : '';
  
  try {
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(Math.abs(percentage));
    
    return `${sign}${percentage < 0 ? '-' : ''}${formatted}%`;
  } catch (error) {
    return `${sign}${percentage.toFixed(decimals)}%`;
  }
}

/**
 * Format date with various options and locale support
 */
export function formatDate(
  date: string | Date,
  options: {
    format?: 'short' | 'medium' | 'long' | 'relative' | 'iso';
    locale?: string;
    timeZone?: string;
  } = {}
): string {
  const { format = 'short', locale = 'en-US', timeZone } = options;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  if (format === 'relative') {
    return formatRelativeDate(dateObj, locale);
  }

  if (format === 'iso') {
    return dateObj.toISOString().split('T')[0];
  }

  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone,
    ...(format === 'short' && {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
    ...(format === 'medium' && {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    ...(format === 'long' && {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  };

  try {
    return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
  } catch (error) {
    // Fallback
    return dateObj.toLocaleDateString();
  }
}

/**
 * Format relative date (e.g., "2 days ago", "in 3 weeks")
 */
export function formatRelativeDate(date: Date, locale: string = 'en-US'): string {
  const now = new Date();
  const diffInMs = date.getTime() - now.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (Math.abs(diffInSeconds) < 60) {
      return rtf.format(diffInSeconds, 'second');
    } else if (Math.abs(diffInMinutes) < 60) {
      return rtf.format(diffInMinutes, 'minute');
    } else if (Math.abs(diffInHours) < 24) {
      return rtf.format(diffInHours, 'hour');
    } else if (Math.abs(diffInDays) < 7) {
      return rtf.format(diffInDays, 'day');
    } else if (Math.abs(diffInWeeks) < 4) {
      return rtf.format(diffInWeeks, 'week');
    } else if (Math.abs(diffInMonths) < 12) {
      return rtf.format(diffInMonths, 'month');
    } else {
      return rtf.format(diffInYears, 'year');
    }
  } catch (error) {
    // Fallback for unsupported locales
    const absDays = Math.abs(diffInDays);
    const isPast = diffInMs < 0;
    
    if (absDays === 0) {
      return 'today';
    } else if (absDays === 1) {
      return isPast ? 'yesterday' : 'tomorrow';
    } else if (absDays < 7) {
      return isPast ? `${absDays} days ago` : `in ${absDays} days`;
    } else if (absDays < 30) {
      const weeks = Math.floor(absDays / 7);
      return isPast ? `${weeks} week${weeks > 1 ? 's' : ''} ago` : `in ${weeks} week${weeks > 1 ? 's' : ''}`;
    } else if (absDays < 365) {
      const months = Math.floor(absDays / 30);
      return isPast ? `${months} month${months > 1 ? 's' : ''} ago` : `in ${months} month${months > 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(absDays / 365);
      return isPast ? `${years} year${years > 1 ? 's' : ''} ago` : `in ${years} year${years > 1 ? 's' : ''}`;
    }
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  
  return `${size.toFixed(1)} ${sizes[i]}`;
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert camelCase to Title Case
 */
export function camelToTitle(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, char => char.toUpperCase())
    .trim();
}

/**
 * Generate initials from a name
 */
export function getInitials(name: string, maxInitials: number = 2): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, maxInitials)
    .join('');
}

/**
 * Format duration in human readable format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

/**
 * Parse and clean investor names from a string
 */
export function parseInvestors(investorString: string | null): string[] {
  if (!investorString) return [];
  
  return investorString
    .split(/[,;]/) // Split by comma or semicolon
    .map(investor => investor.trim())
    .filter(investor => investor.length > 0)
    .map(investor => cleanInvestorName(investor));
}

/**
 * Clean investor name by removing common prefixes/suffixes
 */
function cleanInvestorName(name: string): string {
  return name
    .replace(/^(Mr\.|Ms\.|Dr\.|Prof\.)\s+/i, '')
    .replace(/\s+(Inc\.|LLC|Ltd\.|Corp\.|LP|LLP)$/i, '')
    .trim();
}