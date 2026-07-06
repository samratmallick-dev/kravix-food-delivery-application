import { GoogleGenerativeAI } from "@google/generative-ai";

const STOPWORDS = new Set([
      "ami", "amar", "amr", "amra", "chai", "khabo", "debo", "dao", "ektu", "ekta",
      "mujhe", "muje", "chahiye", "chahie", "mera", "ek", "do", "dena",
      "please", "pls", "give", "want", "need", "order", "get", "some", "a", "an", "the",
]);

const SYNONYMS: Record<string, string> = {
      vat: "rice", bhat: "rice", bhaat: "rice",
      dal: "lentils", daal: "lentils",
      ruti: "bread", roti: "bread",
      mach: "fish", maach: "fish",
      mangsho: "mutton", mangshe: "mutton",
      murgi: "chicken", murgh: "chicken",
      dim: "egg", deem: "egg",
      cha: "tea",
};

const VOCABULARY = [
      "biryani", "rice", "chicken", "mutton", "fish", "egg", "bread", "lentils",
      "pizza", "burger", "pasta", "noodles", "soup", "curry", "kebab", "roll",
      "sandwich", "salad", "dessert", "cake", "coffee", "tea", "juice",
      "paneer", "tandoori", "tikka", "dal", "roti", "paratha", "dosa", "idli",
      "samosa", "chaat", "momos", "sushi", "tacos", "steak", "shawarma",
      "restaurant", "hotel", "cafe", "dhaba", "fried", "grilled", "roasted",
      "kfc", "mcdonalds", "subway", "dominos", "pizza hut", "chinese", "thai",
      "indian", "bengali", "mughlai", "continental", "seafood", "vegan",
      "pulao", "khichuri", "puri", "bhaji", "chowmein", "manchurian",
];

function levenshtein(a: string, b: string): number {
      const m = a.length, n = b.length;
      const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
            Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
      );
      for (let i = 1; i <= m; i++)
            for (let j = 1; j <= n; j++)
                  dp[i]![j] = a[i - 1] === b[j - 1]
                        ? dp[i - 1]![j - 1]!
                        : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!);
      return dp[m]![n]!;
}

function fuzzyCorrect(token: string): string | null {
      if (token.length < 3) return null;
      const maxDist = token.length <= 4 ? 1 : 2;
      let best: string | null = null;
      let bestDist = maxDist + 1;
      for (const word of VOCABULARY) {
            if (word.includes(" ")) continue;
            const d = levenshtein(token, word);
            if (d < bestDist) { bestDist = d; best = word; }
      }
      return bestDist <= maxDist ? best : null;
}

export function prefixExpand(token: string): string | null {
      if (token.length < 2) return null;
      const lower = token.toLowerCase();
      const prefixMatch = VOCABULARY.filter((w) => !w.includes(" ") && w.startsWith(lower));
      if (prefixMatch.length > 0) {
            return prefixMatch.sort((a, b) => a.length - b.length)[0]!;
      }
      if (token.length >= 3) {
            let best: string | null = null;
            let bestScore = Infinity;
            for (const word of VOCABULARY) {
                  if (word.includes(" ") || word.length < token.length) continue;
                  const prefix = word.slice(0, token.length);
                  const d = levenshtein(lower, prefix);
                  if (d <= 1 && d < bestScore) { bestScore = d; best = word; }
            }
            if (best) return best;
      }
      return null;
}

function resolveLocally(input: string): string | null {
      const tokens = input.trim().toLowerCase().split(/\s+/);
      const meaningful = tokens.filter((t) => !STOPWORDS.has(t));
      if (meaningful.length === 0) return null;

      if (meaningful.length > 1) return null;


      const corrected = meaningful.map((t) => {
            if (SYNONYMS[t]) return SYNONYMS[t];
            if (VOCABULARY.includes(t)) return t;
            return fuzzyCorrect(t) ?? t;
      });

      return corrected.join(" ");
}

export async function normalizeSearchQuery(input: string): Promise<{ normalized: string; corrected: boolean }> {
      if (!input || !input.trim()) return { normalized: input, corrected: false };

      const raw = input.trim().toLowerCase();
      const tokens = raw.split(/\s+/).filter(Boolean);
      const local = resolveLocally(raw);

      if (local !== null && local !== raw) return { normalized: local, corrected: true };
      if (local !== null) return { normalized: local, corrected: false };

      if (tokens.length > 1) return { normalized: input, corrected: false };

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return { normalized: input, corrected: false };

      try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const result = await Promise.race([
                  model.generateContent(
                        `You are a food search assistant. Fix any spelling mistakes and extract the food item or restaurant name from this query. Return only the corrected English word or short phrase. No explanation.\nQuery: "${input}"`,
                  ),
                  new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error("timeout")), 3000),
                  ),
            ]);

            const text = (
                  result as Awaited<ReturnType<typeof model.generateContent>>
            ).response.text().trim();

            return { normalized: text || input, corrected: text.toLowerCase() !== raw };
      } catch {
            return { normalized: input, corrected: false };
      }
}
