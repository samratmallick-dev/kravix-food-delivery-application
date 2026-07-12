import axios from "axios";
import { IAdminEventPublisher } from "../interfaces/IAdminEventPublisher.js";
import { publishAdminEvent } from "../config/rabbitmq.js";

export class AdminEventPublisher implements IAdminEventPublisher {
  async publishRestaurantVerified(restaurantId: string, ownerId: string, isVerified: boolean): Promise<void> {
    const eventData = { restaurantId, ownerId, isVerified };
    await this.emitSocketAndMQ("restaurant:verified", `Restaurant:${restaurantId}`, eventData, "RESTAURANT_VERIFIED");
    await this.emitSocketAndMQ("restaurant:verified", `RestaurantStatus:${restaurantId}`, eventData, "RESTAURANT_VERIFIED");
    await this.emitSocketAndMQ("admin:restaurant:verified", "Admin", eventData, "RESTAURANT_VERIFIED");
  }

  async publishRestaurantDeleted(restaurantId: string, ownerId: string): Promise<void> {
    const eventData = { restaurantId, ownerId };
    await this.emitSocketAndMQ("restaurant:deleted", `Restaurant:${restaurantId}`, eventData, "RESTAURANT_DELETED");
    await this.emitSocketAndMQ("restaurant:deleted", `RestaurantStatus:${restaurantId}`, eventData, "RESTAURANT_DELETED");
    await this.emitSocketAndMQ("admin:restaurant:deleted", "Admin", eventData, "RESTAURANT_DELETED");
  }

  async publishRiderVerified(riderId: string, userId: string, isVerified: boolean): Promise<void> {
    const eventData = { riderId, userId, isVerified };
    await this.emitSocketAndMQ("rider:verified", `Rider:${riderId}`, eventData, "RIDER_VERIFIED");
    await this.emitSocketAndMQ("admin:rider:verified", "Admin", eventData, "RIDER_VERIFIED");
  }

  async publishRiderDeleted(riderId: string, userId: string): Promise<void> {
    const eventData = { riderId, userId };
    publishAdminEvent("RIDER_DELETED", eventData);
    await this.emitSocketAndMQ("admin:rider:deleted", "Admin", eventData, "RIDER_DELETED");
  }

  async publishUserBlockStatusChanged(
    userId: string,
    role: string | null,
    isBlocked: boolean,
    blockedUntil: Date | null,
    restaurantId: string | null
  ): Promise<void> {
    const eventData = {
      userId,
      role,
      isBlocked,
      blockedUntil: blockedUntil ? blockedUntil.toISOString() : null,
      restaurantId
    };
    publishAdminEvent("USER_BLOCK_STATUS_CHANGED", eventData);
  }

  async publishOrderCancelled(orderId: string, userId: string, restaurantId: string, riderId?: string | null): Promise<void> {
    const emitUrl = `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`;
    const emitHeaders = { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! };
    const payload = { orderId, status: "cancelled" };

    const emits = [
      axios.post(emitUrl, { event: "order:update", room: `User:${userId}`, payload }, { headers: emitHeaders }),
      axios.post(emitUrl, { event: "order:update", room: `Restaurant:${restaurantId}`, payload }, { headers: emitHeaders })
    ];

    if (riderId) {
      emits.push(
        axios.post(emitUrl, { event: "order:update", room: `Rider:${riderId}`, payload }, { headers: emitHeaders })
      );
    }

    Promise.allSettled(emits).then((results) => {
      results.forEach((r) => {
        if (r.status === "rejected") {
          console.error("Socket emit failed:", r.reason?.message);
        }
      });
    });
  }

  private async emitSocketAndMQ(event: string, room: string, payload: Record<string, any>, fallbackType: string): Promise<void> {
    try {
      await axios.post(
        `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`,
        { event, room, payload },
        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } }
      );
    } catch (err) {
      publishAdminEvent(fallbackType, payload);
    }
  }
}
