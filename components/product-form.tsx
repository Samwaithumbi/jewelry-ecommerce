"use client";

import { useForm, Controller } from "react-hook-form";
import { createProduct, updateProduct } from "@/app/actions/product";
import { productSchema, ProductFormValues } from "@/lib/validations";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { ImageUpload } from "./image-upload";
import { Label } from "./ui/label";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface ProductFormProps {
  initialData?: (ProductFormValues & { id: string }) | null;
}

const myZodResolver = async (values: any) => {
  const result = productSchema.safeParse(values);
  if (result.success) {
    return { values: result.data, errors: {} };
  } else {
    return {
      values: {},
      errors: result.error.issues.reduce((acc: any, error: any) => {
        if (!acc[error.path[0]]) {
          acc[error.path[0]] = {
            type: error.code,
            message: error.message,
          };
        }
        return acc;
      }, {}),
    };
  }
};

export function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: myZodResolver,
    defaultValues: initialData || {
      name: "",
      slug: "",
      description: "",
      metalType: "gold",
      metalPurity: "18k",
      basePriceCents: 0,
      weightGrams: 0,
      category: "ring",
      imageUrl: "",
    },
  });

  const onSubmit = (data: any) => {
    startTransition(async () => {
      try {
        if (initialData) {
          await updateProduct(initialData.id, data);
        } else {
          await createProduct(data);
        }
        router.push("/admin-dashboard/products");
      } catch (error) {
        console.error("Form submission error", error);
        alert("An error occurred while saving the product.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
      <div className="space-y-4">
        <div>
          <Label>Product Image</Label>
          <div className="mt-2">
            <Controller
              name="imageUrl"
              control={control}
              render={({ field }) => (
                <ImageUpload value={field.value} onChange={field.onChange} />
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input {...register("name")} placeholder="e.g. Lumina Diamond Solitaire" className="rounded-xl border-slate-200" />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Slug *</Label>
            <Input {...register("slug")} placeholder="e.g. lumina-diamond-solitaire" className="rounded-xl border-slate-200" />
            {errors.slug && <p className="text-sm text-red-500">{errors.slug.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Category *</Label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ring">Ring</SelectItem>
                    <SelectItem value="necklace">Necklace</SelectItem>
                    <SelectItem value="bracelet">Bracelet</SelectItem>
                    <SelectItem value="earring">Earring</SelectItem>
                    <SelectItem value="pendant">Pendant</SelectItem>
                    <SelectItem value="bangle">Bangle</SelectItem>
                    <SelectItem value="set">Set</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>Price (Cents) *</Label>
            <Input type="number" {...register("basePriceCents")} className="rounded-xl border-slate-200" />
            {errors.basePriceCents && <p className="text-sm text-red-500">{errors.basePriceCents.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Metal Type *</Label>
            <Controller
              name="metalType"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Select Metal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="platinum">Platinum</SelectItem>
                    <SelectItem value="rose_gold">Rose Gold</SelectItem>
                    <SelectItem value="white_gold">White Gold</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>Metal Purity *</Label>
            <Controller
              name="metalPurity"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Select Purity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9k">9k</SelectItem>
                    <SelectItem value="14k">14k</SelectItem>
                    <SelectItem value="18k">18k</SelectItem>
                    <SelectItem value="24k">24k</SelectItem>
                    <SelectItem value="925">925 Sterling</SelectItem>
                    <SelectItem value="950">950 Platinum</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Weight (Grams) *</Label>
            <Input type="number" step="0.001" {...register("weightGrams")} className="rounded-xl border-slate-200" />
            {errors.weightGrams && <p className="text-sm text-red-500">{errors.weightGrams.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea {...register("description")} className="rounded-xl border-slate-200 min-h-[120px]" />
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
        <Button 
          type="button" 
          variant="outline" 
          className="rounded-xl border-slate-200"
          onClick={() => router.push("/admin-dashboard/products")}
        >
          Cancel
        </Button>
        <Button type="submit" className="rounded-xl bg-slate-900 text-white" disabled={isPending}>
          {isPending ? "Saving..." : initialData ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
