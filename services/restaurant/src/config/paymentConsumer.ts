import axios from "axios";
import { Order } from "../model/Order.js";
import { getRabbitMQChannel } from "./rabbitmq.js";

export const startPayment = async () => {
      const channel = getRabbitMQChannel();

      channel.consume(process.env.PAYMENT_QUEUE!, async (msg) => {
            if (!msg) return;
            try {
                  const event = JSON.parse(msg.content.toString());

                  if (event.type !== "PAYMENT_SUCCESS") {
                        channel.ack(msg);
                        return;
                  }

                  const { orderId } = event.data;

                  const order = await Order.findOneAndUpdate(
                        {
                              _id: orderId,
                              paymentStatus: { $ne: "paid" }
                        },
                        {
                              $set: {
                                    paymentStatus: "paid",
                                    status: "placed"
                              },
                              $unset: {
                                    expiresAt: 1
                              }
                        },
                        { new: true }
                  );

                  if (!order) {
                        channel.ack(msg);
                        return;
                  }
                  console.log("✅ Order Placed: ", order._id);

                  channel.ack(msg);

                  axios.post(
                        `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`,
                        {
                              event: "order:new",
                              room: `Restaurant:${order.restaurantId}`,
                              payload: { orderId: order._id }
                        },
                        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } }
                  ).catch((err) => console.error("❌ Realtime socket emit failed:", err.message));

                  const adminPayload = JSON.stringify({
                        type: "ORDER_PLACED",
                        data: {
                              orderId: order._id.toString(),
                              restaurantId: order.restaurantId,
                              restaurantName: order.restaurantName,
                              totalAmount: order.totalAmount,
                              status: order.status,
                              paymentMethod: order.paymentMethod,
                              createdAt: order.createdAt,
                        },
                  });
                  channel.sendToQueue(
                        process.env.ADMIN_EVENT_QUEUE!,
                        Buffer.from(adminPayload),
                        { persistent: true }
                  );
                  console.log(`📤 Published ORDER_PLACED to admin_event_queue for order ${order._id}`);
            } catch (error) {
                  console.error("❌ Error processing payment:", error);
                  channel.ack(msg);
            }
      });
};