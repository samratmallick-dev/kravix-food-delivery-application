const STOPWORDS = new Set([
      "ami", "amar", "amr", "amra", "chai", "khabo", "debo", "dao", "ektu", "ekta",
      "mujhe", "muje", "chahiye", "chahie", "mera", "ek", "do", "dena",
      "please", "pls", "give", "want", "need", "order", "get", "some", "a", "an", "the"
]);

const FOOD_SYNONYMS = new Set([
      "vat", "bhat", "bhaat", "rice",
      "dal", "daal", "lentils",
      "ruti", "roti", "bread",
      "mach", "maach", "fish",
      "biriyani", "briyani", "biryani",
      "mangsho", "mangshe", "mutton",
      "murgi", "murgh", "chicken",
      "dim", "deem", "egg",
      "cha", "tea", "coffee",
      "pizza", "burger", "pasta", "noodles", "soup",
      "curry", "kebab", "roll", "sandwich", "salad",
      "dessert", "cake", "ice", "cream", "khichuri", "pulao"
]);

export function detectSearchType(input: string): "restaurant" | "food" {
      const tokens = input.trim().toLowerCase().split(/\s+/);
      const meaningful = tokens.filter((t) => !STOPWORDS.has(t));

      if (meaningful.length === 0) return "food";
      if (meaningful.some((t) => FOOD_SYNONYMS.has(t))) return "food";

      return "restaurant";
}
