import { getRabbitMQChannel } from "./rabbitmq.js";
import { cache } from "../services/index.js";
import { Restaurant as RestaurantModel } from "../model/Restaurant.js";

export const startAdminEventConsumer = async () => {
  const channel = getRabbitMQChannel();

  channel.consume(process.env.RESTAURANT_ADMIN_EVENT_QUEUE!, async (msg) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString());

      if (event.type === "RESTAURANT_LOCATION_APPROVED") {
        const { restaurantId, location, autoLocation, adminId, reason } = event.data;
        const rest = await RestaurantModel.findByIdAndUpdate(
          restaurantId,
          {
            $set: {
              location,
              locationReviewStatus: "APPROVED",
              locationReviewedBy: adminId,
              locationReviewedAt: new Date(),
              locationReviewReason: reason || undefined,
              autoLocation
            },
            $unset: {
              pendingLocation: ""
            },
            $inc: {
              locationVersion: 1
            }
          },
          { new: true }
        );
        if (rest) {
          await cache.delete(`restaurant_details:${restaurantId}`);
          await cache.delete(`restaurant_details:${rest.slug}`);
          console.log(`🧹 Updated location and invalidated caches for restaurant: ${restaurantId}`);
        }
      } else if (event.type === "RESTAURANT_LOCATION_REJECTED") {
        const { restaurantId, adminId, reason } = event.data;
        const rest = await RestaurantModel.findByIdAndUpdate(
          restaurantId,
          {
            $set: {
              locationReviewStatus: "REJECTED",
              locationReviewedBy: adminId,
              locationReviewedAt: new Date(),
              locationRejectionReason: reason || undefined
            },
            $unset: {
              pendingLocation: ""
            },
            $inc: {
              locationVersion: 1
            }
          },
          { new: true }
        );
        if (rest) {
          await cache.delete(`restaurant_details:${restaurantId}`);
          await cache.delete(`restaurant_details:${rest.slug}`);
          console.log(`🧹 Rejected location update and invalidated caches for restaurant: ${restaurantId}`);
        }
      }

      channel.ack(msg);
    } catch (error) {
      console.error("❌ Error processing admin event in restaurant service:", error);
      channel.ack(msg);
    }
  });
};
