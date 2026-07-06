const STOPWORDS = new Set([
      "ami", "amar", "amr", "amra", "chai", "khabo", "debo", "dao", "ektu", "ekta",
      "mujhe", "muje", "chahiye", "chahie", "mera", "ek", "do", "dena",
      "please", "pls", "give", "want", "need", "order", "get", "some", "a", "an", "the"
]);

const FOOD_TOKENS = new Set([
      "vat", "bhat", "bhaat", "rice",
      "dal", "daal", "lentils",
      "ruti", "roti", "bread",
      "mach", "maach", "fish",
      "biriyani", "briyani", "biryani", "biriani",
      "mangsho", "mangshe", "mutton",
      "murgi", "murgh", "chicken", "chiken", "chcken",
      "dim", "deem", "egg",
      "cha", "tea", "coffee",
      "pizza", "piza", "pizaa", "burger", "burgur",
      "pasta", "noodles", "soup", "curry",
      "kebab", "kebap", "roll", "sandwich", "salad",
      "dessert", "cake", "ice", "cream", "khichuri", "pulao",
      "paneer", "tandoori", "tikka", "dosa", "idli",
      "samosa", "chaat", "momos", "sushi", "tacos", "steak", "shawarma",
      "paratha", "puri", "bhaji", "chowmein", "manchurian", "fried", "grilled",
]);

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

function isFoodToken(token: string): boolean {
      if (FOOD_TOKENS.has(token)) return true;
      if (token.length < 4) return false;
      const maxDist = token.length <= 5 ? 1 : 2;
      for (const food of FOOD_TOKENS) {
            if (Math.abs(food.length - token.length) > maxDist) continue;
            if (levenshtein(token, food) <= maxDist) return true;
      }
      return false;
}

export function detectSearchType(input: string): "restaurant" | "food" {
      const tokens = input.trim().toLowerCase().split(/\s+/);
      const meaningful = tokens.filter((t) => !STOPWORDS.has(t));
      if (meaningful.length === 0) return "food";
      if (meaningful.some(isFoodToken)) return "food";
      return "restaurant";
}
