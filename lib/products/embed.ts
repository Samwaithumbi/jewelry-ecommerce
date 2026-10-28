/**
 * lib/products/embed.ts
 * Generates high-signal textual representation of jewelry products for vector embeddings.
 */

export interface ProductVariantForEmbedding {
  stoneType?: string | null;
  stoneCarat?: string | number | null;
  stoneCut?: string | null;
  stoneColor?: string | null;
  stoneClarity?: string | null;
  size?: string | null;
}

export interface ProductForEmbedding {
  id?: string;
  name: string;
  category?: string | null;
  description?: string | null;
  shortDesc?: string | null;
  metalType?: string | null;
  metalPurity?: string | null;
  stoneType?: string | null;
  basePriceCents?: number | null;
  weightGrams?: string | number | null;
  occasionTags?: string[] | null;
  occasions?: string[] | null; // backward compatibility
  styleTags?: string[] | null;
  variants?: ProductVariantForEmbedding[] | null;
}

const CATEGORY_NAMES: Record<string, string> = {
  ring: "Ring",
  necklace: "Necklace",
  bracelet: "Bracelet",
  earring: "Earring",
  pendant: "Pendant",
  bangle: "Bangle",
  set: "Jewelry Set",
};

const METAL_NAMES: Record<string, string> = {
  gold: "Yellow Gold",
  white_gold: "White Gold",
  rose_gold: "Rose Gold",
  silver: "Sterling Silver",
  platinum: "Platinum",
};

/**
 * Strips HTML tags, trims whitespace, and replaces extra whitespace with single spaces.
 */
function cleanText(text: string | null | undefined): string | null {
  if (!text) return null;
  const stripped = text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length > 0 ? stripped : null;
}

/**
 * Builds a dense, natural-language string representing a jewelry product.
 * Formatted to maximize semantic relevance for customer search intent.
 */
export function buildProductEmbeddingText(product: ProductForEmbedding): string {
  const parts: string[] = [];

  // 1. Title & Primary Category
  const categoryLabel = product.category
    ? CATEGORY_NAMES[product.category.toLowerCase()] || product.category
    : null;

  if (categoryLabel) {
    parts.push(`Product: ${product.name} (${categoryLabel})`);
  } else {
    parts.push(`Product: ${product.name}`);
  }

  // 2. Metal & Materials
  const metalPurity = cleanText(product.metalPurity);
  const metalName = product.metalType
    ? METAL_NAMES[product.metalType.toLowerCase()] || product.metalType
    : null;

  if (metalPurity && metalName) {
    parts.push(`Material: ${metalPurity} ${metalName}`);
  } else if (metalName) {
    parts.push(`Material: ${metalName}`);
  }

  // 3. Gemstone details (from product or variants)
  const stones = new Set<string>();
  if (product.stoneType && product.stoneType.toLowerCase() !== "none") {
    stones.add(product.stoneType);
  }

  if (product.variants && product.variants.length > 0) {
    for (const v of product.variants) {
      if (v.stoneType && v.stoneType.toLowerCase() !== "none") {
        const stoneDetail = [
          v.stoneCarat ? `${v.stoneCarat}ct` : null,
          v.stoneCut,
          v.stoneType,
        ]
          .filter(Boolean)
          .join(" ");
        if (stoneDetail) stones.add(stoneDetail);
      }
    }
  }

  if (stones.size > 0) {
    parts.push(`Gemstones: ${Array.from(stones).join(", ")}`);
  }

  // 4. Descriptions (shortDesc + description)
  const shortDesc = cleanText(product.shortDesc);
  if (shortDesc) {
    parts.push(shortDesc);
  }

  const desc = cleanText(product.description);
  if (desc && desc !== shortDesc) {
    // Truncate long descriptions to avoid exceeding embedding window or diluting keywords
    const truncatedDesc = desc.length > 500 ? desc.slice(0, 500) + "..." : desc;
    parts.push(truncatedDesc);
  }

  // 5. Price tier context
  if (typeof product.basePriceCents === "number" && product.basePriceCents > 0) {
    const usd = (product.basePriceCents / 100).toFixed(0);
    parts.push(`Price: around $${usd}`);
  }

  // 6. Occasions & Style tags
  const occasions = product.occasionTags || product.occasions;
  if (occasions && occasions.length > 0) {
    parts.push(`Occasions: ${occasions.join(", ")}`);
  }

  if (product.styleTags && product.styleTags.length > 0) {
    parts.push(`Style: ${product.styleTags.join(", ")}`);
  }

  return parts.filter(Boolean).join(". ");
}
