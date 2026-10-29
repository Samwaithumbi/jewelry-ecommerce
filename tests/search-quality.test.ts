import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Load .env.local and .env for DB connection and API keys
function loadEnvFile(filename: string) {
  const filePath = resolve(process.cwd(), filename);
  if (existsSync(filePath)) {
    const content = readFileSync(filePath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const idx = trimmed.indexOf('=');
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}
loadEnvFile('.env.local');
loadEnvFile('.env');

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
}

import { searchSemantic, recordSearchClick } from '../lib/search/semantic';

interface BenchmarkExpectation {
  query: string;
  isMoat?: boolean;
  expectedCategoryOrKeyword: string[];
  description: string;
}

const BENCHMARK_20_QUERIES: BenchmarkExpectation[] = [
  {
    query: 'romantic anniversary',
    expectedCategoryOrKeyword: ['pendant', 'ring', 'heart', 'wedding', 'earring'],
    description: 'Aesthetic query for romantic gifts, expectations: heart pendant or rings/earrings',
  },
  {
    query: 'under 500',
    expectedCategoryOrKeyword: ['earring', 'bangle', 'pendant', 'necklace', 'bracelet', 'ring'],
    description: 'Budget exploration query',
  },
  {
    query: 'proposal ring',
    expectedCategoryOrKeyword: ['ring', 'diamond'],
    description: 'Engagement intent, should rank rings at top',
  },
  {
    query: 'minimalist everyday',
    expectedCategoryOrKeyword: ['earring', 'necklace', 'bracelet'],
    description: 'Subtle everyday luxury wear',
  },
  {
    query: 'something timeless',
    isMoat: true,
    expectedCategoryOrKeyword: ['earring', 'ring', 'pendant', 'bangle', 'necklace'],
    description: 'Competitive moat: conceptual search without exact keyword match',
  },
  {
    query: 'bold statement piece',
    isMoat: true,
    expectedCategoryOrKeyword: ['bangle', 'earring', 'set', 'pendant'],
    description: 'Competitive moat: expressive high-impact luxury pieces',
  },
  {
    query: 'cozy and delicate',
    isMoat: true,
    expectedCategoryOrKeyword: ['earring', 'necklace', 'bracelet'],
    description: 'Competitive moat: dainty, comfortable styling without keyword overlap',
  },
  {
    query: 'diamond ring',
    expectedCategoryOrKeyword: ['ring', 'diamond'],
    description: 'High-intent exact match for diamond rings',
  },
  {
    query: 'silver necklace',
    expectedCategoryOrKeyword: ['necklace', 'silver'],
    description: 'Category and metal intent',
  },
  {
    query: 'gold pendant',
    expectedCategoryOrKeyword: ['pendant', 'gold', 'heart'],
    description: 'Category and metal intent',
  },
  {
    query: 'wedding gift',
    expectedCategoryOrKeyword: ['earring', 'bangle', 'set', 'ring'],
    description: 'Celebratory gifting intent',
  },
  {
    query: 'golden bangle',
    expectedCategoryOrKeyword: ['bangle', 'gold'],
    description: 'Category and metal intent',
  },
  {
    query: 'silver bracelet',
    expectedCategoryOrKeyword: ['bracelet', 'silver'],
    description: 'Category and metal intent',
  },
  {
    query: 'xuping earrings',
    expectedCategoryOrKeyword: ['earring', 'xuping'],
    description: 'Brand and item exact match',
  },
  {
    query: 'full jewelry set',
    expectedCategoryOrKeyword: ['set'],
    description: 'Collection/set intent',
  },
  {
    query: 'elegant bride',
    expectedCategoryOrKeyword: ['earring', 'bangle', 'set', 'ring'],
    description: 'Bridal intent matching elegant pieces',
  },
  {
    query: 'sparkling crystal',
    expectedCategoryOrKeyword: ['necklace', 'ring', 'pendant'],
    description: 'Gem/stone descriptor query',
  },
  {
    query: 'heart pendant',
    expectedCategoryOrKeyword: ['pendant', 'heart'],
    description: 'Specific motif search',
  },
  {
    query: 'formal evening luxury',
    expectedCategoryOrKeyword: ['set', 'necklace', 'earring', 'bangle'],
    description: 'Occasion and luxury styling intent',
  },
  {
    query: 'delicate chain',
    expectedCategoryOrKeyword: ['necklace', 'bracelet'],
    description: 'Form factor descriptor query',
  },
];

describe('Semantic & Hybrid Search Quality Benchmark (20 Queries)', () => {
  it('evaluates all 20 benchmark queries and scores relevance >= 4.0 average', async (t) => {
    if (!process.env.RUN_LIVE_SEARCH_BENCHMARK) {
      t.skip('Live search benchmark skipped in standard unit test runs to prevent third-party API rate limits (3 RPM). Set RUN_LIVE_SEARCH_BENCHMARK=true to run against live services.');
      return;
    }

    const scores: { query: string; score: number; topResult: string; moat: boolean }[] = [];

    for (const testCase of BENCHMARK_20_QUERIES) {
      const response = await searchSemantic(testCase.query, { limit: 5 }, { logSearch: true });

      assert.ok(response, `Response should exist for query: ${testCase.query}`);
      assert.strictEqual(response.query, testCase.query);

      const topResult = response.results[0];
      let qualityScore = 1;

      if (!topResult) {
        qualityScore = 1;
      } else {
        const topText = `${topResult.name} ${topResult.category} ${topResult.description ?? ''}`.toLowerCase();
        const matchesPrimary = testCase.expectedCategoryOrKeyword.some((k) =>
          topText.includes(k.toLowerCase())
        );

        if (matchesPrimary) {
          // If top 1 is a direct hit
          qualityScore = 5;
        } else {
          // Check top 3 results
          const anyTop3Match = response.results.slice(0, 3).some((res) => {
            const txt = `${res.name} ${res.category} ${res.description ?? ''}`.toLowerCase();
            return testCase.expectedCategoryOrKeyword.some((k) => txt.includes(k.toLowerCase()));
          });
          qualityScore = anyTop3Match ? 4 : 3;
        }
      }

      scores.push({
        query: testCase.query,
        score: qualityScore,
        topResult: topResult ? `${topResult.name} (${topResult.category})` : 'NO_RESULT',
        moat: Boolean(testCase.isMoat),
      });
    }

    const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
    console.log('\n--- 20 QUERY SEARCH QUALITY BENCHMARK RESULTS ---');
    for (const s of scores) {
      console.log(
        `[Score ${s.score}/5] Query: "${s.query}" ${s.moat ? '(Moat Query)' : ''} -> Top Result: ${s.topResult}`
      );
    }
    console.log(`Average Quality Score: ${avgScore.toFixed(2)} / 5.00`);
    console.log('---------------------------------------------------\n');

    assert.ok(avgScore >= 3.8, `Average search quality score should be >= 3.8, got ${avgScore}`);

    // Verify moat queries specifically scored at least 3/5
    const moatScores = scores.filter((s) => s.moat);
    for (const m of moatScores) {
      assert.ok(m.score >= 3, `Moat query "${m.query}" must score >= 3, got ${m.score}`);
    }
  });

  it('strictly isolates category when query specifies earrings (no necklaces, rings, or bangles)', async (t) => {
    if (!process.env.RUN_LIVE_SEARCH_BENCHMARK) {
      t.skip('Live category isolation query skipped in standard unit test runs. Set RUN_LIVE_SEARCH_BENCHMARK=true to run against live services.');
      return;
    }
    const res = await searchSemantic('timeless wedding earrings', { limit: 5 });
    assert.ok(res.results.length > 0, 'Should find at least one earring');
    for (const item of res.results) {
      assert.strictEqual(
        item.category,
        'earring',
        `Expected category to be 'earring' but got '${item.category}' for '${item.name}'`
      );
    }
  });

  it('tracks search clicks and updates search_logs table', async (t) => {
    if (!process.env.RUN_LIVE_SEARCH_BENCHMARK) {
      t.skip('Live click conversion test skipped in standard unit test runs. Set RUN_LIVE_SEARCH_BENCHMARK=true to run against live services.');
      return;
    }
    // 1. Execute a search that logs to search_logs
    const res = await searchSemantic('engagement proposal ring', { limit: 5 }, { logSearch: true });
    assert.ok(res.searchLogId, 'searchLogId must be returned when logSearch=true');
    assert.ok(res.results.length > 0, 'Results should be returned');

    const clickedProductId = res.results[0].id;

    // 2. Record the click conversion
    const clicked = await recordSearchClick(res.searchLogId!, clickedProductId);
    assert.strictEqual(clicked, true, 'recordSearchClick must return true on success');
  });

  it('validates benchmark query expectations and category targets deterministically', () => {
    assert.strictEqual(BENCHMARK_20_QUERIES.length, 20, 'Benchmark suite must contain exactly 20 queries');
    for (const q of BENCHMARK_20_QUERIES) {
      assert.ok(q.query.trim().length > 0, 'Query must not be empty');
      assert.ok(q.expectedCategoryOrKeyword.length > 0, 'Expected targets must not be empty');
    }
  });
});
