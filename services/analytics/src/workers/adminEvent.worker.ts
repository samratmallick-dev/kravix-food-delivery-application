import { Channel } from "amqplib";
import { ICache } from "../interfaces/ICache.js";

export class AdminEventWorker {
  constructor(
    private readonly channel: Channel,
    private readonly queueName: string,
    private readonly cache: ICache
  ) {}

  async start(): Promise<void> {
    await this.channel.consume(this.queueName, async (msg) => {
      if (!msg) return;
      try {
        const event = JSON.parse(msg.content.toString());
        if (["ORDER_PLACED", "RIDER_RATED", "REVIEWS_MODERATED"].includes(event.type)) {
          await this.cache.clear();
          console.log("[Analytics Cache] Invalidated due to event:", event.type);
        }
        this.channel.ack(msg);
      } catch (err) {
        console.error("Error processing event in Analytics Service:", err);
        this.channel.ack(msg);
      }
    });
  }
}
