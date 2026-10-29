import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { searchLogId, productId } = body;

    if (!searchLogId || !productId) {
      return NextResponse.json(
        { success: false, error: "searchLogId and productId are required" },
        { status: 400 }
      );
    }

    const { recordSearchClick } = await import("@/lib/search/semantic");
    const recorded = await recordSearchClick(searchLogId, productId);

    return NextResponse.json({
      success: recorded,
      searchLogId,
      productId,
    });
  } catch (error: any) {
    console.error("[POST /api/search/click] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record search click" },
      { status: 500 }
    );
  }
}
