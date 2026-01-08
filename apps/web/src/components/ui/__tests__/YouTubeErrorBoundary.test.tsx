/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { YouTubeErrorBoundary } from '../YouTubeErrorBoundary';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

const messages = {
    YouTube: {
        adBlockerTitle: 'YouTube Blocked',
        adBlockerMessage: 'Please disable ad blocker',
        deletedVideoTitle: 'Video Unavailable',
        deletedVideoMessage: 'Video deleted or private',
        networkErrorTitle: 'Connection Failed',
        networkErrorMessage: 'Network error occurred',
        unknownErrorTitle: 'Something Went Wrong',
        unknownErrorMessage: 'Unexpected error',
        errorDetails: 'Error Details',
        retryButton: 'Try Again',
        watchOnYouTube: 'Watch on YouTube',
    },
};

// Component that throws error for testing
class ThrowError extends React.Component<{ message: string }> {
    componentDidMount() {
        throw new Error(this.props.message);
    }
    render() {
        return null;
    }
}

describe('YouTubeErrorBoundary', () => {
    const renderWithIntl = (ui: React.ReactElement) => {
        return render(
            <NextIntlClientProvider locale="en" messages={messages}>
                {ui}
            </NextIntlClientProvider>
        );
    };

    it('renders children when no error', () => {
        renderWithIntl(
            <YouTubeErrorBoundary>
                <div>Video Player</div>
            </YouTubeErrorBoundary>
        );

        expect(screen.getByText('Video Player')).toBeInTheDocument();
    });

    it('shows ad blocker error for timeout errors', () => {
        // Suppress error console output in tests
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        renderWithIntl(
            <YouTubeErrorBoundary videoId="test123">
                <ThrowError message="timeout: YouTube API blocked" />
            </YouTubeErrorBoundary>
        );

        expect(screen.getByText('YouTube Blocked')).toBeInTheDocument();
        expect(screen.getByText('Please disable ad blocker')).toBeInTheDocument();
        expect(screen.getByText('🚫')).toBeInTheDocument();

        consoleSpy.mockRestore();
    });

    it('shows deleted video error for 404 errors', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        renderWithIntl(
            <YouTubeErrorBoundary videoId="test123">
                <ThrowError message="404 not found" />
            </YouTubeErrorBoundary>
        );

        expect(screen.getByText('Video Unavailable')).toBeInTheDocument();
        expect(screen.getByText('Video deleted or private')).toBeInTheDocument();
        expect(screen.getByText('📹')).toBeInTheDocument();

        consoleSpy.mockRestore();
    });

    it('shows network error for connection failures', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        renderWithIntl(
            <YouTubeErrorBoundary videoId="test123">
                <ThrowError message="network error: fetch failed" />
            </YouTubeErrorBoundary>
        );

        expect(screen.getByText('Connection Failed')).toBeInTheDocument();
        expect(screen.getByText('Network error occurred')).toBeInTheDocument();
        expect(screen.getByText('📡')).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();

        consoleSpy.mockRestore();
    });

    it('shows unknown error for other errors', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        renderWithIntl(
            <YouTubeErrorBoundary videoId="test123">
                <ThrowError message="Something random broke" />
            </YouTubeErrorBoundary>
        );

        expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
        expect(screen.getByText('Unexpected error')).toBeInTheDocument();
        expect(screen.getByText('⚠️')).toBeInTheDocument();

        consoleSpy.mockRestore();
    });

    it('calls custom onError handler when provided', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const onError = vi.fn();

        renderWithIntl(
            <YouTubeErrorBoundary videoId="test123" onError={onError}>
                <ThrowError message="test error" />
            </YouTubeErrorBoundary>
        );

        expect(onError).toHaveBeenCalled();
        const [error] = onError.mock.calls[0];
        expect(error.message).toBe('test error');

        consoleSpy.mockRestore();
    });

    it('renders custom fallback when provided', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        renderWithIntl(
            <YouTubeErrorBoundary
                videoId="test123"
                fallback={<div>Custom Error UI</div>}
            >
                <ThrowError message="test" />
            </YouTubeErrorBoundary>
        );

        expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
        expect(screen.queryByText('YouTube Blocked')).not.toBeInTheDocument();

        consoleSpy.mockRestore();
    });

    it('shows YouTube link for ad blocker errors', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        renderWithIntl(
            <YouTubeErrorBoundary videoId="abc123">
                <ThrowError message="blocked by ad blocker" />
            </YouTubeErrorBoundary>
        );

        const youtubeLink = screen.getByText(/Watch on YouTube/);
        expect(youtubeLink).toHaveAttribute(
            'href',
            'https://www.youtube.com/watch?v=abc123'
        );
        expect(youtubeLink).toHaveAttribute('target', '_blank');
        expect(youtubeLink).toHaveAttribute('rel', 'noopener noreferrer');

        consoleSpy.mockRestore();
    });

    it('does not show YouTube link for deleted video errors', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        renderWithIntl(
            <YouTubeErrorBoundary videoId="abc123">
                <ThrowError message="404 video not found" />
            </YouTubeErrorBoundary>
        );

        expect(screen.queryByText(/Watch on YouTube/)).not.toBeInTheDocument();

        consoleSpy.mockRestore();
    });

    it('logs error to BehaviorLog API', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
        } as Response);

        renderWithIntl(
            <YouTubeErrorBoundary videoId="test123">
                <ThrowError message="timeout error" />
            </YouTubeErrorBoundary>
        );

        // Wait for async fetch call
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(fetchSpy).toHaveBeenCalledWith(
            '/api/behavior/log',
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: expect.stringContaining('youtube_error'),
            })
        );

        consoleSpy.mockRestore();
        fetchSpy.mockRestore();
    });
});
