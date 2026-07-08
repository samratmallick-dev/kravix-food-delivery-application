import axios from "axios";
import { Channel } from "amqplib";
import { IRiderRepository } from "../interfaces/IRiderRepository.js";

export class OrderReadyWorker {
  constructor(
    private readonly channel: Channel,
    private readonly queueName: string,
    private readonly riderRepository: IRiderRepository
  ) {}

  async start(): Promise<void> {
    await this.channel.consume(
      this.queueName,
      async (msg) => {
        if (!msg) return;

        let parsed: any;
        try {
          parsed = JSON.parse(msg.content.toString());
        } catch (parseError) {
          console.error("Failed to parse RabbitMQ message:", parseError);
          this.channel.nack(msg, false, false);
          return;
        }

        try {
          if (parsed.type !== "ORDER_READY_FOR_RIDER") {
            this.channel.ack(msg);
            return;
          }

          const { orderId, restaurantId, location } = parsed.data;
          if (!orderId || !restaurantId || !location?.coordinates) {
            console.error("Malformed payload:", parsed.data);
            this.channel.nack(msg, false, false);
            return;
          }

          const maxDistance = Number(process.env.RIDER_SEARCH_RADIUS_METERS || "500");
          const riders = await this.riderRepository.findNearbyAvailable(
            location.coordinates as [number, number],
            maxDistance
          );

          if (riders.length === 0) {
            this.channel.ack(msg);
            return;
          }

          const emitResults = await Promise.allSettled(
            riders.map((rider) =>
              axios.post(
                `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`,
                {
                  event: "order:available",
                  room: `Rider:${rider.userId}`,
                  payload: { orderId, restaurantId }
                },
                {
                  headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! },
                  timeout: 5000
                }
              )
            )
          );

          const failed = emitResults.filter((r) => r.status === "rejected");
          if (failed.length > 0) {
            console.warn(`Failed to notify ${failed.length}/${riders.length} rider(s)`);
          }

          this.channel.ack(msg);
        } catch (error) {
          console.error("Error in orderReadyWorker:", error);
          if (msg.fields.redelivered) {
            this.channel.nack(msg, false, false);
          } else {
            this.channel.nack(msg, false, true);
          }
        }
      },
      { noAck: false }
    );
  }
}
