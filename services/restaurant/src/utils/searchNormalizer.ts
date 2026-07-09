import { GoogleGenerativeAI } from "@google/generative-ai";

const STOPWORDS = new Set([
      "a", "an", "the", "and", "or", "but", "to", "for", "of", "on", "in", "at",
      "with", "from", "by", "about", "into", "over", "under", "after", "before",
      "please", "pls", "plz", "kindly",
      "want", "need", "looking", "search", "find", "show", "display",
      "give", "get", "bring", "send", "provide", "fetch",
      "have", "has", "had", "having",
      "can", "could", "will", "would", "should", "may", "might",
      "is", "are", "was", "were", "be", "been", "being",
      "me", "my", "mine", "you", "your", "yours", "we", "our", "ours",
      "they", "their", "them", "he", "she", "his", "her", "it", "its",
      "this", "that", "these", "those",
      "some", "any", "all", "many", "much", "few", "little",
      "one", "two", "three", "four", "five",
      "order", "buy", "purchase", "deliver", "delivery",
      "food", "restaurant", "hotel", "shop", "place",
      "near", "nearby", "best", "good", "top", "popular",
      "today", "now", "currently", "available",

      "ami", "amar", "amr", "amake", "amader",
      "tumi", "tomar", "tomake", "tomader",
      "se", "tara", "oder", "or",
      "ek", "ekta", "ekti", "dui", "tin",
      "chai", "lagbe", "dorkar", "dao", "den", "din",
      "de", "dite", "niye", "niyeaso",
      "khabo", "khai", "khete", "khaite",
      "ache", "ase", "chilo", "hobe", "holo",
      "ki", "keno", "kothay", "kobe", "kivabe",
      "eto", "onek", "aro", "sob", "shob",
      "ektu", "khub", "valo", "bhalo",
      "amarjonno", "jonno", "sathe",
      "theke", "porjonto", "moddhe", "upar", "niche",
      "akhon", "aj", "kal", "ajke", "ekhon",
      "please", "plz",

      "main", "mai", "mera", "meri", "mere",
      "mujhe", "muje", "hum", "ham", "hamara",
      "tum", "tumhara", "aap", "aapka",
      "ye", "yeh", "wo", "woh", "unka",
      "ek", "do", "teen", "char", "paanch",
      "chahiye", "chahie", "chahta", "chahti",
      "do", "de", "dena", "dijiye", "dejiye",
      "lao", "lana", "bhejo",
      "khana", "khane", "khanahai", "khunga", "khayenge",
      "hai", "hain", "tha", "thi", "the",
      "ho", "hoga", "hogi", "honge",
      "kya", "kyu", "kyon", "kaise", "kab", "kaha",
      "ke", "ki", "ka", "ko", "se", "tak", "par",
      "bahut", "thoda", "sab", "aur",
      "ab", "aaj", "kal",
      "please", "plz",

      "bro", "bhai", "dada", "boss", "sir", "madam",
      "hello", "hi", "hey", "thanks", "thankyou",
      "ok", "okay", "acha", "accha", "achha",
      "hmm", "hmmm", "huh", "lol",
      "urgent", "quick", "fast",
      "just", "only", "simply",
      "pleasee", "plss", "plzzz",

      "kg", "gm", "gram", "grams", "ml", "ltr", "liter", "litre",
      "piece", "pieces", "pc", "pcs", "plate", "plates",
      "bowl", "bowls", "cup", "cups", "box", "boxes",
      "small", "medium", "large", "full", "half",

      "&", "-", "_", ".", ",", "?"
]);

const SYNONYMS: Record<string, string> = {
      vat: "rice", bhat: "rice", bhaat: "rice", chaal: "rice", chawal: "rice",
      dal: "lentils", daal: "lentils", lentil: "lentils",
      ruti: "roti", chapati: "roti", bread: "roti",
      mach: "fish", maach: "fish",
      mangsho: "mutton", mangshe: "mutton", goat: "mutton", lamb: "mutton",
      murgi: "chicken", murgh: "chicken", broiler: "chicken",
      dim: "egg", deem: "egg",
      cha: "tea",
      biriyani: "biryani", biriani: "biryani", briyani: "biryani",
      burgur: "burger", burgar: "burger",
      piza: "pizza", pizaa: "pizza",
      kebap: "kebab", doner: "kebab",
      sabji: "veg", sabzi: "veg", vegetable: "veg",
      chowmin: "chowmein", chaumin: "chowmein", chaomeen: "chowmein",
      nudles: "noodles", noodels: "noodles", noodel: "noodles", noodls: "noodles",
      manchuriya: "manchuria",
      sezwan: "schezwan", shezwan: "schezwan", schezuan: "schezwan",
      chily: "chilli", chilie: "chilli",
      momoes: "momos", momo: "momos",
      fridrice: "friedrice", "fride rice": "friedrice", fride: "friedrice",
      haka: "hakka",
      rosogolla: "rasgulla",
};

