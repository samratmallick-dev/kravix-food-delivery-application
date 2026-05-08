import { GoogleGenerativeAI } from "@google/generative-ai";

const STOPWORDS = new Set([
      "ami", "amar", "amr", "amra", "chai", "khabo", "khabo", "debo", "dao", "ektu", "ekta",
      "mujhe", "muje", "chahiye", "chahie", "mera", "mera", "ek", "do", "dena",
      "please", "pls", "give", "want", "need", "order", "get", "some", "a", "an", "the"
]);


const SYNONYMS: Record<string, string> = {
      vat: "rice", bhat: "rice", bhaat: "rice",
      dal: "lentils", daal: "lentils",
      ruti: "bread",
      mach: "fish", maach: "fish",
      mangsho: "mutton", mangshe: "mutton",
      murgi: "chicken", murgh: "chicken",
      dim: "egg", deem: "egg",
      cha: "tea"
};

function resolveLocally(input: string): string | null {
      const tokens = input.trim().toLowerCase().split(/\s+/);
      const meaningful = tokens.filter((t) => !STOPWORDS.has(t));

      if (meaningful.length === 0) return null;

      if (meaningful.length === 1) {
            const token = meaningful[0] as string;
            return SYNONYMS[token] ?? token;
      }

      return meaningful.map((t) => SYNONYMS[t] ?? t).join(" ");
}

export async function normalizeSearchQuery(input: string): Promise<string> {
      if (!input || !input.trim()) return input;

      const local = resolveLocally(input);
      if (local !== null) return local;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return input;

      try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const result = await Promise.race([
                  model.generateContent(
                        `Extract only the food item name from this query. Return a single English word or short phrase. No explanation.\nQuery: "${input}"`
                  ),
                  new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error("timeout")), 3000)
                  )
            ]);

            const text = (result as Awaited<ReturnType<typeof model.generateContent>>)
                  .response.text().trim();

            return text || input;
      } catch {
            return input;
      }
}
