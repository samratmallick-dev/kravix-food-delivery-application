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
                        channel.ack(msg)
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
                        { returnDocument: "after" }
                  );

                  if (!order) {
                        channel.ack(msg);
                        return;
                  }
                  console.log("✅ Order Placed: ", order._id);

                  await axios.post(`${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/emit`, {
                        event: "order:new",
                        room: `restaurant: ${order.restaurantId}`,
                        payload: {
                              orderId: order._id,
                        }
                  }, {
                        headers: {
                              "x-internal-key": process.env.INTERNAL_SERVICE_KEY!
                        },
                        withCredentials: true
                  })

                  channel.ack(msg);
            } catch (error) {
                  console.error("❌ Error processing payment:", error);
                  channel.ack(msg);
            }
      });

};