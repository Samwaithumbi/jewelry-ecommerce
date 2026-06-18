import { ProductForm } from "@/components/product-form";
import { db } from "@/lib/db";
import { products, productImages } from "@/drizzle/src/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

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

  const initialData = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description || "",
    metalType: product.metalType,
    metalPurity: product.metalPurity,
    basePriceCents: product.basePriceCents,
    weightGrams: parseFloat(product.weightGrams as string),
    category: product.category,
    imageUrl: imageUrl || "",
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto p-6">
      <div>
        <h1 className="text-3xl font-serif text-slate-900 tracking-tight">Edit Product</h1>
        <p className="text-slate-500 mt-1">Update product details.</p>
      </div>
      <ProductForm initialData={initialData} />
    </div>
  );
}
