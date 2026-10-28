import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Load .env.local if present so test can use live API key if available
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) {
  const content = readFileSync(envLocalPath, 'utf8');
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

import {
  buildProductEmbeddingText,
  type ProductForEmbedding,
} from '../lib/products/embed';
import {
  embedText,
  embedTexts,
  EMBEDDING_DIMENSIONS,
  DEFAULT_VOYAGE_MODEL,
} from '../lib/embeddings/embeddings';

describe('Product Embedding Text Builder', () => {
  it('correctly constructs text with category, metal, stones, and price tier', () => {
    const product: ProductForEmbedding = {
      name: 'Eternal Rose Diamond Ring',
      category: 'ring',
      metalType: 'rose_gold',
      metalPurity: '18k',
      stoneType: 'diamond',
      description: 'A handcrafted engagement ring featuring brilliant rose-cut diamonds.',
      shortDesc: 'Handcrafted 18k rose gold engagement ring.',
      basePriceCents: 485000,
      occasionTags: ['Engagement', 'Anniversary'],
      styleTags: ['Vintage', 'Romantic'],
      variants: [
        {
          stoneType: 'diamond',
          stoneCut: 'cushion',
          stoneCarat: '1.5',
        },
      ],
    };

    const text = buildProductEmbeddingText(product);

    assert.ok(text.includes('Eternal Rose Diamond Ring (Ring)'), 'Should format name and category');
    assert.ok(text.includes('18k Rose Gold'), 'Should map metal and purity');
    assert.ok(text.includes('1.5ct cushion diamond'), 'Should include variant stone details');
    assert.ok(text.includes('Price: around $4850'), 'Should format base price context');
    assert.ok(text.includes('Occasions: Engagement, Anniversary'), 'Should format occasions');
    assert.ok(text.includes('Style: Vintage, Romantic'), 'Should format style tags');
  });

  it('safely handles missing or null optional fields', () => {
    const product: ProductForEmbedding = {
      name: 'Minimalist Platinum Band',
      category: 'ring',
      metalType: 'platinum',
      metalPurity: '950',
      description: null,
      shortDesc: null,
      stoneType: 'none',
      basePriceCents: null,
    };

    const text = buildProductEmbeddingText(product);
    assert.ok(text.includes('Minimalist Platinum Band (Ring)'));
    assert.ok(text.includes('Material: 950 Platinum'));
    assert.ok(!text.includes('Gemstones:'), 'Should omit none stones');
    assert.ok(!text.includes('Price:'), 'Should omit null price');
  });

  it('truncates excessively long descriptions to prevent token dilution', () => {
    const longDesc = 'A'.repeat(800);
    const product: ProductForEmbedding = {
      name: 'Classic Gold Pendant',
      category: 'pendant',
      metalType: 'gold',
      metalPurity: '14k',
      description: longDesc,
    };

    const text = buildProductEmbeddingText(product);
    assert.ok(text.length < 800, 'Text should truncate long description');
    assert.ok(text.includes('...'), 'Should add ellipsis to truncated description');
  });
});

describe('Voyage AI Embeddings Client', () => {
  it('throws an informative error if embedding empty text', async () => {
    await assert.rejects(
      async () => {
        await embedText('   ');
      },
      /Cannot embed empty text/
    );
  });

  it('returns empty array when embedding empty batch', async () => {
    const results = await embedTexts([]);
    assert.deepStrictEqual(results, []);
  });

  it('verifies dimension constant matches schema requirement (1024)', () => {
    assert.strictEqual(EMBEDDING_DIMENSIONS, 1024, 'Dimension must match vector(1024)');
    assert.strictEqual(DEFAULT_VOYAGE_MODEL, 'voyage-4-lite');
  });

  // Live API test (executed when VOYAGE_API_KEY is configured in environment)
  const hasApiKey = Boolean(process.env.VOYAGE_API_KEY);
  it('successfully generates 1024-dimension embeddings via Voyage AI API', { skip: !hasApiKey }, async () => {
    try {
      const samples = [
        'Platinum engagement ring with round brilliant cut diamond',
        '18k yellow gold tennis bracelet with emerald gemstones',
      ];

      const embeddings = await embedTexts(samples, { inputType: 'document' });

      assert.strictEqual(embeddings.length, 2, 'Must return exactly 2 embeddings');
      for (let i = 0; i < embeddings.length; i++) {
        assert.strictEqual(
          embeddings[i].length,
          EMBEDDING_DIMENSIONS,
          `Item ${i} must have ${EMBEDDING_DIMENSIONS} dimensions`
        );
        assert.ok(
          typeof embeddings[i][0] === 'number' && !Number.isNaN(embeddings[i][0]),
          'Elements must be valid numbers'
        );
      }
    } catch (err: any) {
      // If Voyage AI free-tier 3 RPM quota is exhausted, note it gracefully
      if (err.message?.includes('429')) {
        console.warn('\n[Notice] Voyage AI free-tier rate limit (3 RPM) reached during test. Skipping live API call.');
        return;
      }
      throw err;
    }
  });
});

describe('Vector Cosine Similarity & Math Rules', () => {
  function cosineDistance(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    if (denom === 0) return 1;
    return 1 - dot / denom;
  }

  it('identical vectors have cosine distance 0 and similarity 1.0', () => {
    const v = [0.1, 0.5, -0.3, 0.8];
    const dist = cosineDistance(v, v);
    assert.ok(Math.abs(dist) < 1e-6, 'Distance should be 0');
    const similarity = 1 - dist;
    assert.ok(Math.abs(similarity - 1.0) < 1e-6, 'Similarity should be 1.0');
  });

  it('orthogonal vectors have cosine distance 1.0 and similarity 0.0', () => {
    const v1 = [1, 0, 0, 0];
    const v2 = [0, 1, 0, 0];
    const dist = cosineDistance(v1, v2);
    assert.strictEqual(dist, 1.0);
    assert.strictEqual(1 - dist, 0.0);
  });

  it('opposite vectors have cosine distance 2.0 and similarity -1.0', () => {
    const v1 = [1, 2, 3];
    const v2 = [-1, -2, -3];
    const dist = cosineDistance(v1, v2);
    assert.ok(Math.abs(dist - 2.0) < 1e-6);
    assert.ok(Math.abs((1 - dist) - (-1.0)) < 1e-6);
  });
});
