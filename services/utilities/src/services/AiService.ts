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

    const ctx = await this.fetchContext(token, dto.restaurantId, requestId, role);

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

  private async fetchContext(token: string, restaurantId: string | undefined, requestId: string, role: string): Promise<any> {
    const headers = { Authorization: `Bearer ${token}`, "X-Correlation-ID": requestId };
    const ctx = { orders: [] as any[], menu_items: [] as any[], coupons: [] as any[] };

    if (role === "customer" || role === "admin") {
      try {
        const r = await this.ctxAxios.get("/api/v1/orders/me", { headers, params: { limit: 5 } });
        const raw = r.data?.data?.orders ?? r.data?.data ?? [];
        ctx.orders = raw.map((o: any) => ({ id: o._id ?? o.id, status: o.status }));
      } catch (e: any) {
        console.warn("ctx_orders_failed:", e.message);
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
