import { getInventoryItems } from "@/app/actions/inventory";
import { InventoryClient } from "./inventory-client";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const items = await getInventoryItems();

  return <InventoryClient initialItems={items} />;
}
