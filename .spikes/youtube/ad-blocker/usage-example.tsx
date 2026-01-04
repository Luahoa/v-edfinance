import React from 'react';
import { YouTubeEmbed } from './YouTubeEmbed';
import { YouTubeErrorBoundary } from './YouTubeErrorBoundary';

/**
 * Example Usage of YouTube Embed with Error Handling
 */
export const VideoPage: React.FC = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Financial Literacy Course</h1>
      
      {/* Method 1: Using ErrorBoundary with default fallback */}
      <YouTubeErrorBoundary>
        <YouTubeEmbed videoId="dQw4w9WgXcQ" />
      </YouTubeErrorBoundary>

      <hr style={{ margin: '40px 0' }} />

      {/* Method 2: Using ErrorBoundary with custom fallback */}
      <YouTubeErrorBoundary
        fallback={
          <div style={customFallbackStyle}>
            <h3>Oops! Video player crashed</h3>
            <p>Please refresh the page or contact support.</p>
          </div>
        }
        onError={(error, errorInfo) => {
          // Send to analytics
          console.log('Error logged:', error, errorInfo);
        }}
      >
        <YouTubeEmbed
          videoId="dQw4w9WgXcQ"
          fallbackMessage="This educational video requires YouTube access. Please check your browser extensions."
        />
      </YouTubeErrorBoundary>

      <hr style={{ margin: '40px 0' }} />

      {/* Method 3: Multiple videos with shared error boundary */}
      <YouTubeErrorBoundary>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div>
            <h3>Lesson 1: Budgeting Basics</h3>
            <YouTubeEmbed videoId="dQw4w9WgXcQ" />
          </div>
          <div>
            <h3>Lesson 2: Saving Strategies</h3>
            <YouTubeEmbed videoId="dQw4w9WgXcQ" />
          </div>
          <div>
            <h3>Lesson 3: Investment 101</h3>
            <YouTubeEmbed videoId="dQw4w9WgXcQ" />
          </div>
        </div>
      </YouTubeErrorBoundary>
    </div>
  );
};

const customFallbackStyle: React.CSSProperties = {
  backgroundColor: '#f8d7da',
  border: '2px solid #f5c6cb',
  borderRadius: '8px',
  padding: '40px',
  textAlign: 'center',
  color: '#721c24',
};

export default VideoPage;
