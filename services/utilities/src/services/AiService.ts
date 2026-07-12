import axios from "axios";
import http from "http";
import https from "https";
import { IAIService } from "../interfaces/IAIService.js";
import { IGeminiClient } from "../interfaces/IGeminiClient.js";
import { ChatRequestFactory } from "../factories/ChatRequestFactory.js";
import { AiChatDto, AiResponseDto } from "../dto/AiChatDto.js";
import { ValidationError, ExternalServiceError } from "../utils/errors.js";

const ROLE_PERMISSIONS: Record<string, string[]> = {
  customer: ["read:profile", "create:order", "read:orders", "create:payment", "read:restaurants", "manage:cart"],
  seller: ["read:profile", "manage:menu", "manage:orders", "read:earnings", "manage:coupons", "read:restaurant_analytics"],
  rider: ["read:profile", "accept:deliveries", "update:delivery_status", "read:earnings", "manage:availability"],
  admin: ["read:profile", "manage:users", "manage:restaurants", "manage:riders", "read:platform_analytics", "manage:platform_settings"]
};

export class AIService implements IAIService {
  private readonly ctxAxios: any;
  private readonly couponCache: Record<string, { data: any[]; ts: number }> = {};
  private readonly COUPON_CACHE_TTL_MS = 30000;

