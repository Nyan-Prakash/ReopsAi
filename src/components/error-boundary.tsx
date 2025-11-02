'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} reset={this.reset} />;
      }

      return (
        <div
          role="alert"
          className="flex min-h-screen flex-col items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-lg border border-destructive bg-card p-6 shadow-lg">
            <h1 className="mb-2 text-xl font-semibold text-destructive">
              Something went wrong
            </h1>
            <p className="mb-4 text-sm text-muted-foreground">
              {this.state.error.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={this.reset}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              aria-label="Try again"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}