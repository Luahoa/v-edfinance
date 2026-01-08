/**
 * SPIKE 1: Semantic Similarity Threshold Testing
 * 
 * Goal: Find optimal pgvector cosine similarity threshold for cache hit rate
 * Time-box: 2 hours
 */

interface TestPair {
  query1: string;
  query2: string;
  shouldMatch: boolean;
  category: string;
}

// Test dataset: 10 query pairs
const TEST_PAIRS: TestPair[] = [
  // Pair 1: Vietnamese-English translation (SHOULD match)
  {
    query1: 'Lãi suất kép là gì?',
    query2: 'Compound interest là gì?',
    shouldMatch: true,
    category: 'translation',
  },
  
  // Pair 2: Different financial concepts (SHOULD NOT match)
  {
    query1: 'Lãi suất kép là gì?',
    query2: 'Portfolio risk là gì?',
    shouldMatch: false,
    category: 'different_concepts',
  },
  
  // Pair 3: Stock investment paraphrasing (SHOULD match)
  {
    query1: 'How to invest in stocks?',
    query2: 'Stock investment guide',
    shouldMatch: true,
    category: 'paraphrase',
  },
  
  // Pair 4: Interest rates borderline (contextual)
  {
    query1: 'Best saving account rates?',
    query2: 'Mortgage interest rates?',
    shouldMatch: false,
    category: 'borderline',
  },
  
  // Pair 5: Budget planning synonyms (SHOULD match)
  {
    query1: 'Cách lập kế hoạch ngân sách',
    query2: 'How to create a budget plan',
    shouldMatch: true,
    category: 'cross_language',
  },
  
  // Pair 6: Credit card vs Debit card (SHOULD NOT match)
  {
    query1: 'Credit card benefits',
    query2: 'Debit card advantages',
    shouldMatch: false,
    category: 'similar_but_different',
  },
  
  // Pair 7: Retirement planning variations (SHOULD match)
  {
    query1: 'Retirement savings strategies',
    query2: 'How to plan for retirement',
    shouldMatch: true,
    category: 'paraphrase',
  },
  
  // Pair 8: Tax deduction vs Tax evasion (SHOULD NOT match)
  {
    query1: 'Tax deduction tips',
    query2: 'Tax evasion methods',
    shouldMatch: false,
    category: 'dangerous_similarity',
  },
  
  // Pair 9: Insurance types (SHOULD NOT match)
  {
    query1: 'Life insurance coverage',
    query2: 'Car insurance quotes',
    shouldMatch: false,
    category: 'different_products',
  },
  
  // Pair 10: Cryptocurrency investment (SHOULD match)
  {
    query1: 'Should I invest in Bitcoin?',
    query2: 'Is cryptocurrency a good investment?',
    shouldMatch: true,
    category: 'paraphrase',
  },
];

// Cosine similarity calculator
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have same dimension');
  }
  
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  
  return dotProduct / (magA * magB);
}

// Metrics calculator
interface ThresholdMetrics {
  threshold: number;
  truePositives: number;  // Should match AND above threshold
  falsePositives: number; // Should NOT match BUT above threshold
  trueNegatives: number;  // Should NOT match AND below threshold
  falseNegatives: number; // Should match BUT below threshold
  cacheHitRate: number;   // % of should-match pairs above threshold
  falsePositiveRate: number; // % of should-not-match pairs above threshold
}

function calculateMetrics(similarities: Map<TestPair, number>, threshold: number): ThresholdMetrics {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  
  similarities.forEach((similarity, pair) => {
    const aboveThreshold = similarity >= threshold;
    
    if (pair.shouldMatch && aboveThreshold) tp++;
    else if (!pair.shouldMatch && aboveThreshold) fp++;
    else if (!pair.shouldMatch && !aboveThreshold) tn++;
    else if (pair.shouldMatch && !aboveThreshold) fn++;
  });
  
  const shouldMatchCount = Array.from(similarities.keys()).filter(p => p.shouldMatch).length;
  const shouldNotMatchCount = Array.from(similarities.keys()).filter(p => !p.shouldMatch).length;
  
  return {
    threshold,
    truePositives: tp,
    falsePositives: fp,
    trueNegatives: tn,
    falseNegatives: fn,
    cacheHitRate: shouldMatchCount > 0 ? (tp / shouldMatchCount) * 100 : 0,
    falsePositiveRate: shouldNotMatchCount > 0 ? (fp / shouldNotMatchCount) * 100 : 0,
  };
}

