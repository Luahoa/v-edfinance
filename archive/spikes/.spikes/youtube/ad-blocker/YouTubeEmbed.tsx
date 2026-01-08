import React, { useEffect, useRef, useState } from 'react';

interface YouTubeEmbedProps {
  videoId: string;
  className?: string;
  fallbackMessage?: string;
}

interface YouTubePlayer {
  destroy: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

/**
 * YouTube Embed with Ad Blocker Detection
 * 
 * Detection Strategy:
 * 1. Load YouTube IFrame API
 * 2. Set 5s timeout for API load
 * 3. Set 3s timeout for player initialization
 * 4. Show fallback if either timeout expires or player errors
 */
export const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({
  videoId,
  className = '',
  fallbackMessage = 'This video is currently unavailable. Please check your ad blocker or privacy settings.'
}) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const playerInstanceRef = useRef<YouTubePlayer | null>(null);
  const apiLoadTimeoutRef = useRef<NodeJS.Timeout>();
  const playerInitTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    let mounted = true;

    // Check if API already loaded
    if (window.YT && window.YT.Player) {
      initializePlayer();
      return;
    }

    // Set API load timeout (5s)
    apiLoadTimeoutRef.current = setTimeout(() => {
      if (mounted && !window.YT) {
        setError('YouTube API failed to load. This may be caused by an ad blocker or network restriction.');
        setIsLoading(false);
      }
    }, 5000);

    // Load YouTube API
    const loadAPI = () => {
      // Check if script already exists
      if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        return;
      }

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      
      tag.onerror = () => {
        if (mounted) {
          setError('Failed to load YouTube API. Please check your connection or disable ad blockers.');
          setIsLoading(false);
        }
      };

      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    };

    // API ready callback
    const originalCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (apiLoadTimeoutRef.current) {
        clearTimeout(apiLoadTimeoutRef.current);
      }
      
      if (originalCallback) {
        originalCallback();
      }
      
      if (mounted) {
        initializePlayer();
      }
    };

    loadAPI();

    function initializePlayer() {
      if (!playerRef.current || !mounted) return;

      // Set player initialization timeout (3s)
      playerInitTimeoutRef.current = setTimeout(() => {
        if (mounted && isLoading) {
          setError('YouTube player failed to initialize. This may be caused by an ad blocker.');
          setIsLoading(false);
        }
      }, 3000);

      try {
        playerInstanceRef.current = new window.YT.Player(playerRef.current, {
          videoId: videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            modestbranding: 1,
            rel: 0,
          },
          events: {
            onReady: () => {
              if (playerInitTimeoutRef.current) {
                clearTimeout(playerInitTimeoutRef.current);
              }
              if (mounted) {
                setIsLoading(false);
                setError(null);
              }
            },
            onError: (event: { data: number }) => {
              if (playerInitTimeoutRef.current) {
                clearTimeout(playerInitTimeoutRef.current);
              }
              if (mounted) {
                const errorMessages: Record<number, string> = {
                  2: 'Invalid video ID',
                  5: 'HTML5 player error',
                  100: 'Video not found or private',
                  101: 'Video cannot be embedded',
                  150: 'Video cannot be embedded',
                };
                setError(errorMessages[event.data] || 'An error occurred while loading the video');
                setIsLoading(false);
              }
            },
          },
        });
      } catch (err) {
        if (playerInitTimeoutRef.current) {
          clearTimeout(playerInitTimeoutRef.current);
        }
        if (mounted) {
          setError('Failed to create YouTube player: ' + (err as Error).message);
          setIsLoading(false);
        }
      }
    }

    return () => {
      mounted = false;
      if (apiLoadTimeoutRef.current) {
        clearTimeout(apiLoadTimeoutRef.current);
      }
      if (playerInitTimeoutRef.current) {
        clearTimeout(playerInitTimeoutRef.current);
      }
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
      }
    };
  }, [videoId, isLoading]);

  if (error) {
    return (
      <div className={`youtube-embed-fallback ${className}`} style={fallbackStyles.container}>
        <div style={fallbackStyles.content}>
          <div style={fallbackStyles.icon}>🎥</div>
          <h3 style={fallbackStyles.title}>Video Unavailable</h3>
          <p style={fallbackStyles.message}>{fallbackMessage}</p>
          <p style={fallbackStyles.error}>{error}</p>
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={fallbackStyles.link}
          >
            Watch on YouTube →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`youtube-embed-container ${className}`} style={{ position: 'relative', width: '100%', paddingBottom: '56.25%' }}>
      {isLoading && (
        <div style={fallbackStyles.loading}>
          <div style={fallbackStyles.spinner}></div>
          <p>Loading video...</p>
        </div>
      )}
      <div
        ref={playerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
};

const fallbackStyles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#f8f9fa',
    border: '2px dashed #6c757d',
    borderRadius: '8px',
    padding: '40px 20px',
    textAlign: 'center',
    minHeight: '300px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    maxWidth: '500px',
  },
  icon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#333',
  },
  message: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '8px',
    lineHeight: '1.5',
  },
  error: {
    fontSize: '14px',
    color: '#dc3545',
    marginBottom: '16px',
    fontStyle: 'italic',
  },
  link: {
    display: 'inline-block',
    padding: '12px 24px',
    backgroundColor: '#FF0000',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
  },
  loading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    zIndex: 10,
  },
  spinner: {
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #FF0000',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
  },
};

export default YouTubeEmbed;
