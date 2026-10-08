"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Search,
  Pencil,
  RotateCcw,
  X,
  Check,
  AlertTriangle,
  Coins,
  ChevronUp,
  ChevronDown,
  Download,
  Loader2,
  PackageCheck,
} from "lucide-react";
import {
  updateStockQty,
  restockVariant,
  type InventoryItemDB,
} from "@/app/actions/inventory";

export type InventoryRow = InventoryItemDB;

const CATEGORIES = ["All", "Rings", "Necklaces", "Earrings", "Bracelets"] as const;

function calculateStatus(stock: number, reorderPoint: number): InventoryRow["status"] {
  if (stock === 0) return "Out of Stock";
  if (stock <= Math.ceil(reorderPoint * 0.5)) return "Critical";
  if (stock <= reorderPoint) return "Low";
  return "Good";
}

/* ─── Status Badge ───────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: InventoryRow["status"] }) {
  switch (status) {
    case "Critical":
      return (
        <span className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-500 ring-1 ring-inset ring-rose-200/50">
          Critical
        </span>
      );
    case "Low":
      return (
        <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600 ring-1 ring-inset ring-amber-200/60">
          Low
        </span>
      );
    case "Out of Stock":
      return (
        <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 ring-1 ring-inset ring-red-200">
          Out of Stock
        </span>
      );
    case "Good":
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600 ring-1 ring-inset ring-emerald-200/50">
          Good
        </span>
      );
  }
}

/* ─── Stock Progress Bar ─────────────────────────────────────────────────── */
function StockLevelBar({ stock, reorderPoint }: { stock: number; reorderPoint: number }) {
  const target = Math.max(reorderPoint * 2, 12);
  const percentage = Math.min(Math.round((stock / target) * 100), 100);

  const barColor =
    stock === 0
      ? "bg-red-400"
      : stock <= reorderPoint
      ? "bg-amber-400"
      : "bg-amber-500";

  return (
    <div className="flex items-center gap-2 min-w-[70px]">
      <div className="relative h-2 w-20 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.max(percentage, stock > 0 ? 8 : 0)}%` }}
        />
      </div>
    </div>
  );
}

