/**
 * lib/search/suggestions.ts
 * AI and Domain fallback suggestions when a search yields 0 results.
 */

export function generateDomainSuggestions(query: string): string[] {
  const lower = query.toLowerCase();
  const suggestions: string[] = [];

  if (lower.includes("ring") || lower.includes("proposal") || lower.includes("engage")) {
    suggestions.push("solitaire diamond ring", "18k gold wedding band", "something timeless");
  } else if (lower.includes("ear") || lower.includes("stud") || lower.includes("hoop")) {
    suggestions.push("cozy and delicate earrings", "gold hoop earrings", "diamond stud earrings");
  } else if (lower.includes("neck") || lower.includes("pendant") || lower.includes("chain")) {
    suggestions.push("gold heart pendant", "delicate silver necklace", "classic pearl choker");
  } else if (lower.includes("brace") || lower.includes("bangle")) {
    suggestions.push("bold statement bangle", "silver tennis bracelet", "18k yellow gold bangle");
  } else if (lower.includes("gift") || lower.includes("anniversary") || lower.includes("love")) {
    suggestions.push("romantic anniversary gift", "something timeless", "luxury jewelry set");
  } else {
    suggestions.push(
      "something timeless",
      "bold statement piece",
      "cozy and delicate",
      "minimalist everyday"
    );
  }

  return suggestions.slice(0, 4);
}

export async function getAiSuggestions(failedQuery: string): Promise<string[]> {
  const trimmed = failedQuery.trim();
  if (!trimmed) {
    return [
      "something timeless",
      "bold statement piece",
      "cozy and delicate",
      "romantic anniversary",
    ];
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey && anthropicKey.trim()) {
    try {
      const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey.trim(),
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 150,
          messages: [
            {
              role: "user",
              content: `A luxury jewelry store shopper searched for "${trimmed}" but got 0 results. Suggest 3 to 4 short, enticing alternative search phrases (2-4 words each). Output ONLY a JSON array of strings, e.g. ["phrase 1", "phrase 2", "phrase 3"]. Do not include markdown or explanations.`,
            },
          ],
        }),
      });

      if (claudeRes.ok) {
        const data = await claudeRes.json();
        const textContent = data.content?.[0]?.text?.trim() || "";
        const parsed = JSON.parse(textContent.replace(/```json|```/g, "").trim());
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 4);
        }
      }
    } catch (err) {
      console.warn("[search/suggestions] Claude fallback triggered:", err);
    }
  }

  return generateDomainSuggestions(trimmed);
}
