import { getInventory } from "@/app/actions/admin/get-inventory";
import { InventoryClient } from "./inventory-client";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const inventoryData = await getInventory();

  return <InventoryClient initialData={inventoryData} />;
}
