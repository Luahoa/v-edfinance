'use client';

import { AlertTriangle, RefreshCcw } from 'lucide-react';
import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorId: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    const errorId = `UI-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    return { hasError: true, error, errorId };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[${this.state.errorId}] Uncaught error:`, error, errorInfo);
    // Future: Push to behavior log API
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-zinc-50 dark:bg-zinc-900 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full mb-6">
              <AlertTriangle className="text-red-600 dark:text-red-400 w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Oops! Something went wrong</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-2 max-w-md">
              Our system encountered an unexpected error. Don&apos;t worry, your progress is safe.
            </p>
            {this.state.errorId && (
              <p className="text-xs font-mono text-zinc-400 mb-8">Error ID: {this.state.errorId}</p>
            )}
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
            >
              <RefreshCcw size={18} />
              Try Again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
