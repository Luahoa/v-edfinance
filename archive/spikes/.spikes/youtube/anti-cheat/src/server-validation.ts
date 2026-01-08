/**
 * SERVER-SIDE VALIDATION LOGIC
 * 
 * This demonstrates the anti-cheat approach for YouTube video completion
 */

interface WatchLog {
  timestamp: number;
  playedSeconds: number;
  played: number;
  sessionId: string;
  userId: string;
}

interface VideoMetadata {
  videoId: string;
  duration: number; // From YouTube API
}

interface ValidationResult {
  isValid: boolean;
  reason: string;
  watchTime: number;
  completionRate: number;
  suspiciousActivity: string[];
}

export class VideoCompletionValidator {
  private readonly COMPLETION_THRESHOLD = 0.9; // 90%
  private readonly TOLERANCE_SECONDS = 5;
  private readonly MAX_ALLOWED_JUMPS = 2;
  private readonly MAX_TIME_GAP_SECONDS = 5; // Max gap between progress events
  
  /**
   * Validates if a user legitimately watched 90% of a video
   * 
   * @param logs - Array of watch progress logs from client
   * @param metadata - Video metadata (duration from YouTube API)
   * @returns Validation result
   */
  async validate(
    logs: WatchLog[], 
    metadata: VideoMetadata
  ): Promise<ValidationResult> {
    const suspiciousActivity: string[] = [];
    
    // 1. BASIC CHECKS
    if (logs.length === 0) {
      return {
        isValid: false,
        reason: 'No watch logs provided',
        watchTime: 0,
        completionRate: 0,
        suspiciousActivity: ['no_data']
      };
    }

    // 2. VERIFY VIDEO DURATION (prevent duration manipulation)
    const reportedDuration = this.getMaxPlayedSeconds(logs);
    if (Math.abs(reportedDuration - metadata.duration) > this.TOLERANCE_SECONDS) {
      suspiciousActivity.push('duration_mismatch');
    }

    // 3. DETECT SUSPICIOUS JUMPS
    const jumps = this.detectJumps(logs);
    if (jumps > this.MAX_ALLOWED_JUMPS) {
      suspiciousActivity.push(`excessive_jumps:${jumps}`);
    }

    // 4. CALCULATE CONTINUOUS WATCH TIME
    const continuousWatchTime = this.calculateContinuousWatchTime(logs);
    const requiredWatchTime = metadata.duration * this.COMPLETION_THRESHOLD;
    
    if (continuousWatchTime < (requiredWatchTime - this.TOLERANCE_SECONDS)) {
      suspiciousActivity.push('insufficient_watch_time');
    }

    // 5. VERIFY SESSION TIME MAKES SENSE
    const sessionDuration = this.getSessionDuration(logs);
    if (sessionDuration < (requiredWatchTime - this.TOLERANCE_SECONDS)) {
      suspiciousActivity.push('session_too_short');
    }

    // 6. CHECK PLAYBACK SPEED ANOMALIES
    const speedAnomalies = this.detectSpeedAnomalies(logs);
    if (speedAnomalies > 0) {
      suspiciousActivity.push(`speed_anomalies:${speedAnomalies}`);
    }

    // 7. FINAL DECISION
    const completionRate = this.getMaxCompletionRate(logs);
    const isValid = 
      completionRate >= this.COMPLETION_THRESHOLD &&
      continuousWatchTime >= (requiredWatchTime - this.TOLERANCE_SECONDS) &&
      suspiciousActivity.length === 0;

    return {
      isValid,
      reason: isValid 
        ? 'Valid completion verified'
        : `Validation failed: ${suspiciousActivity.join(', ')}`,
      watchTime: continuousWatchTime,
      completionRate,
      suspiciousActivity
    };
  }

  /**
   * Detects forward jumps in playback (>10s)
   */
  private detectJumps(logs: WatchLog[]): number {
    let jumpCount = 0;
    
    for (let i = 1; i < logs.length; i++) {
      const timeDelta = (logs[i].timestamp - logs[i-1].timestamp) / 1000;
      const progressDelta = logs[i].playedSeconds - logs[i-1].playedSeconds;
      
      // If progress jumped more than time elapsed + tolerance
      if (progressDelta > (timeDelta + 10)) {
        jumpCount++;
      }
    }
    
    return jumpCount;
  }

