import axios from "axios";
import { IRestaurantEventPublisher } from "../interfaces/IRestaurantEventPublisher.js";
import { getRabbitMQChannel } from "../config/rabbitmq.js";

export class RestaurantEventPublisher implements IRestaurantEventPublisher {
  async publishOrderNew(orderId: string, restaurantId: string): Promise<void> {
    const emitUrl = `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`;
    const emitHeaders = { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! };
    try {
      await axios.post(
        emitUrl,
        {
          event: "order:new",
          room: `Restaurant:${restaurantId}`,
          payload: { orderId }
        },
        { headers: emitHeaders }
      );
    } catch (err: any) {
      console.error("Socket emit failed for new order:", err.message);
    }
  }

  async publishOrderUpdate(orderId: string, userId: string, restaurantId: string, status: string, riderId?: string | null): Promise<void> {
    const emitUrl = `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`;
    const emitHeaders = { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! };
    const payload = { orderId, status };

    const emits = [
      axios.post(emitUrl, { event: "order:update", room: `User:${userId}`, payload }, { headers: emitHeaders }),
      axios.post(emitUrl, { event: "order:update", room: `Restaurant:${restaurantId}`, payload }, { headers: emitHeaders }),
      axios.post(emitUrl, { event: "order:update", room: "Admin", payload }, { headers: emitHeaders })
    ];

    if (riderId) {
      emits.push(
        axios.post(emitUrl, { event: "order:update", room: `Rider:${riderId}`, payload }, { headers: emitHeaders })
      );
    }

    Promise.allSettled(emits).then((results) => {
      results.forEach((r) => {
        if (r.status === "rejected") {
          console.error("Socket emit failed for order update:", r.reason?.message);
        }
      });
    });
  }

  async publishOrderReadyForRider(orderId: string, restaurantId: string, location: any): Promise<void> {
    try {
      const channel = getRabbitMQChannel();
      const message = JSON.stringify({
        type: "ORDER_READY_FOR_RIDER",
        data: { orderId, restaurantId, location }
      });
      const queueName = process.env.ORDER_READY_QUEUE!;
      const sent = channel.sendToQueue(queueName, Buffer.from(message), {
        persistent: true
      });
      if (!sent) {
        throw new Error("RabbitMQ buffer full");
      }
    } catch (err: any) {
      console.error("RabbitMQ publish failed for ORDER_READY_FOR_RIDER:", err.message);
    }
  }

  async publishMenuItemAvailability(restaurantId: string, payload: any): Promise<void> {
    const emitUrl = `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`;
    const emitHeaders = { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! };
    try {
      await axios.post(
        emitUrl,
        {
          event: "menuitem:availability",
          room: `Restaurant:${restaurantId}`,
          payload
        },
        { headers: emitHeaders }
      );
    } catch (err: any) {
      console.error("Socket emit failed for menuitem availability:", err.message);
    }
  }

  async publishMenuItemDeleted(restaurantId: string, itemId: string): Promise<void> {
    const emitUrl = `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`;
    const emitHeaders = { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! };
    try {
      await axios.post(
        emitUrl,
        {
          event: "menuitem:deleted",
          room: `Restaurant:${restaurantId}`,
          payload: { itemId }
        },
        { headers: emitHeaders }
      );
    } catch (err: any) {
      console.error("Socket emit failed for menuitem deleted:", err.message);
    }
  }

  async publishRestaurantStatus(restaurantId: string, isOpen: boolean): Promise<void> {
    const emitUrl = `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`;
    const emitHeaders = { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! };
    const payload = { restaurantId, isOpen };

    const emits = [
      axios.post(emitUrl, { event: "restaurant:status", room: `Restaurant:${restaurantId}`, payload }, { headers: emitHeaders }),
      axios.post(emitUrl, { event: "admin:restaurant:status", room: "Admin", payload }, { headers: emitHeaders })
    ];

    Promise.allSettled(emits).then((results) => {
      results.forEach((r) => {
        if (r.status === "rejected") {
          console.error("Socket emit failed for restaurant status:", r.reason?.message);
        }
      });
    });
  }

  async publishRiderRated(riderId: string, rating: number): Promise<void> {
    try {
      const channel = getRabbitMQChannel();
      const message = JSON.stringify({
        type: "RIDER_RATED",
        data: { riderId, rating }
      });
      const queueName = process.env.RIDER_QUEUE!;
      const sent = channel.sendToQueue(queueName, Buffer.from(message), {
        persistent: true
      });
      if (!sent) {
        throw new Error("RabbitMQ buffer full");
      }
    } catch (err: any) {
      console.error("RabbitMQ publish failed for RIDER_RATED:", err.message);
    }
  }
}
