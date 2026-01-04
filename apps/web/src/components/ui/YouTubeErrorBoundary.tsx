'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';

interface YouTubeErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    videoId?: string;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface YouTubeErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorType: 'ad_blocker' | 'deleted_video' | 'network_error' | 'unknown';
}

/**
 * Error Boundary for YouTube Embed Components
 * 
 * Handles three main error types:
 * 1. Ad Blocker Detection (5s timeout)
 * 2. Deleted/Unavailable Videos (404 from YouTube API)
 * 3. Network Errors (connection failures)
 * 
 * Logs errors to BehaviorLog API for monitoring.
 */
export class YouTubeErrorBoundary extends Component<
    YouTubeErrorBoundaryProps,
    YouTubeErrorBoundaryState
> {
    constructor(props: YouTubeErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorType: 'unknown',
        };
    }

    static getDerivedStateFromError(error: Error): Partial<YouTubeErrorBoundaryState> {
        // Detect error type based on error message
        let errorType: YouTubeErrorBoundaryState['errorType'] = 'unknown';

        if (error.message.includes('timeout') || error.message.includes('blocked')) {
            errorType = 'ad_blocker';
        } else if (error.message.includes('404') || error.message.includes('not found')) {
            errorType = 'deleted_video';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorType = 'network_error';
        }

        return {
            hasError: true,
            error,
            errorType,
        };
    }

    async componentDidCatch(error: Error, errorInfo: ErrorInfo): Promise<void> {
        console.error('YouTube Embed Error:', error, errorInfo);

        // Log to backend BehaviorLog API
        try {
            await fetch('/api/behavior/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'youtube_error',
                    metadata: {
                        error: error.message,
                        errorType: this.state.errorType,
                        videoId: this.props.videoId,
                        componentStack: errorInfo.componentStack,
                    },
                }),
            });
        } catch (logError) {
            console.warn('Failed to log YouTube error:', logError);
        }

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorType: 'unknown',
        });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI based on error type
            return (
                <ErrorFallbackUI
                    errorType={this.state.errorType}
                    error={this.state.error}
                    videoId={this.props.videoId}
                    onRetry={this.handleRetry}
                />
            );
        }

        return this.props.children;
    }
}

/**
 * Error Fallback UI Component
 * 
 * Shows different UI based on error type:
 * - Ad Blocker: "Please disable ad blocker" message
 * - Deleted Video: "Video unavailable, contact admin" message
 * - Network Error: "Connection failed, retry button"
 */
function ErrorFallbackUI({
    errorType,
    error,
    videoId,
    onRetry,
}: {
    errorType: YouTubeErrorBoundaryState['errorType'];
    error: Error | null;
    videoId?: string;
    onRetry: () => void;
}) {
    const getErrorConfig = () => {
        switch (errorType) {
            case 'ad_blocker':
                return {
                    icon: '🚫',
                    titleKey: 'YouTube.adBlockerTitle',
                    messageKey: 'YouTube.adBlockerMessage',
                    showRetry: false,
                    showYouTubeLink: true,
                };
            case 'deleted_video':
                return {
                    icon: '📹',
                    titleKey: 'YouTube.deletedVideoTitle',
                    messageKey: 'YouTube.deletedVideoMessage',
                    showRetry: false,
                    showYouTubeLink: false,
                };
            case 'network_error':
                return {
                    icon: '📡',
                    titleKey: 'YouTube.networkErrorTitle',
                    messageKey: 'YouTube.networkErrorMessage',
                    showRetry: true,
                    showYouTubeLink: true,
                };
            default:
                return {
                    icon: '⚠️',
                    titleKey: 'YouTube.unknownErrorTitle',
                    messageKey: 'YouTube.unknownErrorMessage',
                    showRetry: true,
                    showYouTubeLink: true,
                };
        }
    };

    const config = getErrorConfig();

    return (
        <YouTubeErrorFallback
            icon={config.icon}
            titleKey={config.titleKey}
            messageKey={config.messageKey}
            showRetry={config.showRetry}
            showYouTubeLink={config.showYouTubeLink}
            videoId={videoId}
            error={error}
            onRetry={onRetry}
        />
    );
}

/**
 * Wrapper component to use translations hook
 */
function YouTubeErrorFallback({
    icon,
    titleKey,
    messageKey,
    showRetry,
    showYouTubeLink,
    videoId,
    error,
    onRetry,
}: {
    icon: string;
    titleKey: string;
    messageKey: string;
    showRetry: boolean;
    showYouTubeLink: boolean;
    videoId?: string;
    error: Error | null;
    onRetry: () => void;
}) {
    const t = useTranslations();

    return (
        <div className="flex aspect-video w-full items-center justify-center rounded-lg border-2 border-dashed border-yellow-400 bg-yellow-50 p-8 dark:border-yellow-600 dark:bg-yellow-950">
            <div className="max-w-md text-center">
                <div className="mb-4 text-6xl">{icon}</div>

                <h3 className="mb-3 text-xl font-bold text-yellow-900 dark:text-yellow-100">
                    {t(titleKey)}
                </h3>

                <p className="mb-6 text-sm leading-relaxed text-yellow-800 dark:text-yellow-200">
                    {t(messageKey)}
                </p>

                {error && (
                    <details className="mb-4 rounded-md bg-white p-3 text-left dark:bg-yellow-900">
                        <summary className="cursor-pointer font-semibold text-yellow-900 dark:text-yellow-100">
                            {t('YouTube.errorDetails')}
                        </summary>
                        <pre className="mt-2 max-h-32 overflow-auto text-xs text-red-700 dark:text-red-300">
                            {error.message}
                        </pre>
                    </details>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    {showRetry && (
                        <button
                            onClick={onRetry}
                            className="rounded-lg bg-yellow-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600"
                        >
                            {t('YouTube.retryButton')}
                        </button>
                    )}

                    {showYouTubeLink && videoId && (
                        <a
                            href={`https://www.youtube.com/watch?v=${videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700"
                        >
                            {t('YouTube.watchOnYouTube')} →
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

export default YouTubeErrorBoundary;
