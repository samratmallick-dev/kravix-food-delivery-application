import { RiderRepository } from "./rider.repository.js";
import { WalletRepository } from "./wallet.repository.js";
import { ShiftRepository } from "./shift.repository.js";
import { NotificationRepository } from "./notification.repository.js";
import { TransactionRepository } from "./transaction.repository.js";
import { LeaderboardRepository } from "./leaderboard.repository.js";
import { LocationRepository } from "./location.repository.js";
import { OrderAssignmentRepository } from "./orderAssignment.repository.js";

export const riderRepository = new RiderRepository();
export const walletRepository = new WalletRepository();
export const shiftRepository = new ShiftRepository();
export const notificationRepository = new NotificationRepository();
export const transactionRepository = new TransactionRepository();
export const leaderboardRepository = new LeaderboardRepository();
export const locationRepository = new LocationRepository();
export const orderAssignmentRepository = new OrderAssignmentRepository();
export { RiderRepository, WalletRepository, ShiftRepository, NotificationRepository, TransactionRepository, LeaderboardRepository, LocationRepository, OrderAssignmentRepository };