  constructor(private readonly geminiClient: IGeminiClient) {
    const restaurantUrl = (process.env.RESTAURANT_BASE_URL || "http://localhost:9000").replace(/\/$/, "");
    this.ctxAxios = axios.create({
      baseURL: restaurantUrl,
      httpAgent: new http.Agent({ keepAlive: true, maxSockets: 10 }),
      httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 10 }),
      timeout: 4000
    });
  }

  async chat(userId: string, role: string, userName: string, token: string, dto: AiChatDto, requestId: string): Promise<AiResponseDto> {
    const chatReq = ChatRequestFactory.create(userId, role, dto);

    const ctx = await this.fetchContext(token, dto.restaurantId, requestId, role, chatReq.message);

    const sanitizedCtx = {
      orders: ctx.orders,
      menu_items: ctx.menu_items,
      coupons: ctx.coupons,
      budgetRange: ctx.budgetRange,
      requestedFood: ctx.requestedFood,
      budgetRecommendations: ctx.budgetRecommendations,
      isAlternative: ctx.isAlternative,
      userId: `user_${userId.slice(-6)}`,
      userRole: role,
      authenticated: true,
      userName,
      currentPage: dto.currentPage || "/",
      currentModule: dto.currentModule || "home",
      permissions: ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["customer"],
      recentActions: dto.recentActions || [],
      preferredLanguage: dto.preferredLanguage || "en"
    };

    return await this.geminiClient.chat(
      { message: chatReq.message, userId, role, contextData: sanitizedCtx },
      requestId
    );
  }

  async feedback(messageId: string, message: string, reply: string, role: string, feedback: number, requestId: string): Promise<void> {
    if (!messageId || !message || !reply || !role || ![1, -1].includes(feedback)) {
      throw new ValidationError("Missing or invalid feedback fields");
    }
    await this.geminiClient.sendFeedback({ messageId, message, reply, role, feedback }, requestId);
  }

  private async fetchContext(token: string, restaurantId: string | undefined, requestId: string, role: string, userMessage?: string): Promise<any> {
    const headers = { Authorization: `Bearer ${token}`, "X-Correlation-ID": requestId };
    const ctx = {
      orders: [] as any[],
      menu_items: [] as any[],
      coupons: [] as any[],
      budgetRange: undefined as any,
      requestedFood: undefined as any,
      budgetRecommendations: [] as any[],
      isAlternative: false
    };

    if (role === "customer" || role === "admin") {
      try {
        const url = role === "admin" ? "/api/v1/admin/orders" : "/api/v1/orders/me";
        const r = await this.ctxAxios.get(url, { headers, params: { limit: 5 } });
        const raw = r.data;
        ctx.orders = raw?.data ?? [];
      } catch (e) {
        console.warn("fetch_orders_context_failed:", e);
      }
    }

    if (userMessage && (role === "customer" || role === "admin")) {
      const budget = parseBudgetFromMessage(userMessage);
      if (budget) {
        ctx.budgetRange = budget;
        const requestedFood = cleanMessageForSearch(userMessage);
        if (requestedFood) {
          ctx.requestedFood = requestedFood;
        }

        console.log("[BudgetRec] extracted budget:", {
          requestId,
          userMessage,
          parsedBudget: budget,
          requestedFood: requestedFood || "(empty after cleaning)"
        });

        let longitude = 88.3639;
        let latitude = 22.5726;
        try {
          const rAddr = await this.ctxAxios.get("/api/v1/addresses", { headers });
          if (rAddr.data && rAddr.data.success && Array.isArray(rAddr.data.data) && rAddr.data.data.length > 0) {
            const primaryAddr = rAddr.data.data[0];
            if (primaryAddr.longitude && primaryAddr.latitude) {
              longitude = primaryAddr.longitude;
              latitude = primaryAddr.latitude;
            }
          }
        } catch (e) {
          console.warn("fetch_addresses_context_failed:", e);
        }

        try {
          const rSearch = await this.ctxAxios.get("/api/v1/search/budget", {
            headers,
            params: {
              minPrice: budget.min,
              maxPrice: budget.max,
              latitude,
              longitude,
              radius: 10000
            }
          });

          if (rSearch.data && rSearch.data.success && Array.isArray(rSearch.data.data)) {
            const items = rSearch.data.data;

            if (items.length > 0) {
              ctx.budgetRecommendations = items.map((r: any) => ({
                name: r?.item?.name || "Unknown Item",
                price: r?.item?.price || 0,
                restaurantName: r?.restaurant?.name || "Unknown Restaurant"
              }));
              ctx.isAlternative = false;
            } else {
              // Nothing in budget — fetch closest alternatives (no price filter)
              const rAlt = await this.ctxAxios.get("/api/v1/search/budget", {
                headers,
                params: { minPrice: 1, maxPrice: 99999, latitude, longitude, radius: 10000 }
              });
              const altItems = rAlt.data?.data ?? [];
              ctx.budgetRecommendations = altItems.slice(0, 10).map((r: any) => ({
                name: r?.item?.name || "Unknown Item",
                price: r?.item?.price || 0,
                restaurantName: r?.restaurant?.name || "Unknown Restaurant"
              }));
              ctx.isAlternative = true;
            }

            console.log("[BudgetRec] search result:", {
              requestId,
              itemsReturnedByBackend: items.length,
              recommendationsSent: ctx.budgetRecommendations.length,
              isAlternative: ctx.isAlternative
            });
          } else {
            console.warn("[BudgetRec] search response missing/malformed data:", {
              requestId,
              success: rSearch?.data?.success,
              isArray: Array.isArray(rSearch?.data?.data)
            });
          }
        } catch (e: any) {
          console.error(JSON.stringify({
            requestId,
            controller: "AiController",
            service: "AiService",
            function: "fetchContext - search/menu-items",
            error: e.message,
            stack: e.stack,
            axiosStatus: e.response?.status,
            axiosResponse: e.response?.data,
            axiosUrl: e.config?.url,
            axiosPayload: e.config?.params
          }));
        }
      }
    }

    return ctx;
  }
}

