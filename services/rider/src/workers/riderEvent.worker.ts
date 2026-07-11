import { Channel } from "amqplib";
import { IRiderService } from "../interfaces/IRiderService.js";
import {
  walletRepository,
  orderAssignmentRepository,
  notificationRepository,
  riderRepository
} from "../repositories/index.js";
import { OrderAssignmentAggregate } from "../domain/aggregates/OrderAssignmentAggregate.js";
import { WalletAggregate } from "../domain/aggregates/WalletAggregate.js";

export class RiderEventWorker {
  constructor(
    private readonly channel: Channel,
    private readonly queueName: string,
    private readonly riderService: IRiderService
  ) {}

  async start(): Promise<void> {
    console.log(`[*] Starting Rider Event Worker on queue: ${this.queueName}`);

    await this.channel.consume(this.queueName, async (msg) => {
      if (!msg) return;

      try {
        const event = JSON.parse(msg.content.toString());
        console.log(`[RabbitMQ Consume] Received event type: "${event.type}"`);

        switch (event.type) {
          case "NEW_ORDER_AVAILABLE": {
            const { orderId, restaurantId, restaurantName, distance, fee } = event.data;
            console.log(`[Event Consumed] NEW_ORDER_AVAILABLE: ${orderId} from restaurant ${restaurantId}`);
            break;
          }

          case "PAYMENT_COMPLETED": {
            const { orderId, riderId, amount, tip } = event.data;
            if (riderId && amount) {
              const wallet = await walletRepository.findByRiderId(riderId);
              if (wallet) {
                wallet.creditAmount(amount, "earning");
                if (tip) wallet.creditAmount(tip, "tip");
                await walletRepository.save(wallet);
                console.log(`[Wallet Credited] Paid rider ${riderId} amount ₹${amount} for order ${orderId}`);
              }
            }
            break;
          }

          case "CUSTOMER_CANCELLED": {
            const { orderId, reason } = event.data;
            const assignment = await orderAssignmentRepository.findByOrderId(orderId);
            if (assignment) {
              assignment.cancel(reason || "Customer cancelled");
              await orderAssignmentRepository.save(assignment);

              await notificationRepository.create({
                riderId: assignment.riderId,
                title: "Order Cancelled",
                message: `Order #${orderId} was cancelled by the customer.`,
                category: "order",
                priority: "high",
                sound: "warning"
              });
            }
            break;
          }

          case "RESTAURANT_READY": {
            const { orderId } = event.data;
            const assignment = await orderAssignmentRepository.findByOrderId(orderId);
            if (assignment) {
              assignment.addTimelineEvent("ready", "Food preparation finished, ready for pickup");
              await orderAssignmentRepository.save(assignment);

              await notificationRepository.create({
                riderId: assignment.riderId,
                title: "Order Ready",
                message: `Order #${orderId} is ready for pickup at ${assignment.restaurantName}.`,
                category: "order",
                priority: "high",
                sound: "ready"
              });
            }
            break;
          }

          case "ORDER_ASSIGNED": {
            const { orderId, riderId, restaurantId, restaurantName, restaurantAddress, customerName, customerPhone, deliveryAddress, distance, fee, tip, etaMinutes, routePolyline } = event.data;
            if (orderId && riderId) {
              const newAssignment = new OrderAssignmentAggregate(
                "",
                orderId,
                riderId,
                restaurantId,
                restaurantName,
                restaurantAddress || null,
                customerName,
                customerPhone || null,
                deliveryAddress || null,
                "assigned",
                null,
                null,
                null,
                null,
                distance || 0,
                fee || 0,
                tip || 0,
                etaMinutes || 15,
                routePolyline || null,
                0,
                [{ status: "assigned", timestamp: new Date(), description: "Order assigned to rider" }]
              );
              await orderAssignmentRepository.create(newAssignment);
              console.log(`[Order Assignment Created] Assigned order ${orderId} to rider ${riderId}`);

              await notificationRepository.create({
                riderId,
                title: "New Delivery Assigned",
                message: `You have been assigned order #${orderId} from ${restaurantName}.`,
                category: "order",
                priority: "critical",
                sound: "new_order"
              });
            }
            break;
          }

          default:
            console.log(`[RabbitMQ Consume] Unhandled event type: "${event.type}"`);
        }

        this.channel.ack(msg);
      } catch (error) {
        console.error("Error processing Rider event message:", error);
        this.channel.ack(msg);
      }
    });
  }
}
