import { Channel } from "amqplib";
import { IRiderService } from "../interfaces/IRiderService.js";

export class RatingWorker {
  constructor(
    private readonly channel: Channel,
    private readonly queueName: string,
    private readonly riderService: IRiderService
  ) {}

  async start(): Promise<void> {
    console.log(`[*] Starting Rider Rating Consumer on queue: ${this.queueName}`);

    await this.channel.consume(this.queueName, async (msg) => {
      if (!msg) return;

      try {
        const event = JSON.parse(msg.content.toString());
        if (event.type !== "RIDER_RATED") {
          this.channel.ack(msg);
          return;
        }

        const { riderId, rating } = event.data;
        if (!riderId || rating === undefined) {
          console.error("Malformed RIDER_RATED payload:", event.data);
          this.channel.ack(msg);
          return;
        }

        await this.riderService.handleRiderRated(riderId, rating);
        this.channel.ack(msg);
      } catch (error) {
        console.error("Error processing RIDER_RATED event:", error);
        this.channel.ack(msg);
      }
    });
  }
}
