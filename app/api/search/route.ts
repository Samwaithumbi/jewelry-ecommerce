import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = typeof body.query === "string" ? body.query.trim() : "";

    if (!query) {
      return NextResponse.json({
        success: true,
        query: "",
        totalCount: 0,
        results: [],
      });
    }

    // 1. Resolve user ID if authenticated
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id || undefined;
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : undefined;

    // 2. Parse optional filters
    const filters = {
      category: typeof body.filters?.category === "string" ? body.filters.category : undefined,
      metalType: typeof body.filters?.metalType === "string" ? body.filters.metalType : undefined,
      minPriceCents: typeof body.filters?.minPriceCents === "number" ? body.filters.minPriceCents : undefined,
      maxPriceCents: typeof body.filters?.maxPriceCents === "number" ? body.filters.maxPriceCents : undefined,
      limit: typeof body.filters?.limit === "number" ? Math.min(body.filters.limit, 50) : 20,
      minScore: typeof body.filters?.minScore === "number" ? body.filters.minScore : undefined,
    };

    // 3. Dynamically import and execute hybrid search
    const { searchSemantic } = await import("@/lib/search/semantic");
    const response = await searchSemantic(query, filters, {
      userId,
      sessionId,
      logSearch: true,
    });

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (error: any) {
    console.error("[POST /api/search] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred while executing search",
      },
      { status: 500 }
    );
  }
}
