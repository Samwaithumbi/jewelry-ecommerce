import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  metalType: z.enum(["gold", "silver", "platinum", "rose_gold", "white_gold"]),
  metalPurity: z.enum(["9k", "14k", "18k", "24k", "925", "950"]),
  basePriceCents: z.coerce.number().min(0, "Price must be positive"),
  weightGrams: z.coerce.number().min(0),
  category: z.enum(["ring", "necklace", "bracelet", "earring", "pendant", "bangle", "set"]),
  imageUrl: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
