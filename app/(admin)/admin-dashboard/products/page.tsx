import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Plus, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { products, productImages } from "@/drizzle/src/db/schema";
import { ProductTableActions } from "@/components/product-table-actions";
import { eq } from "drizzle-orm";

export default async function Products() {
  // Fetch products and their primary images
  const dbProducts = await db
    .select({
      product: products,
      imageUrl: productImages.url,
    })
    .from(products)
    .leftJoin(productImages, eq(products.id, productImages.productId));

  // Deduplicate products in case of multiple images (though leftJoin might be fine if we just want one per product)
  const productMap = new Map();
  for (const row of dbProducts) {
    if (!productMap.has(row.product.id)) {
      productMap.set(row.product.id, {
        ...row.product,
        image: row.imageUrl || "https://images.unsplash.com/photo-1605100804763-247f661c4480?w=100&q=80",
      });
    }
  }
  const productsList = Array.from(productMap.values());

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif text-slate-900 tracking-tight">Product Management</h1>
          <p className="text-slate-500 mt-1">{productsList.length} products in catalog</p>
        </div>
        <Link href="/admin-dashboard/products/new">
          <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-6 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Product
          </Button>
        </Link>
      </div>

      <div className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search products..." className="pl-9 rounded-xl border-slate-200 bg-slate-50/50" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[140px] rounded-xl border-slate-200 bg-slate-50/50">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="rings">Rings</SelectItem>
            <SelectItem value="necklaces">Necklaces</SelectItem>
            <SelectItem value="earrings">Earrings</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="rounded-xl border-slate-200 flex items-center gap-2 bg-slate-50/50">
          <Filter className="w-4 h-4" /> Filters
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="w-12 pl-6">
                <div className="w-4 h-4 rounded border border-slate-300 bg-white" />
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Metal/Stone</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productsList.map((product) => (
              <TableRow key={product.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                <TableCell className="pl-6">
                  <div className="w-4 h-4 rounded border border-slate-300 bg-white" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-4 py-2">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-12 h-12 rounded-full object-cover shadow-sm"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{product.name}</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                      <Badge variant="secondary" className="mt-1 bg-slate-100 text-slate-600 hover:bg-slate-100 border-0 rounded-full px-2 py-0 font-medium text-[10px] capitalize">
                        {product.category}
                      </Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-slate-600 capitalize">{product.category}</TableCell>
                <TableCell>
                  <div className="text-slate-600 text-sm whitespace-pre-line capitalize">
                    {product.metalType.replace('_', ' ')}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-slate-900">${(product.basePriceCents / 100).toLocaleString()}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-0 rounded-full">
                    {product.active ? "Active" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <ProductTableActions id={product.id} />
                </TableCell>
              </TableRow>
            ))}
            {productsList.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}