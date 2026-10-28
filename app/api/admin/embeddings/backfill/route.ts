import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { backfillMissingEmbeddings } from "@/lib/products/vectorstorage";

export async function POST(req: NextRequest) {
  try {
    // 1. Authorize via CRON_SECRET or Admin Session
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isCronAuthorized = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isCronAuthorized) {
      const session = await getServerSession(authOptions);
      if (!session || (session.user as any)?.role !== "admin") {
        return NextResponse.json(
          { error: "Unauthorized. Admin session or CRON_SECRET required." },
          { status: 401 }
        );
      }
    }

    // 2. Parse batch size
    const body = await req.json().catch(() => ({}));
    const batchSize = typeof body.batchSize === "number" && body.batchSize > 0
      ? Math.min(body.batchSize, 128)
      : 50;

    // 3. Run backfill
    const result = await backfillMissingEmbeddings(batchSize);

    return NextResponse.json({
      success: true,
      batchSize,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[api/admin/embeddings/backfill] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
