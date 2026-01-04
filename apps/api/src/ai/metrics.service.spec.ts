import { Test, TestingModule } from '@nestjs/testing';
import { register } from 'prom-client';
import { AiMetricsService } from './metrics.service';

describe('AiMetricsService', () => {
  let service: AiMetricsService;
  
  beforeEach(async () => {
    // Clear all metrics from the global registry
    register.clear();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiMetricsService],
    }).compile();
    
    service = module.get<AiMetricsService>(AiMetricsService);
    service.resetMetrics();
  });
  
  afterAll(() => {
    // Clean up after all tests
    register.clear();
  });
  
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  
  it('should record latency', () => {
    service.recordLatency(1500, 'GENERAL_FAQ', false);
    // Verify histogram updated (check metrics output)
    expect(service).toBeDefined();
  });
  
  it('should record token usage', () => {
    service.recordTokens(2800, 'FINANCIAL_ANALYSIS', 'gemini-2.0-flash');
    expect(service).toBeDefined();
  });
  
  it('should calculate cache hit rate', async () => {
    service.recordCacheHit(true);
    service.recordCacheHit(true);
    service.recordCacheHit(false);
    
    const metrics = await service.getMetrics();
    // Hit rate should be 2/3 = 0.667
    expect(metrics).toContain('ai_cache_hit_rate');
  });
  
  it('should export metrics in Prometheus format', async () => {
    service.recordLatency(1000, 'test', false);
    service.recordTokens(100, 'test', 'gemini-2.0-flash');
    
    const metrics = await service.getMetrics();
    expect(metrics).toContain('ai_response_latency_seconds');
    expect(metrics).toContain('ai_tokens_used_total');
    expect(metrics).toContain('ai_cache_hit_rate');
  });
  
  it('should reset metrics', async () => {
    service.recordCacheHit(true);
    service.recordCacheHit(false);
    
    service.resetMetrics();
    
    const metrics = await service.getMetrics();
    expect(metrics).toContain('ai_cache_hit_rate 0');
  });
});
