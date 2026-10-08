// scripts/expire-reservations.ts
// Worker to expire inventory reservations that have passed their expiration time
// This should be run periodically (e.g., every minute via cron or Vercel cron)

import 'dotenv/config';
import { expireReservations } from "@/lib/inventory/service";

async function runExpirationWorker() {
  console.log("Starting reservation expiration worker...");
  const startTime = Date.now();

  try {
    const expiredCount = await expireReservations();
    const duration = Date.now() - startTime;

    console.log(`✅ Expired ${expiredCount} reservations in ${duration}ms`);

    if (expiredCount > 0) {
      console.log(`   Released inventory for ${expiredCount} expired reservations`);
    }
  } catch (error) {
    console.error("❌ Reservation expiration worker failed:", error);
    throw error;
  }
}

// Run the worker
runExpirationWorker()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Worker failed:", error);
    process.exit(1);
  });