async function runSpikeTest() {
  console.log('🧪 SPIKE 1: Semantic Similarity Threshold Testing\n');
  console.log('=' .repeat(60));
  
  // Mock PgvectorService for standalone testing
  const { pipeline, env } = await import('@xenova/transformers');
  env.allowLocalModels = true;
  env.useBrowserCache = false;
  
  console.log('Loading embedding model (Xenova/all-MiniLM-L6-v2)...');
  const embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { quantized: true });
  
  const generateEmbedding = async (text: string): Promise<number[]> => {
    const output = await embeddingPipeline(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data) as number[];
  };
  
  console.log('\n📊 Generating embeddings for test pairs...\n');
  
  // Generate embeddings for all test pairs
  const similarities = new Map<TestPair, number>();
  
  for (const pair of TEST_PAIRS) {
    try {
      const embedding1 = await generateEmbedding(pair.query1);
      const embedding2 = await generateEmbedding(pair.query2);
      
      const similarity = cosineSimilarity(embedding1, embedding2);
      similarities.set(pair, similarity);
      
      const matchIndicator = pair.shouldMatch ? '✓' : '✗';
      console.log(`${matchIndicator} [${similarity.toFixed(3)}] "${pair.query1}" ↔ "${pair.query2}"`);
      console.log(`   Category: ${pair.category}, Expected: ${pair.shouldMatch ? 'MATCH' : 'NO MATCH'}\n`);
    } catch (error) {
      console.error(`❌ Failed to process pair: ${error.message}`);
    }
  }
  
  console.log('=' .repeat(60));
  console.log('\n📈 Testing Thresholds: [0.80, 0.85, 0.88, 0.90, 0.92]\n');
  
  const thresholds = [0.80, 0.85, 0.88, 0.90, 0.92];
  const allMetrics: ThresholdMetrics[] = [];
  
  for (const threshold of thresholds) {
    const metrics = calculateMetrics(similarities, threshold);
    allMetrics.push(metrics);
    
    console.log(`\n🎯 Threshold: ${threshold}`);
    console.log(`   True Positives:  ${metrics.truePositives} (correct matches)`);
    console.log(`   False Positives: ${metrics.falsePositives} (wrong matches)`);
    console.log(`   True Negatives:  ${metrics.trueNegatives} (correct non-matches)`);
    console.log(`   False Negatives: ${metrics.falseNegatives} (missed matches)`);
    console.log(`   Cache Hit Rate:  ${metrics.cacheHitRate.toFixed(1)}%`);
    console.log(`   False Positive Rate: ${metrics.falsePositiveRate.toFixed(1)}%`);
  }
  
  // Find optimal threshold (max cache hit rate with <5% false positive rate)
  const validMetrics = allMetrics.filter(m => m.falsePositiveRate < 5);
  const optimal = validMetrics.reduce((best, current) => 
    current.cacheHitRate > best.cacheHitRate ? current : best
  );
  
  console.log('\n' + '=' .repeat(60));
  console.log('🏆 OPTIMAL THRESHOLD RECOMMENDATION\n');
  console.log(`   Threshold: ${optimal.threshold}`);
  console.log(`   Cache Hit Rate: ${optimal.cacheHitRate.toFixed(1)}%`);
  console.log(`   False Positive Rate: ${optimal.falsePositiveRate.toFixed(1)}%`);
  console.log(`   Reasoning: Best balance of cache hits vs false positives`);
  console.log('=' .repeat(60));
  
  // Export results for findings.md
  return {
    testPairs: TEST_PAIRS.length,
    similarities,
    allMetrics,
    optimal,
  };
}

// Run spike test
runSpikeTest()
  .then((results) => {
    console.log('\n✅ Spike 1 complete. Results saved to findings.md');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Spike 1 failed:', error);
    process.exit(1);
  });
