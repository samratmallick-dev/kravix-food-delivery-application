import { getRabbitMQChannel } from "./rabbitmq.js";
import { Rider } from "../model/Rider.js";

export const startRatingConsumer = async () => {
      const channel = getRabbitMQChannel();

      console.log(
            `[*] Starting Rider Rating Consumer on queue: ${process.env.RIDER_QUEUE}`,
      );

      channel.consume(process.env.RIDER_QUEUE!, async (msg) => {
            if (!msg) return;

            try {
                  const event = JSON.parse(msg.content.toString());

                  if (event.type !== "RIDER_RATED") {
                        channel.ack(msg);
                        return;
                  }

                  const { riderId, rating } = event.data;

                  if (!riderId || rating === undefined) {
                        console.error("Malformed RIDER_RATED payload:", event.data);
                        channel.ack(msg);
                        return;
                  }

                  const rider = await Rider.findById(riderId);

                  if (rider) {
                        const currentRatingCount = rider.ratingCount || 0;
                        const currentRating = rider.rating || 0;
                        const newRatingCount = currentRatingCount + 1;
                        const newRating =
                              (currentRating * currentRatingCount + rating) / newRatingCount;

                        rider.ratingCount = newRatingCount;
                        rider.rating = Math.round(newRating * 100) / 100;
                        await rider.save();

                        console.log(
                              `Updated Rider ${riderId}: ratingCount=${newRatingCount}, rating=${rider.rating}`,
                        );
                  } else {
                        console.warn(`Rider not found for ID: ${riderId}`);
                  }

                  channel.ack(msg);
            } catch (error) {
                  console.error(
                        "Error processing RIDER_RATED event in Rider Service:",
                        error,
                  );
                  channel.ack(msg);
            }
      });
};