  /**
   * Calculates actual continuous watch time
   * Only counts segments where progress matches elapsed time
   */
  private calculateContinuousWatchTime(logs: WatchLog[]): number {
    let totalWatchTime = 0;
    
    for (let i = 1; i < logs.length; i++) {
      const timeDelta = (logs[i].timestamp - logs[i-1].timestamp) / 1000;
      const progressDelta = logs[i].playedSeconds - logs[i-1].playedSeconds;
      
      // Only count if progress matches time (±2s tolerance for buffering)
      if (
        Math.abs(progressDelta - timeDelta) < 2 && 
        timeDelta < this.MAX_TIME_GAP_SECONDS
      ) {
        totalWatchTime += timeDelta;
      }
    }
    
    return totalWatchTime;
  }

  /**
   * Detects if playback speed was manipulated
   */
  private detectSpeedAnomalies(logs: WatchLog[]): number {
    let anomalies = 0;
    
    for (let i = 1; i < logs.length; i++) {
      const timeDelta = (logs[i].timestamp - logs[i-1].timestamp) / 1000;
      const progressDelta = logs[i].playedSeconds - logs[i-1].playedSeconds;
      
      // Normal speed: progressDelta ≈ timeDelta (±0.5s)
      // 2x speed: progressDelta ≈ 2 * timeDelta
      const speedRatio = progressDelta / timeDelta;
      
      // Flag if speed > 3x (abnormal)
      if (speedRatio > 3 && timeDelta > 1) {
        anomalies++;
      }
    }
    
    return anomalies;
  }

  private getSessionDuration(logs: WatchLog[]): number {
    if (logs.length === 0) return 0;
    return (logs[logs.length - 1].timestamp - logs[0].timestamp) / 1000;
  }

  private getMaxPlayedSeconds(logs: WatchLog[]): number {
    return Math.max(...logs.map(l => l.playedSeconds));
  }

  private getMaxCompletionRate(logs: WatchLog[]): number {
    return Math.max(...logs.map(l => l.played));
  }
}

/**
 * USAGE EXAMPLE:
 * 
 * // In NestJS controller
 * @Post('/courses/:id/complete-lesson')
 * async completeLesson(
 *   @Param('id') courseId: string,
 *   @Body() body: { watchLogs: WatchLog[] }
 * ) {
 *   // 1. Fetch video duration from YouTube API (or cache)
 *   const metadata = await this.youtubeService.getVideoMetadata(videoId);
 *   
 *   // 2. Validate completion
 *   const validator = new VideoCompletionValidator();
 *   const result = await validator.validate(body.watchLogs, metadata);
 *   
 *   // 3. Grant completion only if valid
 *   if (!result.isValid) {
 *     throw new BadRequestException(`Invalid completion: ${result.reason}`);
 *   }
 *   
 *   // 4. Update progress
 *   await this.progressService.markComplete(userId, courseId);
 *   
 *   return { success: true };
 * }
 */

/**
 * CLIENT-SIDE IMPLEMENTATION:
 * 
 * const VideoPlayer = () => {
 *   const logs = useRef<WatchLog[]>([]);
 *   
 *   const handleProgress = (state) => {
 *     logs.current.push({
 *       timestamp: Date.now(),
 *       playedSeconds: state.playedSeconds,
 *       played: state.played,
 *       sessionId: SESSION_ID,
 *       userId: USER_ID
 *     });
 *     
 *     // Send to server when 90% reached
 *     if (state.played >= 0.9) {
 *       await fetch('/api/courses/complete', {
 *         method: 'POST',
 *         body: JSON.stringify({ watchLogs: logs.current })
 *       });
 *     }
 *   };
 *   
 *   return <ReactPlayer onProgress={handleProgress} progressInterval={1000} />;
 * };
 */