function parseBudgetFromMessage(message: string): { min: number; max: number } | null {
  let msg = message.toLowerCase();

  const bengaliDigits: Record<string, string> = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
  const hindiDigits: Record<string, string> = { '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' };

  for (const [k, v] of Object.entries(bengaliDigits)) {
    msg = msg.split(k).join(v);
  }
  for (const [k, v] of Object.entries(hindiDigits)) {
    msg = msg.split(k).join(v);
  }

  const rangeMatch = msg.match(/(?:between|from)?\s*(?:₹|rs\.?|usd|\$)?\s*(\d+)\s*(?:to|and|-|–|—|se|theke|থেকে|সে|সে)\s*(?:₹|rs\.?|usd|\$)?\s*(\d+)/i);
  if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
    let min = parseInt(rangeMatch[1], 10);
    let max = parseInt(rangeMatch[2], 10);
    if (min > max) {
      [min, max] = [max, min];
    }
    return { min, max };
  }

  const underMatch1 = msg.match(/(?:under|below|less than|within|upto|up to|কম|নিচে|কমের মধ্যে|মধ্যে|se kam|kam|andar|ke andar|mein|me)\s*(?:₹|rs\.?|usd|\$)?\s*(\d+)/i);
  if (underMatch1 && underMatch1[1]) {
    return { min: 1, max: parseInt(underMatch1[1], 10) };
  }

  const underMatch2 = msg.match(/(\d+)[-\s]*(?:টাকার|টাকা|rupee|rupees|rs|র|এর)?\s*(?:নিচে|কম|কমের মধ্যে|কমের|মধ্যে|se kam|kam|below|under|mein|me|andar|ke andar)/i);
  if (underMatch2 && underMatch2[1]) {
    return { min: 1, max: parseInt(underMatch2[1], 10) };
  }

  const budgetKeywords = ["budget", "price", "under", "below", "between", "niche", "kam", "se", "to", "কম", "নিচে", "টাকা", "₹", "rs", "মধ্যে", "andar", "mein"];
  const hasKeyword = budgetKeywords.some(kw => msg.includes(kw));
  const numbers = msg.match(/\d+/g);
  if (hasKeyword && numbers && numbers.length > 0) {
    if (numbers.length === 1 && numbers[0]) {
      return { min: 1, max: parseInt(numbers[0], 10) };
    } else if (numbers.length >= 2 && numbers[0] && numbers[1]) {
      let num1 = parseInt(numbers[0], 10);
      let num2 = parseInt(numbers[1], 10);
      if (num1 > num2) {
        [num1, num2] = [num2, num1];
      }
      return { min: num1, max: num2 };
    }
  }

  return null;
}

const SEARCH_STOPWORDS = new Set([
  "show", "all", "me", "my", "the", "a", "an", "list", "give", "gimme", "find", "search", "for",
  "some", "any", "please", "kindly", "name", "names", "food", "foods", "item", "items",
  "option", "options", "dish", "dishes", "near", "nearby", "of", "in", "at", "that",
  "those", "these", "this", "i", "want", "would", "like", "to", "and", "with", "is",
  "are", "there", "tell", "best", "suggest", "recommend", "get", "can", "you",
  "rs", "inr", "rupee", "rupees", "usd", "price", "under", "below", "within", "budget",
  "khabar", "khabo", "khana", "khaana", "chai", "dao", "dekhao", "khunje", "amake", "bolo",
  "mujhe", "bataoo", "bataao", "dikhao", "dhoondo", "chahiye",
  "আমাকে", "বলো", "খুঁজে", "দাও", "দেখাও", "খাবার",
  "मुझे", "बताओ", "दिखाओ", "ढूंढो", "खाना", "चाहिए"
]);

function cleanMessageForSearch(message: string): string {
  let cleaned = message.toLowerCase();

  const digitsMap: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
  };
  for (const [k, v] of Object.entries(digitsMap)) {
    cleaned = cleaned.split(k).join(v);
  }

  cleaned = cleaned.replace(/(?:between|from)?\s*(?:₹|rs\.?|usd|\$)?\s*\d+\s*(?:to|and|-|–|—|se|theke|থেকে|সে|সে)\s*(?:₹|rs\.?|usd|\$)?\s*\d+/gi, " ");
  cleaned = cleaned.replace(/(?:under|below|less than|within|upto|up to|কম|নিচে|কমের মধ্যে|মধ্যে|se kam|kam|andar|ke andar|mein|me)\s*(?:₹|rs\.?|usd|\$)?\s*\d+/gi, " ");
  cleaned = cleaned.replace(/\d+[-\s]*(?:টাকার|টাকা|rupee|rupees|rs|র|এর)?\s*(?:নিচে|কম|কমের মধ্যে|কমের|মধ্যে|se kam|kam|below|under|mein|me|andar|ke andar)/gi, " ");
  cleaned = cleaned.replace(/(?:₹|rs\.?|usd|\$)\s*\d+/gi, " ");

  cleaned = cleaned.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, " ");

  cleaned = cleaned
    .split(/\s+/)
    .filter(word => word.length > 0 && !SEARCH_STOPWORDS.has(word) && !/^\d+$/.test(word))
    .join(" ")
    .trim();

  return cleaned;
}