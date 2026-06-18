import { config } from "dotenv";
config({ path: ".env" }); // Or ".env.local" depending on your setup

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { products, productVariants, productImages } from './schema'; // adjust path if needed

import { sql } from 'drizzle-orm';

// Database connection – assumes you have a .env with DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db = drizzle(pool);

// Helper to generate slug from name
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Enums (should match your schema)
const metalTypes = ['gold', 'silver', 'platinum', 'rose_gold'] as const;
const metalPurities = ['9k', '14k', '18k', '24k', '925', '950'] as const;
const categories = ['ring', 'necklace', 'bracelet', 'earring', 'pendant', 'bangle', 'set'] as const;
const occasionTags = ['wedding', 'anniversary', 'birthday', 'vday', 'mothers_day', 'graduation'];
const styleTags = ['classic', 'modern', 'vintage', 'minimalist', 'luxury', 'bohemian'];
const sizeSystems = ['US', 'EU', 'UK'] as const;
const stoneTypes = ['diamond', 'ruby', 'sapphire', 'emerald', 'amethyst', 'pearl', 'moissanite', 'opal', 'none'] as const;
const stoneCuts = ['round', 'princess', 'emerald', 'cushion', 'marquise', 'pear', 'oval', 'heart'] as const;
const stoneColors = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'] as const;
const stoneClarities = ['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3'] as const;

// Pre‑defined Unsplash image URLs (jewelry‐related)
const unsplashImages = [
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1589571894960-20bbe2828d8a?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1589571894960-20bbe2828d8a?w=600&h=600&fit=crop',
];

// Generate 10 realistic products
async function seed() {
  console.log('🌱 Seeding products...');

  try {
    // Use a transaction to ensure all or nothing
    await db.transaction(async (tx) => {
      for (let i = 0; i < 10; i++) {
        // Randomly pick attributes
        const metalType = metalTypes[Math.floor(Math.random() * metalTypes.length)];
        const metalPurity = metalPurities[Math.floor(Math.random() * metalPurities.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const occasions = occasionTags
          .sort(() => 0.5 - Math.random())
          .slice(0, 2 + Math.floor(Math.random() * 2));
        const styles = styleTags
          .sort(() => 0.5 - Math.random())
          .slice(0, 2 + Math.floor(Math.random() * 2));

        // Product name – realistic variation
        const productNames = [
          'Elegant Gold Ring',
          'Diamond Pendant Necklace',
          'Silver Bracelet with Sapphire',
          'Platinum Wedding Band',
          'Rose Gold Hoop Earrings',
          'Vintage Emerald Pendant',
          'Minimalist Gold Chain',
          'Pearl Stud Earrings',
          'Ruby Solitaire Ring',
          'Luxury Diamond Watch',
        ];
        const name = productNames[i % productNames.length];
        const slug = slugify(name) + '-' + Date.now() + '-' + i; // ensure uniqueness

        // Base price in cents (random between 5000 and 50000 cents = $50-$500)
        const basePriceCents = Math.floor(Math.random() * 45000) + 5000;
        const weightGrams = (Math.random() * 10 + 1).toFixed(3);
        const ratingAvg = (Math.random() * 2 + 3).toFixed(2); // 3.00-5.00
        const reviewCount = Math.floor(Math.random() * 100);
        const viewCount = Math.floor(Math.random() * 1000);
        const featured = Math.random() > 0.7;
        const vipOnly = Math.random() > 0.9;
        const active = true;

        const productData = {
          name,
          slug,
          description: `A beautiful ${metalType} ${category} with exquisite craftsmanship.`,
          shortDesc: `${metalType} ${category} – perfect for any occasion.`,
          metalType,
          metalPurity,
          basePriceCents,
          weightGrams,
          category,
          occasionTags: occasions,
          styleTags: styles,
          active,
          featured,
          vipOnly,
          ratingAvg,
          reviewCount,
          viewCount,
          vendorId: null, // or you could set a vendor if you have vendors table
          // embedding can be left null; we'll ignore it
        };

        // Insert product and get the generated id
        const [insertedProduct] = await tx
          .insert(products)
          .values(productData)
          .returning({ id: products.id });

        if (!insertedProduct) throw new Error('Failed to insert product');

        const productId = insertedProduct.id;

        // ---- Product Variants ----
        const numVariants = 1 + Math.floor(Math.random() * 3); // 1 to 3 variants
        for (let v = 0; v < numVariants; v++) {
          const size = ['6', '7', '8', '9', '10', 'S', 'M', 'L', 'XL'][Math.floor(Math.random() * 9)];
          const sizeSystem = sizeSystems[Math.floor(Math.random() * sizeSystems.length)];
          const stoneType = stoneTypes[Math.floor(Math.random() * stoneTypes.length)];
          const stoneCarat = stoneType !== 'none' ? (Math.random() * 2 + 0.5).toFixed(3) : null;
          const stoneCut = stoneType !== 'none' ? stoneCuts[Math.floor(Math.random() * stoneCuts.length)] : null;
          const stoneColor = stoneType !== 'none' ? stoneColors[Math.floor(Math.random() * stoneColors.length)] : null;
          const stoneClarity = stoneType !== 'none' ? stoneClarities[Math.floor(Math.random() * stoneClarities.length)] : null;
          const stockQty = Math.floor(Math.random() * 50) + 5;
          const lowStockThreshold = Math.floor(Math.random() * 5) + 2;
          const priceAdjustCents = Math.floor((Math.random() - 0.5) * 2000); // -1000 to +1000 cents

          const variantData = {
            productId,
            sku: `SKU-${productId.slice(0, 8)}-${v + 1}`,
            size,
            sizeSystem,
            stoneType,
            stoneCarat,
            stoneCut,
            stoneColor,
            stoneClarity,
            stockQty,
            lowStockThreshold,
            priceAdjustCents,
            active: true,
          };

          await tx.insert(productVariants).values(variantData);
        }

        // ---- Product Images ----
        // Pick up to 3 random images from the list, ensuring at least one primary
        const numImages = 1 + Math.floor(Math.random() * 3);
        // Shuffle the image list and take first numImages
        const shuffledImages = [...unsplashImages].sort(() => 0.5 - Math.random());
        const selectedImages = shuffledImages.slice(0, numImages);

        for (let imgIndex = 0; imgIndex < selectedImages.length; imgIndex++) {
          const imageData = {
            productId,
            url: selectedImages[imgIndex],
            position: imgIndex,
            isPrimary: imgIndex === 0, // first image is primary
            is360: false,
            angleDeg: imgIndex > 0 ? imgIndex * 30 : null, // some angle for additional images
            altText: `${name} - view ${imgIndex + 1}`,
          };
          await tx.insert(productImages).values(imageData);
        }

        console.log(`✅ Inserted product: ${name} (${productId}) with ${numVariants} variants and ${numImages} images`);
      }
    });

    console.log('🌱 Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the seed
seed().catch(console.error);