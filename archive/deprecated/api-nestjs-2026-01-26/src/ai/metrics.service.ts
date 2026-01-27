import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge, register } from 'prom-client';

@Injectable()
export class AiMetricsService {
  // Latency histogram
  private readonly latencyHistogram: Histogram<string>;
  
  // Token usage counter
  private readonly tokenCounter: Counter<string>;
  
  // Cache hit rate gauge
  private readonly cacheHitGauge: Gauge<string>;
  
  // Cache metrics for rolling average
  private cacheHits = 0;
  private cacheMisses = 0;
  
  constructor() {
    // Response latency (P50, P95, P99)
    this.latencyHistogram = new Histogram({
      name: 'ai_response_latency_seconds',
      help: 'AI response time in seconds',
      labelNames: ['intent', 'cached'],
      buckets: [0.5, 1, 2, 3, 5, 10, 30], // seconds
    });
    
    // Token usage
    this.tokenCounter = new Counter({
      name: 'ai_tokens_used_total',
      help: 'Total tokens consumed by AI requests',
      labelNames: ['intent', 'model'],
    });
    
    // Cache hit rate
    this.cacheHitGauge = new Gauge({
      name: 'ai_cache_hit_rate',
      help: 'Percentage of cache hits (0-1)',
    });
  }
  
  /**
   * Record AI request latency
   * @param durationMs Duration in milliseconds
   * @param intent Query intent type
   * @param cached Whether response was from cache
   */
  recordLatency(durationMs: number, intent: string = 'unknown', cached: boolean = false): void {
    this.latencyHistogram.observe(
      { intent, cached: cached ? 'true' : 'false' },
      durationMs / 1000 // convert to seconds
    );
  }
  
  /**
   * Record token usage
   * @param count Number of tokens used
   * @param intent Query intent type
   * @param model Model name (e.g., 'gemini-2.0-flash')
   */
  recordTokens(count: number, intent: string = 'unknown', model: string = 'gemini-2.0-flash'): void {
    this.tokenCounter.inc({ intent, model }, count);
  }
  
  /**
   * Record cache hit/miss
   * @param hit True if cache hit, false if miss
   */
  recordCacheHit(hit: boolean): void {
    if (hit) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }
    
    // Update gauge with rolling average
    const total = this.cacheHits + this.cacheMisses;
    const hitRate = total > 0 ? this.cacheHits / total : 0;
    this.cacheHitGauge.set(hitRate);
  }
  
  /**
   * Get current metrics (for baseline reporting)
   */
  async getMetrics(): Promise<string> {
    return register.metrics();
  }
  
  /**
   * Reset metrics (for testing)
   */
  resetMetrics(): void {
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.cacheHitGauge.set(0);
  }
}
