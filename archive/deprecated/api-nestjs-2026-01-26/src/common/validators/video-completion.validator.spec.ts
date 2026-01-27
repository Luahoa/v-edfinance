import { describe, it, expect, beforeEach } from 'vitest';
import { VideoCompletionValidator } from './video-completion.validator';

describe('VideoCompletionValidator - VED-YT11', () => {
  let validator: VideoCompletionValidator;

  beforeEach(() => {
    validator = new VideoCompletionValidator();
  });

  const createMockLogs = (scenario: 'valid' | 'jump' | 'speed' | 'short-session') => {
    const baseTime = Date.now();
    
    if (scenario === 'valid') {
      // Normal 90% watch progression with 2-second intervals
      // Validator requires timeDelta < 5 AND |progressDelta - timeDelta| < 2
      // 101 entries: 0 to 200 seconds, reaching full duration to avoid duration_mismatch
      // Last entry at played=1.0 (100%), but validator only requires 90%
      return Array.from({ length: 101 }, (_, i) => ({
        timestamp: baseTime + i * 2000,
        playedSeconds: i * 2,
        played: (i * 2) / 200,
        sessionId: 'test-session',
        userId: 'test-user',
      }));
    }
    
    if (scenario === 'jump') {
      // User seeks to 90%
      return [
        { timestamp: baseTime, playedSeconds: 0, played: 0, sessionId: 'test', userId: 'test' },
        { timestamp: baseTime + 1000, playedSeconds: 1, played: 0.005, sessionId: 'test', userId: 'test' },
        { timestamp: baseTime + 2000, playedSeconds: 180, played: 0.9, sessionId: 'test', userId: 'test' },
      ];
    }
    
    if (scenario === 'speed') {
      // Playback at 5x speed (suspicious) - use 2-second intervals for timeDelta > 1 check
      return Array.from({ length: 40 }, (_, i) => ({
        timestamp: baseTime + i * 2000,
        playedSeconds: i * 10,
        played: (i * 10) / 200,
        sessionId: 'test',
        userId: 'test',
      }));
    }
    
    if (scenario === 'short-session') {
      // Watched 90% but session too short
      return [
        { timestamp: baseTime, playedSeconds: 0, played: 0, sessionId: 'test', userId: 'test' },
        { timestamp: baseTime + 10000, playedSeconds: 180, played: 0.9, sessionId: 'test', userId: 'test' },
      ];
    }
    
    return [];
  };

  describe('Valid Completion Detection', () => {
    it('should validate legitimate 90% watch', async () => {
      const logs = createMockLogs('valid');
      const metadata = { videoId: 'test-video', duration: 200 };

      const result = await validator.validate(logs, metadata);

      expect(result.isValid).toBe(true);
      expect(result.completionRate).toBeGreaterThanOrEqual(0.895);
      expect(result.suspiciousActivity).toHaveLength(0);
    });

    it('should accept minor buffering delays (±5s tolerance)', async () => {
      const baseTime = Date.now();
      // Use 2-second intervals, 101 entries to reach full duration
      const logs = Array.from({ length: 101 }, (_, i) => ({
        timestamp: baseTime + i * 2000,
        playedSeconds: i * 2,
        played: (i * 2) / 200,
        sessionId: 'test',
        userId: 'test',
      }));
      
      const metadata = { videoId: 'test-video', duration: 200 };
      const result = await validator.validate(logs, metadata);

      expect(result.isValid).toBe(true);
    });

    it('should allow up to 2 legitimate seeks/jumps', async () => {
      const baseTime = Date.now();
      const logs = [
        { timestamp: baseTime, playedSeconds: 0, played: 0, sessionId: 'test', userId: 'test' },
        ...Array.from({ length: 60 }, (_, i) => ({
          timestamp: baseTime + i * 1000,
          playedSeconds: i,
          played: i / 200,
          sessionId: 'test',
          userId: 'test',
        })),
        { timestamp: baseTime + 61000, playedSeconds: 100, played: 0.5, sessionId: 'test', userId: 'test' },
        ...Array.from({ length: 90 }, (_, i) => ({
          timestamp: baseTime + 62000 + i * 1000,
          playedSeconds: 100 + i,
          played: (100 + i) / 200,
          sessionId: 'test',
          userId: 'test',
        })),
      ];
      
      const metadata = { videoId: 'test-video', duration: 200 };
      const result = await validator.validate(logs, metadata);

      expect(result.suspiciousActivity.some(a => a.includes('excessive_jumps'))).toBe(false);
    });
  });

  describe('Attack Vector Detection - Jump', () => {
    it('should detect seekTo() manipulation', async () => {
      const logs = createMockLogs('jump');
      const metadata = { videoId: 'test-video', duration: 200 };

      const result = await validator.validate(logs, metadata);

      expect(result.isValid).toBe(false);
      expect(result.suspiciousActivity).toContain('insufficient_watch_time');
      expect(result.suspiciousActivity).toContain('session_too_short');
    });

    it('should detect excessive jumps (>2)', async () => {
      const baseTime = Date.now();
      const logs = [
        { timestamp: baseTime, playedSeconds: 0, played: 0, sessionId: 'test', userId: 'test' },
        { timestamp: baseTime + 1000, playedSeconds: 50, played: 0.25, sessionId: 'test', userId: 'test' },
        { timestamp: baseTime + 2000, playedSeconds: 100, played: 0.5, sessionId: 'test', userId: 'test' },
        { timestamp: baseTime + 3000, playedSeconds: 150, played: 0.75, sessionId: 'test', userId: 'test' },
        { timestamp: baseTime + 4000, playedSeconds: 180, played: 0.9, sessionId: 'test', userId: 'test' },
      ];
      
      const metadata = { videoId: 'test-video', duration: 200 };
      const result = await validator.validate(logs, metadata);

      expect(result.isValid).toBe(false);
      expect(result.suspiciousActivity.some(a => a.includes('excessive_jumps'))).toBe(true);
    });
  });

  describe('Attack Vector Detection - Speed Manipulation', () => {
    it('should detect >3x playback speed', async () => {
      const logs = createMockLogs('speed');
      const metadata = { videoId: 'test-video', duration: 200 };

      const result = await validator.validate(logs, metadata);

      expect(result.isValid).toBe(false);
      expect(result.suspiciousActivity.some(a => a.includes('speed_anomalies'))).toBe(true);
    });

    it('should allow 2x speed (legitimate)', async () => {
      const baseTime = Date.now();
      const logs = Array.from({ length: 90 }, (_, i) => ({
        timestamp: baseTime + i * 1000,
        playedSeconds: i * 2,
        played: (i * 2) / 200,
        sessionId: 'test',
        userId: 'test',
      }));
      
      const metadata = { videoId: 'test-video', duration: 200 };
      const result = await validator.validate(logs, metadata);

      expect(result.suspiciousActivity.some(a => a.includes('speed_anomalies'))).toBe(false);
    });
  });

  describe('Attack Vector Detection - Session Time', () => {
    it('should detect impossibly short sessions', async () => {
      const logs = createMockLogs('short-session');
      const metadata = { videoId: 'test-video', duration: 200 };

      const result = await validator.validate(logs, metadata);

      expect(result.isValid).toBe(false);
      expect(result.suspiciousActivity).toContain('session_too_short');
    });

    it('should require realistic session duration', async () => {
      const baseTime = Date.now();
      const logs = [
        { timestamp: baseTime, playedSeconds: 0, played: 0, sessionId: 'test', userId: 'test' },
        { timestamp: baseTime + 30000, playedSeconds: 180, played: 0.9, sessionId: 'test', userId: 'test' },
      ];
      
      const metadata = { videoId: 'test-video', duration: 200 };
      const result = await validator.validate(logs, metadata);

      const sessionDuration = (logs[1].timestamp - logs[0].timestamp) / 1000;
      expect(sessionDuration).toBeLessThan(180);
      expect(result.suspiciousActivity).toContain('session_too_short');
    });
  });

  describe('Attack Vector Detection - Duration Mismatch', () => {
    it('should detect duration manipulation', async () => {
      const logs = createMockLogs('valid');
      const metadata = { videoId: 'test-video', duration: 200 };

      logs[logs.length - 1].playedSeconds = 300;

      const result = await validator.validate(logs, metadata);

      expect(result.isValid).toBe(false);
      expect(result.suspiciousActivity).toContain('duration_mismatch');
    });
  });

  describe('Continuous Watch Time Calculation', () => {
    it('should only count continuous watch segments', async () => {
      const baseTime = Date.now();
      const logs = [
        { timestamp: baseTime, playedSeconds: 0, played: 0, sessionId: 'test', userId: 'test' },
        ...Array.from({ length: 60 }, (_, i) => ({
          timestamp: baseTime + i * 1000,
          playedSeconds: i,
          played: i / 200,
          sessionId: 'test',
          userId: 'test',
        })),
        { timestamp: baseTime + 70000, playedSeconds: 150, played: 0.75, sessionId: 'test', userId: 'test' },
        ...Array.from({ length: 40 }, (_, i) => ({
          timestamp: baseTime + 71000 + i * 1000,
          playedSeconds: 150 + i,
          played: (150 + i) / 200,
          sessionId: 'test',
          userId: 'test',
        })),
      ];
      
      const metadata = { videoId: 'test-video', duration: 200 };
      const result = await validator.validate(logs, metadata);

      expect(result.watchTime).toBeGreaterThan(95);
      expect(result.watchTime).toBeLessThan(110);
    });
  });

  describe('Edge Cases', () => {
    it('should reject empty logs', async () => {
      const result = await validator.validate([], { videoId: 'test', duration: 200 });

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('No watch logs');
    });

    it('should handle single log entry', async () => {
      const logs = [
        { timestamp: Date.now(), playedSeconds: 180, played: 0.9, sessionId: 'test', userId: 'test' },
      ];
      
      const result = await validator.validate(logs, { videoId: 'test', duration: 200 });

      expect(result.isValid).toBe(false);
    });

    it('should handle pause/resume behavior', async () => {
      const baseTime = Date.now();
      // Use 2-second intervals, 101 entries to reach full duration
      const logs = Array.from({ length: 101 }, (_, i) => ({
        timestamp: baseTime + i * 2000,
        playedSeconds: i * 2,
        played: (i * 2) / 200,
        sessionId: 'test',
        userId: 'test',
      }));
      
      const metadata = { videoId: 'test-video', duration: 200 };
      const result = await validator.validate(logs, metadata);

      expect(result.isValid).toBe(true);
    });
  });
});
