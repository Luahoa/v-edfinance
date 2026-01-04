import { Test } from '@nestjs/testing';
import { RagAdapterService } from '../src/ai/rag-adapter.service';
import { DatabaseModule } from '../src/database/database.module';

describe('RagAdapter E2E', () => {
  let service: RagAdapterService;
  
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [RagAdapterService],
    }).compile();
    
    service = module.get(RagAdapterService);
  });
  
  it('should retrieve real documents from DB', async () => {
    const context = await service.getRelevantContext('compound interest', {
      threshold: 0.7,
      limit: 5,
    });
    
    console.log(`Retrieved ${context.sources.length} sources in ${context.retrievalTimeMs}ms`);
    
    expect(context.retrievalTimeMs).toBeLessThan(200);
  });
});