/* ─── Restock SKU Modal ──────────────────────────────────────────────────── */
function RestockModal({
  item,
  onClose,
  onRestock,
  isPending,
}: {
  item: InventoryRow | null;
  onClose: () => void;
  onRestock: (variantId: string, amount: number) => Promise<void>;
  isPending: boolean;
}) {
  const [amount, setAmount] = useState(5);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-serif font-semibold text-slate-900">Restock SKU</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{item.sku}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="py-4">
          <p className="text-sm font-medium text-slate-800">{item.name}</p>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <span>Current Stock:</span>
            <span className="font-semibold text-slate-900">{item.stock} units</span>
          </div>

          <label className="block text-xs font-medium text-slate-700 mt-4 mb-2">
            Units to Add into Inventory
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAmount((a) => Math.max(1, a - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
              className="flex-1 h-9 rounded-xl border border-slate-200 text-center text-sm font-semibold outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/10 transition"
            />
            <button
              type="button"
              onClick={() => setAmount((a) => a + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-full px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={async () => {
              await onRestock(item.variantId, amount);
              onClose();
            }}
            className="rounded-full bg-slate-950 px-5 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60 transition flex items-center gap-1.5"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Confirm +{amount} Units
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Client Inventory Manager Component ─────────────────────────────────── */
export function InventoryClient({ initialItems }: { initialItems: InventoryRow[] }) {
  const [items, setItems] = useState<InventoryRow[]>(initialItems);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [restockItem, setRestockItem] = useState<InventoryRow | null>(null);
  const [sortKey, setSortKey] = useState<keyof InventoryRow | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isPending, startTransition] = useTransition();

  /* ── Calculations ─────────────────────────────────────────────────────── */
  const totalValue = useMemo(() => {
    return items.reduce((acc, curr) => acc + curr.stock * curr.unitPrice, 0);
  }, [items]);

  const lowStockCount = useMemo(() => {
    return items.filter((i) => i.stock > 0 && i.stock <= i.reorderPoint).length;
  }, [items]);

  const outOfStockCount = useMemo(() => {
    return items.filter((i) => i.stock === 0).length;
  }, [items]);

  /* ── Filtering and Sorting ────────────────────────────────────────────── */
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesCategory =
          selectedCategory === "All" || item.category === selectedCategory;
        const matchesSearch =
          search === "" ||
          item.sku.toLowerCase().includes(search.toLowerCase()) ||
          item.name.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (!sortKey) return 0;
        const valA = a[sortKey];
        const valB = b[sortKey];
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [items, selectedCategory, search, sortKey, sortOrder]);

  const handleSort = (key: keyof InventoryRow) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  /* ── Database-backed Mutations ────────────────────────────────────────── */
  const handleInlineStockSave = (item: InventoryRow) => {
    const newStock = Math.max(0, parseInt(editValue, 10) || 0);

    // Optimistic UI update
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              stock: newStock,
              status: calculateStatus(newStock, i.reorderPoint),
            }
          : i
      )
    );
    setEditingId(null);

    // Persist to Postgres database
    startTransition(async () => {
      try {
        await updateStockQty(item.variantId, newStock);
      } catch (err) {
        console.error("Failed to update stock:", err);
      }
    });
  };

  const handleRestock = async (variantId: string, amount: number) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((i) => {
        if (i.variantId === variantId) {
          const newStock = i.stock + amount;
          return {
            ...i,
            stock: newStock,
            status: calculateStatus(newStock, i.reorderPoint),
          };
        }
        return i;
      })
    );

    // Persist to DB
    startTransition(async () => {
      try {
        await restockVariant(variantId, amount);
      } catch (err) {
        console.error("Failed to restock in DB:", err);
      }
    });
  };

  const handleExportCSV = () => {
    const headers = "SKU,Product,Category,Stock,Reorder Point,Unit Price,Status\n";
    const rows = items
      .map(
        (i) =>
          `"${i.sku}","${i.name}","${i.category}",${i.stock},${i.reorderPoint},${i.unitPrice},"${i.status}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50/40 p-6 md:p-8 font-sans text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-serif font-semibold tracking-tight text-slate-900">
              Inventory
            </h1>
            <p className="mt-1 text-sm text-slate-500">{items.length} SKUs tracked</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
        </div>

        {/* ── Metric Cards ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {/* Card 1: Total Inventory Value */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Coins className="h-5 w-5" />
            </div>
            <div className="mt-5">
              <div className="text-3xl font-serif font-semibold text-slate-900">
                ${totalValue >= 1000 ? `${(totalValue / 1000).toFixed(0)}k` : totalValue.toLocaleString()}
              </div>
              <p className="mt-1 text-xs font-medium text-slate-500">Total Inventory Value</p>
            </div>
          </div>

          {/* Card 2: Low Stock Alerts */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="mt-5">
              <div className="text-3xl font-serif font-semibold text-slate-900">
                {lowStockCount}
              </div>
              <p className="mt-1 text-xs font-medium text-slate-500">Low Stock Alerts</p>
            </div>
          </div>

          {/* Card 3: Out of Stock */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
              <X className="h-5 w-5" />
            </div>
            <div className="mt-5">
              <div className="text-3xl font-serif font-semibold text-slate-900">
                {outOfStockCount}
              </div>
              <p className="mt-1 text-xs font-medium text-slate-500">Out of Stock</p>
            </div>
          </div>
        </div>

        {/* ── Table Card Container ────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-xs overflow-hidden">
          {/* Toolbar: Search + Category Filter Pills */}
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SKUs or products..."
                className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/10 transition"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-slate-950 text-white shadow-xs"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* ── Table ─────────────────────────────────────────────────────── */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/50">
                <tr>
                  <th
                    onClick={() => handleSort("sku")}
                    className="cursor-pointer px-6 py-3.5 font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600 select-none"
                  >
                    SKU
                  </th>
                  <th
                    onClick={() => handleSort("name")}
                    className="cursor-pointer px-6 py-3.5 font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600 select-none"
                  >
                    Product
                  </th>
                  <th
                    onClick={() => handleSort("category")}
                    className="cursor-pointer px-6 py-3.5 font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600 select-none"
                  >
                    Category
                  </th>
                  <th className="px-6 py-3.5 font-semibold text-slate-400 uppercase tracking-wider select-none">
                    Stock Level
                  </th>
                  <th
                    onClick={() => handleSort("stock")}
                    className="cursor-pointer px-6 py-3.5 font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600 select-none"
                  >
                    Stock
                  </th>
                  <th
                    onClick={() => handleSort("reorderPoint")}
                    className="cursor-pointer px-6 py-3.5 font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600 select-none"
                  >
                    Reorder Point
                  </th>
                  <th
                    onClick={() => handleSort("unitPrice")}
                    className="cursor-pointer px-6 py-3.5 font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600 select-none"
                  >
                    Unit Price
                  </th>
                  <th className="px-6 py-3.5 font-semibold text-slate-400 uppercase tracking-wider select-none">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-right font-semibold text-slate-400 uppercase tracking-wider select-none">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <PackageCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      No matching inventory items found in database.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 transition group"
                    >
                      {/* SKU */}
                      <td className="px-6 py-4 font-mono font-medium text-slate-600 whitespace-nowrap">
                        {item.sku}
                      </td>

                      {/* Product Name */}
                      <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap max-w-[220px] truncate">
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-7 w-7 rounded-lg object-cover border border-slate-100 shadow-2xs"
                            />
                          ) : null}
                          <span className="truncate">{item.name}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                        {item.category}
                      </td>

                      {/* Stock Level Bar */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StockLevelBar
                          stock={item.stock}
                          reorderPoint={item.reorderPoint}
                        />
                      </td>

                      {/* Stock + Pencil Inline Edit */}
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                        {editingId === item.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              autoFocus
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleInlineStockSave(item);
                                if (e.key === "Escape") setEditingId(null);
                              }}
                              className="w-14 rounded-md border border-amber-600 px-2 py-0.5 text-xs text-center font-semibold outline-none ring-2 ring-amber-600/10"
                            />
                            <button
                              onClick={() => handleInlineStockSave(item)}
                              className="text-emerald-600 hover:text-emerald-700 cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>{item.stock}</span>
                            <button
                              onClick={() => {
                                setEditingId(item.id);
                                setEditValue(String(item.stock));
                              }}
                              className="text-slate-300 opacity-60 group-hover:opacity-100 hover:text-slate-600 transition cursor-pointer"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Reorder Point */}
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                        {item.reorderPoint}
                      </td>

                      {/* Unit Price */}
                      <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                        ${item.unitPrice.toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={item.status} />
                      </td>

                      {/* Restock Action */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setRestockItem(item)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer"
                        >
                          <RotateCcw className="h-3 w-3 text-slate-500" />
                          Restock
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <RestockModal
        item={restockItem}
        onClose={() => setRestockItem(null)}
        onRestock={handleRestock}
        isPending={isPending}
      />
    </div>
  );
}
