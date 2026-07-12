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
        const url = role === "admin" ? "/api/v1/admin/orders" : "/api/v1/orders/me";
        const r = await this.ctxAxios.get(url, { headers, params: { limit: 5 } });
        const raw = r.data; 
        ctx.orders = raw?.data ?? [];
      } catch (e) {
        console.warn("fetch_orders_context_failed:", e);
      }
    }
    return ctx;
  }
}