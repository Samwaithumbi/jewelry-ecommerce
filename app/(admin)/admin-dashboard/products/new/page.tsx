import { ProductForm } from "@/components/product-form";

export default function NewProductPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto p-6">
      <div>
        <h1 className="text-3xl font-serif text-slate-900 tracking-tight">Add New Product</h1>
        <p className="text-slate-500 mt-1">Create a new product in the catalog.</p>
      </div>
      <ProductForm />
    </div>
  );
}
