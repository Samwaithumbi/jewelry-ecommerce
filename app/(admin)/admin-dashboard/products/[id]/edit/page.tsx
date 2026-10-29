import { ProductForm } from "@/components/products/product-form";
import { db } from "@/lib/db";
import { products, productImages, productVariants } from "@/drizzle/src/db/schema";
import { inventoryLevels, inventoryLocations } from "@/drizzle/src/db/inventory-schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const dbProduct = await db
    .select({
      product: products,
      imageUrl: productImages.url,
    })
    .from(products)
    .leftJoin(productImages, eq(products.id, productImages.productId))
    .where(eq(products.id, id))
    .limit(1);

  if (!dbProduct.length) {
    notFound();
  }

  const { product, imageUrl } = dbProduct[0];

  // Fetch the primary variant for this product from DB
  const variant = await db.query.productVariants.findFirst({
    where: eq(productVariants.productId, id),
  });

  // Fetch inventory levels and location for this variant
  let inventoryLevel: any = null;
  let location: any = null;

  if (variant) {
    inventoryLevel = await db.query.inventoryLevels.findFirst({
      where: eq(inventoryLevels.variantId, variant.id),
    });

    if (inventoryLevel) {
      location = await db.query.inventoryLocations.findFirst({
        where: eq(inventoryLocations.id, inventoryLevel.locationId),
      });
    }
  }

  const initialData = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description || "",
    metalType: product.metalType,
    metalPurity: product.metalPurity,
    basePriceCents: Math.round(product.basePriceCents / 100),
    weightGrams: parseFloat(product.weightGrams as string),
    category: product.category,
    imageUrl: imageUrl || "",
    // Variant fields from DB
    sku: variant?.sku || "",
    size: variant?.size || "",
    priceAdjustCents: variant?.priceAdjustCents ? Math.round(variant.priceAdjustCents / 100) : 0,
    // Inventory fields from DB
    location: location?.code || "MAIN",
    initialStock: inventoryLevel?.onHand ?? 0,
    reorderPoint: inventoryLevel?.reorderPoint ?? 3,
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto p-6">
      <div>
        <h1 className="text-3xl font-serif text-slate-900 tracking-tight">Edit Product</h1>
        <p className="text-slate-500 mt-1">Update product details and variant inventory.</p>
      </div>
      <ProductForm initialData={initialData} />
    </div>
  );
}
