'use client';

import React from 'react';
import { ReportGeneratorProps } from '../../../types/enhanced-widgets';
import EnhancedWidgetWrapper from '../EnhancedWidgetWrapper';

const ReportGeneratorWidget: React.FC<ReportGeneratorProps> = ({
  dashboardData,
  selectedFilters,
  onGenerateReport,
  loading,
  error,
}) => {
  return (
    <EnhancedWidgetWrapper
      title="Report Generator"
      subtitle="Generate professional reports"
      size="normal"
      loading={loading}
      error={error}
      type="reports"
    >
      {/* Placeholder content - will be implemented in future tasks */}
      <div className="text-center py-8 text-gray-500">
        Report Generator Widget
        <br />
        <small>To be implemented in task 6</small>
      </div>
    </EnhancedWidgetWrapper>
  );
};

export default ReportGeneratorWidget;