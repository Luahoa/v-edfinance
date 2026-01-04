interface WatchLog {
  timestamp: number;
  playedSeconds: number;
  played: number;
  sessionId: string;
  userId: string;
}

interface VideoMetadata {
  videoId: string;
  duration: number;
}

interface ValidationResult {
  isValid: boolean;
  reason: string;
  watchTime: number;
  completionRate: number;
  suspiciousActivity: string[];
}

export class VideoCompletionValidator {
  private readonly COMPLETION_THRESHOLD = 0.9;
  private readonly TOLERANCE_SECONDS = 5;
  private readonly MAX_ALLOWED_JUMPS = 2;
  private readonly MAX_TIME_GAP_SECONDS = 5;

  async validate(
    logs: WatchLog[],
    metadata: VideoMetadata
  ): Promise<ValidationResult> {
    const suspiciousActivity: string[] = [];

    if (logs.length === 0) {
      return {
        isValid: false,
        reason: 'No watch logs provided',
        watchTime: 0,
        completionRate: 0,
        suspiciousActivity: ['no_data'],
      };
    }

    const reportedDuration = this.getMaxPlayedSeconds(logs);
    if (Math.abs(reportedDuration - metadata.duration) > this.TOLERANCE_SECONDS) {
      suspiciousActivity.push('duration_mismatch');
    }

    const jumps = this.detectJumps(logs);
    if (jumps > this.MAX_ALLOWED_JUMPS) {
      suspiciousActivity.push(`excessive_jumps:${jumps}`);
    }

    const continuousWatchTime = this.calculateContinuousWatchTime(logs);
    const requiredWatchTime = metadata.duration * this.COMPLETION_THRESHOLD;

    if (continuousWatchTime < requiredWatchTime - this.TOLERANCE_SECONDS) {
      suspiciousActivity.push('insufficient_watch_time');
    }

    const sessionDuration = this.getSessionDuration(logs);
    if (sessionDuration < requiredWatchTime - this.TOLERANCE_SECONDS) {
      suspiciousActivity.push('session_too_short');
    }

    const speedAnomalies = this.detectSpeedAnomalies(logs);
    if (speedAnomalies > 0) {
      suspiciousActivity.push(`speed_anomalies:${speedAnomalies}`);
    }

    const completionRate = this.getMaxCompletionRate(logs);
    const isValid =
      completionRate >= this.COMPLETION_THRESHOLD &&
      continuousWatchTime >= requiredWatchTime - this.TOLERANCE_SECONDS &&
      suspiciousActivity.length === 0;

    return {
      isValid,
      reason: isValid
        ? 'Valid completion verified'
        : `Validation failed: ${suspiciousActivity.join(', ')}`,
      watchTime: continuousWatchTime,
      completionRate,
      suspiciousActivity,
    };
  }

  private detectJumps(logs: WatchLog[]): number {
    let jumpCount = 0;

    for (let i = 1; i < logs.length; i++) {
      const timeDelta = (logs[i].timestamp - logs[i - 1].timestamp) / 1000;
      const progressDelta = logs[i].playedSeconds - logs[i - 1].playedSeconds;

      if (progressDelta > timeDelta + 10) {
        jumpCount++;
      }
    }

    return jumpCount;
  }

  private calculateContinuousWatchTime(logs: WatchLog[]): number {
    let totalWatchTime = 0;

    for (let i = 1; i < logs.length; i++) {
      const timeDelta = (logs[i].timestamp - logs[i - 1].timestamp) / 1000;
      const progressDelta = logs[i].playedSeconds - logs[i - 1].playedSeconds;

      if (
        Math.abs(progressDelta - timeDelta) < 2 &&
        timeDelta < this.MAX_TIME_GAP_SECONDS
      ) {
        totalWatchTime += timeDelta;
      }
    }

    return totalWatchTime;
  }

  private detectSpeedAnomalies(logs: WatchLog[]): number {
    let anomalies = 0;

    for (let i = 1; i < logs.length; i++) {
      const timeDelta = (logs[i].timestamp - logs[i - 1].timestamp) / 1000;
      const progressDelta = logs[i].playedSeconds - logs[i - 1].playedSeconds;

      const speedRatio = progressDelta / timeDelta;

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
    return Math.max(...logs.map((l) => l.playedSeconds));
  }

  private getMaxCompletionRate(logs: WatchLog[]): number {
    return Math.max(...logs.map((l) => l.played));
  }
}
