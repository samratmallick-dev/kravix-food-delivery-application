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

const FOOD_TOKENS = new Set([
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