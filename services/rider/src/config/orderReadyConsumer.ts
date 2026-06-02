import axios from "axios";
import { getRabbitMQChannel } from "./rabbitmq.js";
import { Rider } from "../model/Rider.js";

export const orderReadyConsumer = async () => {
      const channel = getRabbitMQChannel();

      channel.consume(
            process.env.ORDER_READY_QUEUE!,
            async (msg) => {
                  if (!msg) return;

                  let parsed: any;

                  try {
                        parsed = JSON.parse(msg.content.toString());
                  } catch (parseError) {
                        console.error(
                              "Failed to parse RabbitMQ message — discarding:",
                              msg.content.toString(),
                              parseError,
                        );
                        channel.nack(msg, false, false);
                        return;
                  }

                  try {
                        if (parsed.type !== "ORDER_READY_FOR_RIDER") {
                              channel.ack(msg);
                              return;
                        }

                        const { orderId, restaurantId, location } = parsed.data;

                        if (!orderId || !restaurantId || !location?.coordinates) {
                              console.error(
                                    "Malformed ORDER_READY_FOR_RIDER payload — discarding:",
                                    parsed.data,
                              );
                              channel.nack(msg, false, false);
                              return;
                        }

                        const geoPoint = {
                              type: "Point" as const,
                              coordinates: location.coordinates as [number, number],
                        };
                        const maxDistance = Number(
                              process.env.RIDER_SEARCH_RADIUS_METERS ?? 500,
                        );

                        const riders = await Rider.find({
                              isAvailable: true,
                              isVerified: true,
                              location: {
                                    $near: {
                                          $geometry: geoPoint,
                                          $maxDistance: maxDistance,
                                    },
                              },
                        });

                        if (riders.length === 0) {
                              channel.ack(msg);
                              return;
                        }

                        const emitResults = await Promise.allSettled(
                              riders.map((rider) =>
                                    axios.post(
                                          `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`,
                                          {
                                                event: "order:available",
                                                room: `Rider:${rider.userId}`,
                                                payload: { orderId, restaurantId },
                                          },
                                          {
                                                headers: {
                                                      "x-internal-key": process.env.INTERNAL_SERVICE_KEY!,
                                                },
                                                timeout: 5000,
                                          },
                                    ),
                              ),
                        );

                        const failed = emitResults.filter((r) => r.status === "rejected");
                        if (failed.length > 0) {
                              console.warn(
                                    `Failed to notify ${failed.length}/${riders.length} rider(s):`,
                                    failed.map((r) => (r as PromiseRejectedResult).reason?.message),
                              );
                        }

                        channel.ack(msg);
                  } catch (error) {
                        console.error("Unhandled error in orderReadyConsumer:", error);

                        if (msg.fields.redelivered) {
                              channel.nack(msg, false, false);
                        } else {
                              channel.nack(msg, false, true);
                        }
                  }
            },
            { noAck: false },
      );
};