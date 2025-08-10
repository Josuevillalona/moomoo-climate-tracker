'use client';

import React from 'react';
import { EnhancedNewsProps } from '../../../types/enhanced-widgets';
import EnhancedWidgetWrapper from '../EnhancedWidgetWrapper';

const EnhancedNewsWidget: React.FC<EnhancedNewsProps> = ({
  filters,
  relevanceThreshold,
  onArticleClick,
  articles,
  loading,
  error,
}) => {
  return (
    <EnhancedWidgetWrapper
      title="Climate Tech News"
      subtitle={`${articles.length} articles found`}
      size="normal"
      loading={loading}
      error={error}
      type="news"
    >
      {/* Placeholder content - will be implemented in future tasks */}
      <div className="text-center py-8 text-gray-500">
        Enhanced Climate Tech News Widget
        <br />
        <small>To be implemented in task 5</small>
      </div>
    </EnhancedWidgetWrapper>
  );
};

export default EnhancedNewsWidget;