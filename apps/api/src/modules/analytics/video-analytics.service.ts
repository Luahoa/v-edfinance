import { Injectable, Logger } from '@nestjs/common';
import { Counter, Histogram, Registry } from 'prom-client';

export interface VideoMetrics {
  videoKey: string;
  views: number;
  completionRate: number;
  avgWatchTime: number;
  bufferingEvents: number;
  qualitySwitches: number;
  errors: number;
}

export interface VideoAnalyticsSummary {
  totalViews: number;
  totalVideos: number;
  avgCompletionRate: number;
  avgBufferTime: number;
  topVideos: Array<{ videoKey: string; views: number }>;
  errorRate: number;
}

@Injectable()
export class VideoAnalyticsService {
  private readonly logger = new Logger(VideoAnalyticsService.name);
  private readonly registry: Registry;

  private videoViews: Counter<string>;
  private bufferingEvents: Counter<string>;
  private qualitySwitches: Counter<string>;
  private videoErrors: Counter<string>;
  private watchTime: Histogram<string>;
  private bufferTime: Histogram<string>;

  private analyticsData = new Map<string, VideoMetrics>();

  constructor() {
    this.registry = new Registry();

    this.videoViews = new Counter({
      name: 'video_views_total',
      help: 'Total number of video views',
      labelNames: ['video_key'],
      registers: [this.registry],
    });

    this.bufferingEvents = new Counter({
      name: 'video_buffering_events_total',
      help: 'Total buffering events',
      labelNames: ['video_key'],
      registers: [this.registry],
    });

    this.qualitySwitches = new Counter({
      name: 'video_quality_switches_total',
      help: 'Total quality switches',
      labelNames: ['video_key'],
      registers: [this.registry],
    });

    this.videoErrors = new Counter({
      name: 'video_errors_total',
      help: 'Total video playback errors',
      labelNames: ['video_key', 'error_type'],
      registers: [this.registry],
    });

    this.watchTime = new Histogram({
      name: 'video_watch_duration_seconds',
      help: 'Video watch duration in seconds',
      labelNames: ['video_key'],
      buckets: [10, 30, 60, 120, 300, 600, 1800, 3600],
      registers: [this.registry],
    });

    this.bufferTime = new Histogram({
      name: 'video_buffer_duration_milliseconds',
      help: 'Video buffering duration in milliseconds',
      labelNames: ['video_key'],
      buckets: [100, 500, 1000, 2000, 5000, 10000],
      registers: [this.registry],
    });

    this.logger.log('Video Analytics Service initialized with Prometheus metrics');
  }

  trackVideoView(videoKey: string): void {
    this.videoViews.inc({ video_key: videoKey });
    this.updateAnalytics(videoKey, { views: 1 });
    this.logger.debug(`Video view tracked: ${videoKey}`);
  }

  trackBufferingEvent(videoKey: string, durationMs: number): void {
    this.bufferingEvents.inc({ video_key: videoKey });
    this.bufferTime.observe({ video_key: videoKey }, durationMs);
    this.updateAnalytics(videoKey, { bufferingEvents: 1 });
    this.logger.debug(`Buffering event: ${videoKey} (${durationMs}ms)`);
  }

  trackQualitySwitch(videoKey: string, fromQuality: string, toQuality: string): void {
    this.qualitySwitches.inc({ video_key: videoKey });
    this.updateAnalytics(videoKey, { qualitySwitches: 1 });
    this.logger.debug(`Quality switch: ${videoKey} (${fromQuality} → ${toQuality})`);
  }

  trackWatchTime(videoKey: string, durationSeconds: number, videoDuration: number): void {
    this.watchTime.observe({ video_key: videoKey }, durationSeconds);
    const completionRate = videoDuration > 0 ? durationSeconds / videoDuration : 0;
    this.updateAnalytics(videoKey, {
      avgWatchTime: durationSeconds,
      completionRate,
    });
    this.logger.debug(`Watch time: ${videoKey} (${durationSeconds}s / ${videoDuration}s)`);
  }

  trackError(videoKey: string, errorType: string): void {
    this.videoErrors.inc({ video_key: videoKey, error_type: errorType });
    this.updateAnalytics(videoKey, { errors: 1 });
    this.logger.warn(`Video error: ${videoKey} - ${errorType}`);
  }

  private updateAnalytics(videoKey: string, updates: Partial<VideoMetrics>): void {
    const current = this.analyticsData.get(videoKey) || {
      videoKey,
      views: 0,
      completionRate: 0,
      avgWatchTime: 0,
      bufferingEvents: 0,
      qualitySwitches: 0,
      errors: 0,
    };

    this.analyticsData.set(videoKey, {
      ...current,
      views: current.views + (updates.views || 0),
      bufferingEvents: current.bufferingEvents + (updates.bufferingEvents || 0),
      qualitySwitches: current.qualitySwitches + (updates.qualitySwitches || 0),
      errors: current.errors + (updates.errors || 0),
      avgWatchTime: updates.avgWatchTime !== undefined ? updates.avgWatchTime : current.avgWatchTime,
      completionRate: updates.completionRate !== undefined ? updates.completionRate : current.completionRate,
    });
  }

  getVideoMetrics(videoKey: string): VideoMetrics | null {
    return this.analyticsData.get(videoKey) || null;
  }

  getSummary(): VideoAnalyticsSummary {
    const metrics = Array.from(this.analyticsData.values());

    const totalViews = metrics.reduce((sum, m) => sum + m.views, 0);
    const totalVideos = metrics.length;
    const avgCompletionRate =
      metrics.reduce((sum, m) => sum + m.completionRate, 0) / (totalVideos || 1);
    const avgBufferTime =
      metrics.reduce((sum, m) => sum + m.bufferingEvents, 0) / (totalViews || 1);
    const totalErrors = metrics.reduce((sum, m) => sum + m.errors, 0);
    const errorRate = totalViews > 0 ? totalErrors / totalViews : 0;

    const topVideos = metrics
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)
      .map((m) => ({ videoKey: m.videoKey, views: m.views }));

    return {
      totalViews,
      totalVideos,
      avgCompletionRate,
      avgBufferTime,
      topVideos,
      errorRate,
    };
  }

  async getPrometheusMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getRegistry(): Registry {
    return this.registry;
  }
}
