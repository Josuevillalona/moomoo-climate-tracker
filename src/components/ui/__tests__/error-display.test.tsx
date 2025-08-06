import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorDisplay, InlineError, ErrorAlert } from '@/components/ui/error-display';
import { createAppError } from '@/lib/errors/types';
import { ApiErrorType } from '@/types/api';

describe('ErrorDisplay', () => {
  const mockError = createAppError(ApiErrorType.NETWORK_ERROR, new Error('Test error'));

  it('renders error message and icon', () => {
    render(<ErrorDisplay error={mockError} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(mockError.userMessage)).toBeInTheDocument();
  });

  it('shows retry button for retryable errors', () => {
    const onRetry = jest.fn();
    render(<ErrorDisplay error={mockError} onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not show retry button for non-retryable errors', () => {
    const nonRetryableError = createAppError(ApiErrorType.VALIDATION_ERROR);
    nonRetryableError.retryable = false;

    render(<ErrorDisplay error={nonRetryableError} />);

    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('shows dismiss button when onDismiss is provided', () => {
    const onDismiss = jest.fn();
    render(<ErrorDisplay error={mockError} onDismiss={onDismiss} />);

    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    expect(dismissButton).toBeInTheDocument();

    fireEvent.click(dismissButton);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('shows technical details when enabled', () => {
    render(<ErrorDisplay error={mockError} showTechnicalDetails={true} />);

    expect(screen.getByText('Technical Details:')).toBeInTheDocument();
    expect(screen.getByText(mockError.technicalDetails!)).toBeInTheDocument();
  });

  it('renders in compact mode', () => {
    render(<ErrorDisplay error={mockError} compact={true} />);

    // In compact mode, should not show the full card layout
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    expect(screen.getByText(mockError.userMessage)).toBeInTheDocument();
  });

  it('displays timestamp', () => {
    render(<ErrorDisplay error={mockError} />);

    expect(screen.getByText(/Error occurred at/)).toBeInTheDocument();
  });

  it('shows status code when available', () => {
    const errorWithStatus = { ...mockError, statusCode: 500 };
    render(<ErrorDisplay error={errorWithStatus} showTechnicalDetails={true} />);

    expect(screen.getByText('Status Code: 500')).toBeInTheDocument();
  });
});

describe('InlineError', () => {
  it('renders error message', () => {
    render(<InlineError message="Test inline error" />);

    expect(screen.getByText('Test inline error')).toBeInTheDocument();
  });

  it('shows retry button when onRetry is provided', () => {
    const onRetry = jest.fn();
    render(<InlineError message="Test error" onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not show retry button when onRetry is not provided', () => {
    render(<InlineError message="Test error" />);

    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });
});

describe('ErrorAlert', () => {
  it('renders title and message', () => {
    render(<ErrorAlert title="Error Title" message="Error message" />);

    expect(screen.getByText('Error Title')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('applies correct styling for error type', () => {
    const { container } = render(
      <ErrorAlert title="Error" message="Message" type="error" />
    );

    expect(container.firstChild).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800');
  });

  it('applies correct styling for warning type', () => {
    const { container } = render(
      <ErrorAlert title="Warning" message="Message" type="warning" />
    );

    expect(container.firstChild).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800');
  });

  it('applies correct styling for info type', () => {
    const { container } = render(
      <ErrorAlert title="Info" message="Message" type="info" />
    );

    expect(container.firstChild).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800');
  });

  it('shows close button when onClose is provided', () => {
    const onClose = jest.fn();
    render(<ErrorAlert title="Error" message="Message" onClose={onClose} />);

    const closeButton = screen.getByRole('button');
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not show close button when onClose is not provided', () => {
    render(<ErrorAlert title="Error" message="Message" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});