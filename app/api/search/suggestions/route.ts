import { NextRequest, NextResponse } from "next/server";
import { getAiSuggestions } from "@/lib/search/suggestions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const failedQuery = typeof body.query === "string" ? body.query.trim() : "";
    const suggestions = await getAiSuggestions(failedQuery);
    return NextResponse.json({ suggestions });
  } catch (error: any) {
    return NextResponse.json(
      {
        suggestions: [
          "something timeless",
          "bold statement piece",
          "cozy and delicate",
          "romantic anniversary",
        ],
      },
      { status: 200 }
    );
  }
}
