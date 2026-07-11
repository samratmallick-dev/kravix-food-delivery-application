import axios from "axios";
import http from "http";
import https from "https";
import { IAIService } from "../interfaces/IAIService.js";
import { IGeminiClient } from "../interfaces/IGeminiClient.js";
import { ChatRequestFactory } from "../factories/ChatRequestFactory.js";
import { AiChatDto, AiResponseDto } from "../dto/AiChatDto.js";
import { ValidationError, ExternalServiceError } from "../utils/errors.js";

function normalizeDigits(text: string): string {
  const map: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
  };
  return text.split('').map(char => map[char] ?? char).join('');
}

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

    const ctx = await this.fetchContext(token, dto.restaurantId, requestId, role);

    // 1. Parse budget range
    let minBudget: number | null = null;
    let maxBudget: number | null = null;

    const normalizedMessage = normalizeDigits(dto.message);
    const rangeMatch = normalizedMessage.match(/(?:between|from)?\s*(?:₹|rs\.?|usd|\$)?\s*(\d+)\s*(?:to|and|-|–|—)\s*(?:₹|rs\.?|usd|\$)?\s*(\d+)/i);
    if (rangeMatch) {
      minBudget = parseInt(rangeMatch[1]!);
      maxBudget = parseInt(rangeMatch[2]!);
    } else {
      const underMatch1 = normalizedMessage.match(/(?:under|less than|below|within|upto|up to|কম|নিচে|কমের মধ্যে|se kam|kam)\s*(?:₹|rs\.?|usd|\$)?\s*(\d+)/i);
      const underMatch2 = normalizedMessage.match(/(\d+)\s*(?:টাকার|টাকা|rupee|rupees|rs)?\s*(?:নিচে|কম|কমের মধ্যে|কমের|se kam|kam|below|under)/i);
      
      if (underMatch1) {
        minBudget = 1;
        maxBudget = parseInt(underMatch1[1]!);
      } else if (underMatch2) {
        minBudget = 1;
        maxBudget = parseInt(underMatch2[1]!);
      }
    }

    if (minBudget !== null && maxBudget !== null && minBudget > maxBudget) {
      const temp = minBudget;
      minBudget = maxBudget;
      maxBudget = temp;
    }

    // 2. Resolve coordinates
    let lat = dto.latitude;
    let lng = dto.longitude;
    if (!lat || !lng) {
      lat = ctx.latitude;
      lng = ctx.longitude;
    }
    if (!lat || !lng) {
      lat = 22.5726;
      lng = 88.3639;
    }

    // 3. Process budget recommendations if budget range was extracted
    const headers = { Authorization: `Bearer ${token}`, "X-Correlation-ID": requestId };
    let budgetRecs: any[] = [];
    let isAlternative = false;

    if (maxBudget !== null) {
      try {
        const restRes = await this.ctxAxios.get("/api/v1/restaurants", {
          headers,
          params: { latitude: lat, longitude: lng, radius: 10000 }
        });
        const restaurants = restRes.data?.data ?? [];

        if (restaurants.length > 0) {
          const detailsPromises = restaurants.map(async (restaurant: any) => {
            try {
              const menuRes = await this.ctxAxios.get(`/api/v1/menu-items/${restaurant._id}`, { headers });
              const menuItems = menuRes.data?.data ?? [];
              return { restaurant, menuItems };
            } catch (e) {
              return { restaurant, menuItems: [] };
            }
          });

          const resolvedDetails = await Promise.all(detailsPromises);
          const candidateItems: any[] = [];
          const allItems: any[] = [];

          for (const detail of resolvedDetails) {
            const { restaurant, menuItems } = detail;
            for (const item of menuItems) {
              if (!item.isAvailable) continue;

              const promoBoost = ctx.coupons.some((c: any) => c.isActive && c.restaurantId === restaurant._id) ? 1.5 : 0;
              const distance = restaurant.distanceKm ?? 1;
              const deliveryTime = 15 + Math.round(distance * 4);
              
              const nameSum = item.name.split("").reduce((sum: number, c: string) => sum + c.charCodeAt(0), 0);
              const popularity = (nameSum % 10) / 2;
              const ordersCount = Math.round(nameSum * 1.5) % 150;
              const score = (popularity * 2) - (distance * 0.5) + promoBoost;

              const itemDetails = {
                id: item._id,
                name: item.name,
                price: item.price,
                description: item.description,
                restaurantName: restaurant.name,
                distance: parseFloat(distance.toFixed(2)),
                deliveryTime,
                ordersCount,
                score,
                isAlternative: false
              };

              allItems.push(itemDetails);

              if (item.price >= (minBudget ?? 1) && item.price <= maxBudget) {
                candidateItems.push(itemDetails);
              }
            }
          }

          if (candidateItems.length > 0) {
            candidateItems.sort((a, b) => b.score - a.score);
            budgetRecs = candidateItems.slice(0, 10);
          } else {
            isAlternative = true;
            const alternatives = allItems.filter(item => item.price > maxBudget!);
            alternatives.sort((a, b) => {
              if (a.price !== b.price) return a.price - b.price;
              return a.distance - b.distance;
            });
            budgetRecs = alternatives.slice(0, 5).map(item => ({ ...item, isAlternative: true }));
          }
        }
      } catch (e: any) {
        console.warn("budget_recommendation_process_failed:", e.message);
      }
    }

    const sanitizedCtx = {
      orders: ctx.orders,
      menu_items: ctx.menu_items,
      coupons: ctx.coupons,
      userId: `user_${userId.slice(-6)}`,
      userRole: role,
      authenticated: true,
      userName,
      currentPage: dto.currentPage || "/",
      currentModule: dto.currentModule || "home",
      permissions: ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["customer"],
      recentActions: dto.recentActions || [],
      preferredLanguage: dto.preferredLanguage || "en",
      latitude: lat,
      longitude: lng,
      ...(maxBudget !== null ? {
        budgetRange: { min: minBudget ?? 1, max: maxBudget },
        budgetRecommendations: budgetRecs
      } : {})
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

  private async fetchContext(token: string, restaurantId: string | undefined, requestId: string, role: string): Promise<any> {
    const headers = { Authorization: `Bearer ${token}`, "X-Correlation-ID": requestId };
    const ctx = { 
      orders: [] as any[], 
      menu_items: [] as any[], 
      coupons: [] as any[],
      latitude: undefined as number | undefined,
      longitude: undefined as number | undefined
    };

    if (role === "customer" || role === "admin") {
      try {
        const url = role === "admin" ? "/api/v1/admin/orders" : "/api/v1/orders/me";
        const r = await this.ctxAxios.get(url, { headers, params: { limit: 5 } });
        const raw = r.data?.data?.orders ?? r.data?.data ?? [];
        ctx.orders = raw.map((o: any) => ({
          id: o._id ?? o.id?.slice(0, 20).toUpperCase() ?? "UNKNOWN",
          status: o.status,
          restaurantName: o.restaurantName,
          riderName: o.riderName,
          riderPhoneNumber: o.riderPhoneNumber,
          totalAmount: o.totalAmount,
          items: (o.items || []).map((i: any) => ({ name: i.name, quantity: i.quantity }))
        }));
      } catch (e: any) {
        console.warn("ctx_orders_failed:", e.message);
      }

      // Fetch saved addresses to resolve location coordinates
      try {
        const r = await this.ctxAxios.get("/api/v1/addresses", { headers });
        const addresses = r.data?.data ?? [];
        if (addresses.length > 0) {
          ctx.latitude = addresses[0].latitude;
          ctx.longitude = addresses[0].longitude;
        }
      } catch (e: any) {
        console.warn("ctx_addresses_failed:", e.message);
      }
    }

    if (restaurantId && (role === "customer" || role === "seller" || role === "admin")) {
      try {
        const r = await this.ctxAxios.get(`/api/v1/menu/${restaurantId}`, { headers });
        const raw = r.data?.data?.menuItems ?? r.data?.data ?? [];
        ctx.menu_items = raw.slice(0, 10).map((i: any) => ({
          name: i.name,
          price: i.price,
          available: i.isAvailable ?? true
        }));
      } catch (e: any) {
        console.warn("ctx_menu_failed:", e.message);
      }
    }

    if (role === "customer" || role === "seller" || role === "admin") {
      const key = restaurantId || "global";
      const now = Date.now();
      if (this.couponCache[key] && now - this.couponCache[key]!.ts < this.COUPON_CACHE_TTL_MS) {
        ctx.coupons = this.couponCache[key]!.data;
      } else {
        try {
          const r = await this.ctxAxios.get("/api/v1/coupons", {
            headers,
            params: restaurantId ? { restaurantId } : {}
          });
          const raw = (r.data?.data ?? []).slice(0, 5).map((c: any) => ({
            code: c.code,
            discountType: c.discountType,
            discountValue: c.discountValue,
            couponType: c.couponType,
            isActive: c.isActive
          }));
          this.couponCache[key] = { data: raw, ts: now };
          ctx.coupons = raw;
        } catch (e: any) {
          console.warn("ctx_coupons_failed:", e.message);
        }
      }
    }

    return ctx;
  }
}
