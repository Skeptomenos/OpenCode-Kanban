import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DialogErrorBoundary } from '../dialog-error-boundary';
import { logger } from '@/lib/logger';

// Mock the logger to prevent console output during tests
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Component that throws an error during render
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test render error');
  }
  return <div data-testid="child-content">Normal content</div>;
}

describe('DialogErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress React's error boundary console output during tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when no error occurs', () => {
    render(
      <DialogErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </DialogErrorBoundary>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('renders default fallback when child throws render error', () => {
    render(
      <DialogErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </DialogErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
  });

  it('renders custom fallback when provided and child throws', () => {
    const customFallback = <div data-testid="custom-fallback">Custom error message</div>;

    render(
      <DialogErrorBoundary fallback={customFallback}>
        <ThrowingComponent shouldThrow={true} />
      </DialogErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('logs error via logger.error when error is caught', () => {
    render(
      <DialogErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </DialogErrorBoundary>
    );

    expect(logger.error).toHaveBeenCalledWith(
      'DialogErrorBoundary caught error',
      expect.objectContaining({
        message: 'Test render error',
        stack: expect.any(String),
        componentStack: expect.any(String),
      })
    );
  });

  it('contains error boundary with proper styling classes', () => {
    const { container } = render(
      <DialogErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </DialogErrorBoundary>
    );

    const fallbackDiv = container.querySelector('.text-destructive');
    expect(fallbackDiv).toBeInTheDocument();
    expect(fallbackDiv).toHaveClass('text-sm', 'p-2');
  });

  it('isolates error to boundary, preventing sidebar crash simulation', () => {
    // This simulates the use case from the spec: sidebar remains functional
    // when BoardActionsMenu wrapped in DialogErrorBoundary throws
    const SidebarSimulation = () => (
      <div data-testid="sidebar">
        <div data-testid="sidebar-header">Header (should remain)</div>
        <DialogErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </DialogErrorBoundary>
        <div data-testid="sidebar-footer">Footer (should remain)</div>
      </div>
    );

    render(<SidebarSimulation />);

    // Sidebar structure should remain intact
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-header')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-footer')).toBeInTheDocument();
    // Error boundary shows fallback
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