const VOCABULARY = [
      "rice", "vat", "bhat", "bhaat", "chaal", "chawal", "jeera", "pulao", "pulav",
      "khichuri", "khichdi", "friedrice", "fried", "ricebowl",

      "roti", "ruti", "chapati", "naan", "kulcha", "paratha", "lachha", "rumali",
      "puri", "luchi", "bhatura", "bread", "bun", "toast",

      "dal", "daal", "lentil", "lentils", "sambar", "rasam",

      "chicken", "murgh", "murgi", "broiler", "chickencurry",
      "butterchicken", "tandoorichicken", "friedchicken",
      "grilledchicken", "chickentikka", "chicken65",
      "chickenbiryani", "chickenroll", "chickenburger",
      "chickensandwich", "chickenpizza", "chickenpasta",

      "mutton", "goat", "lamb", "mangsho", "mangshe",
      "muttoncurry", "muttonbiryani", "muttonkosha",

      "beef", "beefburger", "beefsteak", "beefcurry",

      "pork", "bacon", "ham", "sausages", "salami",

      "fish", "mach", "maach", "ilish", "hilsa", "katla",
      "rui", "rohu", "pomfret", "bhetki", "salmon",
      "tuna", "cod", "prawn", "shrimp", "lobster",
      "crab", "octopus", "squid",

      "egg", "dim", "deem", "omelette", "boiledegg",
      "eggroll", "eggcurry", "eggfriedrice",

      "biryani", "biriyani", "biriani", "briyani",
      "hyderabadibiryani", "kolkatabiryani", "lucknowibiryani",

      "paneer", "palak", "malai", "kofta", "korma",
      "buttermasala", "shahi", "chole", "rajma",
      "aloo", "gobi", "bhindi", "baingan", "mixedveg",
      "veg", "vegetable", "sabji", "sabzi",

      "dosa", "idli", "vada", "uttapam", "upma",
      "pongal", "appam", "puttu",

      "chowmin", "chaumin", "chaomeen",
      "nudles", "noodels", "noodel", "noodls",
      "manchuriya", "manchuria",
      "schezwan", "sezwan", "shezwan", "schezuan",
      "chilli", "chily", "chilie",
      "momo", "momos", "momoes",
      "fride rice", "fridrice", "fride",
      "hakka", "haka",

      "pizza", "piza", "pizaa",
      "pasta", "lasagna", "spaghetti",
      "macaroni", "risotto", "ravioli",

      "burger", "burgur", "burgar",
      "hotdog", "fries", "frenchfries",
      "nuggets", "wrap", "sandwich",

      "shawarma", "falafel", "hummus",
      "kebab", "kebap", "doner",
      "gyro", "pita",

      "sushi", "ramen", "udon", "tempura",
      "teriyaki", "yakitori",

      "kimchi", "bibimbap", "tteokbokki",
      "bulgogi",

      "padthai", "thaicurry",

      "tacos", "burrito", "quesadilla",
      "nachos", "enchilada",

      "samosa", "kachori", "chaat",
      "pakora", "bhaji", "fuchka",
      "golgappa", "panipuri", "jhalmuri",

      "roll", "kathi", "frankie",
      "sub", "wrap", "clubsandwich",

      "soup", "tomatosoup", "chickensoup",
      "hotsour", "sweetcorn",

      "salad", "greens", "caesar",

      "cake", "pastry", "brownie", "cookie",
      "icecream", "ice", "cream", "kulfi",
      "gulabjamun", "rasgulla", "rosogolla",
      "sandesh", "mishti", "jalebi",
      "rabri", "kheer", "payesh",
      "halwa", "laddu", "barfi",
      "cheesecake", "donut", "muffin",

      "tea", "cha", "coffee",
      "latte", "cappuccino", "espresso",
      "americano", "mocha",
      "juice", "smoothie", "milkshake",
      "lassi", "falooda",
      "cola", "coke", "pepsi",
      "sprite", "fanta",
      "water", "soda",

      "apple", "banana", "mango",
      "orange", "grape", "pineapple",
      "watermelon", "papaya",
      "guava", "litchi", "kiwi",
      "pear", "peach",

      "potato", "tomato", "onion",
      "carrot", "cabbage", "spinach",
      "capsicum", "corn", "peas",
      "broccoli", "cauliflower",
      "mushroom", "bean",

      "fried", "grilled", "roasted",
      "steamed", "baked", "smoked",
      "crispy", "spicy", "hot",
      "masala", "curry", "dry",
      "gravy", "bbq", "barbecue",
      "tandoori", "tikka",

      "breakfast", "lunch", "dinner",
      "snack", "brunch", "meal",
      "combo", "thali", "platter",

      "mach", "maach", "bhaat", "vat",
      "dim", "mangsho", "alu",
      "posto", "shukto", "chingri",
      "ilish", "payesh",

      "khana", "khane", "sabji",
      "roti", "chapati", "chawal",
      "dal", "paneer", "paratha",
      "kachori", "poha", "upma",
      "halwa", "lassi"
,
      "restaurant", "hotel", "cafe", "dhaba",
      "kfc", "mcdonalds", "subway", "dominos", "pizza hut", "chinese", "thai",
      "indian", "bengali", "mughlai", "continental", "seafood", "vegan",
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
