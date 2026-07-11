import axios from "axios";
import { IRiderService } from "../interfaces/IRiderService.js";
import { IRiderRepository } from "../interfaces/IRiderRepository.js";
import { CreateRiderDto, UpdateRiderLocationDto } from "../dto/CreateRiderDto.js";
import { NotFoundError, ValidationError, ConflictError, ExternalServiceError, AuthorizationError } from "../utils/errors.js";
import { Coordinates } from "../domain/valueObjects/Coordinates.js";
import { Vehicle } from "../domain/valueObjects/Vehicle.js";
import { RiderAggregate } from "../domain/aggregates/RiderAggregate.js";
import { WalletAggregate } from "../domain/aggregates/WalletAggregate.js";
import { ShiftAggregate } from "../domain/aggregates/ShiftAggregate.js";
import { OrderAssignmentAggregate } from "../domain/aggregates/OrderAssignmentAggregate.js";
import { RiderMapper } from "../mappers/rider.mapper.js";
import { WalletMapper } from "../mappers/wallet.mapper.js";
import { ShiftMapper } from "../mappers/shift.mapper.js";
import { OrderAssignmentMapper } from "../mappers/orderAssignment.mapper.js";
import { publishEvent } from "../infrastructure/messaging/eventPublisher.js";
import {
  walletRepository,
  shiftRepository,
  notificationRepository,
  transactionRepository,
  leaderboardRepository,
  locationRepository,
  orderAssignmentRepository
} from "../repositories/index.js";

export class RiderService implements IRiderService {
  constructor(private readonly riderRepository: IRiderRepository) {}

  async createProfile(userId: string, dto: CreateRiderDto): Promise<any> {
    const existing = await this.riderRepository.findByUserId(userId);
    if (existing) {
      throw new ConflictError("Rider profile already exists");
    }

    const coords = new Coordinates(dto.longitude, dto.latitude);
    const aggregate = new RiderAggregate(
      "",
      userId,
      dto.pictureUrl || "",
      dto.phoneNumber,
      dto.aadhaarNumber,
      dto.drivingLicesce,
      false,
      coords,
      "OFFLINE",
      new Date(),
      0,
      0,
      0,
      0,
      null,
      null,
      null,
      null,
      null
    );

    const saved = await this.riderRepository.create(aggregate);

    const wallet = new WalletAggregate("", saved.id, 0, 0, 0, 0, 0, 0);
    await walletRepository.create(wallet);

    return RiderMapper.toDto(saved);
  }

  async updateProfile(userId: string, updates: any): Promise<any> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) {
      throw new NotFoundError("Rider profile not found");
    }

    rider.updateProfile(
      updates.pictureUrl || updates.picture,
      updates.phoneNumber,
      updates.aadhaarNumber,
      updates.drivingLicesce,
      updates.address,
      updates.emergencyContact
    );

    const updated = await this.riderRepository.save(rider);
    return RiderMapper.toDto(updated);
  }

  async getProfile(userId: string): Promise<any> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) {
      throw new NotFoundError("Rider profile not found");
    }
    return RiderMapper.toDto(rider);
  }

  async toggleAvailability(userId: string, isAvailable: boolean, latitude: number, longitude: number): Promise<any> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) {
      throw new NotFoundError("Rider profile not found");
    }

    const status = isAvailable ? "ONLINE" : "OFFLINE";
    rider.updateStatus(status);
    
    const coords = new Coordinates(longitude, latitude);
    rider.location = coords;

    const updated = await this.riderRepository.save(rider);

    if (isAvailable) {
      await locationRepository.updateLiveLocation(rider.id, coords);
      await publishEvent("RIDER_ONLINE", { riderId: rider.id, location: coords.toArray() });
    } else {
      await publishEvent("RIDER_OFFLINE", { riderId: rider.id });
    }

    try {
      await axios.post(
        `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`,
        {
          event: "admin:rider:availability",
          room: "Admin",
          payload: { riderId: updated.id, isAvailable }
        },
        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } }
      );
    } catch (err: any) {
      console.error("Admin socket emit failed:", err.message);
    }

    return RiderMapper.toDto(updated);
  }

  async acceptOrder(userId: string, name: string, orderId: string): Promise<any> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) {
      throw new NotFoundError("Rider profile not found");
    }

    if (rider.availabilityStatus !== "ONLINE" && rider.availabilityStatus !== "BUSY") {
      throw new ValidationError("You must be online to accept an order");
    }

    try {
      const { data } = await axios.patch(
        `${process.env.RESTAURANT_SERVICE_URI}/api/v1/orders/internal/rider-assignment`,
        {
          orderId,
          riderId: rider.id,
          riderUserId: rider.userId,
          riderName: name,
          riderPhoneNumber: rider.phoneNumber
        },
        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } }
      );

      if (!data.success) {
        throw new Error(data.message);
      }

      rider.updateStatus("DELIVERING");
      await this.riderRepository.save(rider);

      const assignment = new OrderAssignmentAggregate(
        "",
        orderId,
        rider.id,
        data.data?.restaurantId || "Restaurant",
        data.data?.restaurantName || "Restaurant",
        data.data?.restaurantAddress || null,
        data.data?.customerName || "Customer",
        data.data?.customerPhone || null,
        data.data?.deliveryAddress || null,
        "accepted",
        new Date(),
        null,
        null,
        null,
        data.data?.distance || 1.5,
        data.data?.deliveryFee || 40,
        data.data?.tip || 0,
        data.data?.etaMinutes || 25,
        null,
        0,
        [{ status: "accepted", timestamp: new Date(), description: "Rider accepted the delivery" }]
      );
      await orderAssignmentRepository.create(assignment);

      await publishEvent("ORDER_ACCEPTED", { orderId, riderId: rider.id });

      return RiderMapper.toDto(rider);
    } catch (error: any) {
      throw new ValidationError(error.message || "Failed to accept order");
    }
  }

  async getCurrentOrder(userId: string): Promise<any> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) {
      throw new NotFoundError("Rider profile not found");
    }

    try {
      const { data } = await axios.get(
        `${process.env.RESTAURANT_SERVICE_URI}/api/v1/orders/internal/current?riderId=${rider.id}`,
        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } }
      );
      if (data.success) {
        const assignment = await orderAssignmentRepository.findActiveByRiderId(rider.id);
        const orderData = data.data;
        if (assignment) {
          orderData.timeline = assignment.timelineEvents;
          orderData.etaMinutes = assignment.etaMinutes;
          orderData.distance = assignment.distance;
          orderData.deliveryFee = assignment.deliveryFee;
          orderData.tip = assignment.tip;
        }
        return orderData;
      }
      throw new NotFoundError("No current order found");
    } catch (error: any) {
      if (error?.response?.status === 404) {
        throw new NotFoundError("No current order found");
      }
      throw new ExternalServiceError(error?.response?.data?.message || error?.message || "Failed to fetch current order");
    }
  }

  async updateOrderStatus(userId: string, body: any): Promise<any> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) {
      throw new NotFoundError("Rider profile not found");
    }

    const { orderId, latitude, longitude, otp, codPaymentMode } = body;
    const [riderLng, riderLat] = rider.location.toArray();
    const effectiveLat = latitude !== undefined ? Number(latitude) : riderLat;
    const effectiveLng = longitude !== undefined ? Number(longitude) : riderLng;

    if (otp !== undefined) {
      if (!rider.deliveryOtp || !rider.deliveryOtpExpiry) {
        throw new ValidationError("No OTP generated for this delivery");
      }
      if (new Date() > new Date(rider.deliveryOtpExpiry)) {
        throw new ValidationError("OTP has expired. Please request a new one.");
      }
      if (rider.deliveryOtp !== String(otp)) {
        throw new ValidationError("Invalid OTP");
      }
    }

    try {
      const assignment = await orderAssignmentRepository.findByOrderId(orderId);
      if (!assignment) {
        throw new NotFoundError("Order assignment log not found");
      }

      const { data } = await axios.patch(
        `${process.env.RESTAURANT_SERVICE_URI}/api/v1/orders/internal/status`,
        {
          orderId,
          riderId: rider.id,
          riderLat: effectiveLat,
          riderLng: effectiveLng
        },
        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } }
      );

      const updatedStatus = data.data?.status;

      if (updatedStatus === "picked_up") {
        assignment.pickup();
        await orderAssignmentRepository.save(assignment);
        await publishEvent("ORDER_PICKED", { orderId, riderId: rider.id });
      }

      if (updatedStatus === "delivered") {
        if (
          data.data?.paymentMethod === "cod" &&
          data.data?.paymentStatus === "cod_pending"
        ) {
          if (!codPaymentMode || !["cash", "upi", "card", "wallet"].includes(codPaymentMode)) {
            throw new ValidationError("Payment mode is required for COD orders");
          }
          await axios.patch(
            `${process.env.RESTAURANT_SERVICE_URI}/api/v1/orders/internal/cod-payment`,
            { orderId, codPaymentMode },
            { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } }
          );

          const wallet = await walletRepository.findByRiderId(rider.id);
          if (wallet) {
            wallet.recordCodCollection(data.data?.totalAmount ?? 0);
            await walletRepository.save(wallet);
          }
        }

        assignment.deliver();
        await orderAssignmentRepository.save(assignment);

        const earnedAmt = data.data?.riderAmount ?? 50;
        const tipAmt = data.data?.tipAmount ?? 0;

        const wallet = await walletRepository.findByRiderId(rider.id);
        if (wallet) {
          wallet.creditAmount(earnedAmt, "earning");
          if (tipAmt > 0) wallet.creditAmount(tipAmt, "tip");
          await walletRepository.save(wallet);

          await transactionRepository.create({
            riderId: rider.id,
            amount: earnedAmt,
            type: "credit",
            category: "earning",
            description: `Earning for order #${orderId}`,
            referenceId: orderId
          });
          if (tipAmt > 0) {
            await transactionRepository.create({
              riderId: rider.id,
              amount: tipAmt,
              type: "credit",
              category: "earning",
              description: `Tip for order #${orderId}`,
              referenceId: orderId
            });
          }
        }

        rider.totalEarnings += earnedAmt + tipAmt;
        rider.totalDeliveries += 1;
        rider.deliveryOtp = null;
        rider.deliveryOtpExpiry = null;
        rider.updateStatus("ONLINE");
        await this.riderRepository.save(rider);

        await publishEvent("ORDER_DELIVERED", { orderId, riderId: rider.id });

        try {
          await axios.patch(
            `${process.env.RESTAURANT_SERVICE_URI}/api/v1/orders/internal/set-otp`,
            { orderId, otp: null },
            { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } }
          );
        } catch (e) {}
      }

      return data.data;
    } catch (error: any) {
      throw new ExternalServiceError(error?.response?.data?.message || error?.message || "Failed to update order status");
    }
  }

  async generateDeliveryOtp(userId: string, orderId: string): Promise<any> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) {
      throw new NotFoundError("Rider profile not found");
    }

    const { data: orderData } = await axios.get(
      `${process.env.RESTAURANT_SERVICE_URI}/api/v1/orders/internal/${orderId}`,
      { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } }
    );

    if (!orderData.success || orderData.data?.riderId !== rider.id) {
      throw new AuthorizationError("You are not assigned to this order");
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    rider.deliveryOtp = otp;
    rider.deliveryOtpExpiry = expiry;
    await this.riderRepository.save(rider);

    await axios.patch(
      `${process.env.RESTAURANT_SERVICE_URI}/api/v1/orders/internal/set-otp`,
      { orderId, otp },
      { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } }
    );

    try {
      await axios.post(
        `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`,
        {
          event: "delivery:otp",
          room: `User:${orderData.data.userId}`,
          payload: { orderId, otp }
        },
        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } }
      );
    } catch (err: any) {
      console.error("OTP socket emit failed:", err.message);
    }

    return { success: true };
  }

  async updateLiveLocation(userId: string, dto: UpdateRiderLocationDto): Promise<void> {
    const coords = new Coordinates(dto.longitude, dto.latitude);
    
    const rider = await this.riderRepository.findByUserId(userId);
    if (rider) {
      await locationRepository.updateLiveLocation(rider.id, coords);
      
      rider.location = coords;
      rider.lastActiveAt = new Date();
      await this.riderRepository.save(rider);

      await publishEvent("LOCATION_UPDATED", {
        riderId: rider.id,
        latitude: dto.latitude,
        longitude: dto.longitude,
        orderId: dto.orderId
      });
    }

    try {
      await axios.post(
        `${process.env.REALTIME_SOCKET_SERVICE_URI}/api/v1/socket/events`,
        {
          event: "rider:location",
          room: `User:${dto.customerUserId}`,
          payload: { latitude: dto.latitude, longitude: dto.longitude, orderId: dto.orderId }
        },
        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } }
      );
    } catch (err: any) {
      console.error("Location socket emit failed:", err.message);
    }
  }

  async getEarnings(userId: string): Promise<any> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) {
      throw new NotFoundError("Rider profile not found");
    }

    const wallet = await walletRepository.findByRiderId(rider.id);
    const history = await orderAssignmentRepository.findHistoryByRiderId(rider.id, 50);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);

    const todayEarnings = history
      .filter((o) => o.deliveredAt && new Date(o.deliveredAt) >= today)
      .reduce((sum, o) => sum + (o.deliveryFee ?? 0) + (o.tip ?? 0), 0);

    const weekEarnings = history
      .filter((o) => o.deliveredAt && new Date(o.deliveredAt) >= weekAgo)
      .reduce((sum, o) => sum + (o.deliveryFee ?? 0) + (o.tip ?? 0), 0);

    const getLocalDateString = (d: Date) => {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    const dailyMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dailyMap[getLocalDateString(d)] = 0;
    }

    history.forEach((o) => {
      if (o.deliveredAt) {
        const day = getLocalDateString(new Date(o.deliveredAt));
        if (day in dailyMap) {
          dailyMap[day] = (dailyMap[day] ?? 0) + (o.deliveryFee ?? 0) + (o.tip ?? 0);
        }
      }
    });
    const weeklyBreakdown = Object.entries(dailyMap).map(([date, amount]) => ({ date, amount }));

    return {
      totalEarnings: rider.totalEarnings,
      totalDeliveries: rider.totalDeliveries,
      rating: rider.ratingCount > 0 ? +(rider.rating).toFixed(1) : 5.0,
      todayEarnings,
      weekEarnings,
      weeklyBreakdown,
      walletBalance: wallet ? wallet.balance : 0,
      codCollection: wallet ? wallet.codCollection : 0
    };
  }

  async getDeliveryHistory(userId: string): Promise<any> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) {
      throw new NotFoundError("Rider profile not found");
    }

    const list = await orderAssignmentRepository.findHistoryByRiderId(rider.id, 50);
    return {
      count: list.length,
      orders: list.map(OrderAssignmentMapper.toDto)
    };
  }

  async handleRiderRated(riderId: string, rating: number): Promise<void> {
    const rider = await this.riderRepository.findById(riderId);
    if (!rider) {
      console.warn(`Rider not found for ID: ${riderId}`);
      return;
    }
    rider.updateRating(rating);
    await this.riderRepository.save(rider);
    console.log(`Updated Rider ${riderId}: ratingCount=${rider.ratingCount}, rating=${rider.rating}`);
  }

  async startShift(userId: string): Promise<any> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) throw new NotFoundError("Rider profile not found");

    const existingActive = await shiftRepository.findActiveByRiderId(rider.id);
    if (existingActive) {
      const shiftAgeHours = (new Date().getTime() - new Date(existingActive.startTime).getTime()) / 3600000;
      if (shiftAgeHours > 12) {
        existingActive.endShift();
        await shiftRepository.save(existingActive);
      } else {
        if (rider.availabilityStatus === "OFFLINE") {
          rider.updateStatus("ONLINE");
          await this.riderRepository.save(rider);
        }
        return ShiftMapper.toDto(existingActive);
      }
    }

    const newShift = new ShiftAggregate("", rider.id, new Date(), null, [], "active");
    const saved = await shiftRepository.create(newShift);

    rider.updateStatus("ONLINE");
    await this.riderRepository.save(rider);

    await publishEvent("SHIFT_STARTED", { riderId: rider.id, shiftId: saved.id });
    return ShiftMapper.toDto(saved);
  }

  async endShift(userId: string): Promise<any> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) throw new NotFoundError("Rider profile not found");

    const activeShift = await shiftRepository.findActiveByRiderId(rider.id);
    let savedDto = null;
    if (activeShift) {
      activeShift.endShift();
      const saved = await shiftRepository.save(activeShift);
      savedDto = ShiftMapper.toDto(saved);

      await publishEvent("SHIFT_ENDED", {
        riderId: rider.id,
        shiftId: saved.id,
        durationMinutes: saved.calculateWorkingMinutes()
      });
    }

    if (rider.availabilityStatus !== "OFFLINE") {
      rider.updateStatus("OFFLINE");
      await this.riderRepository.save(rider);
    }

    return savedDto || { success: true, message: "Shift ended successfully" };
  }

  async pauseShift(userId: string): Promise<any> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) throw new NotFoundError("Rider profile not found");

    let activeShift = await shiftRepository.findActiveByRiderId(rider.id);
    if (!activeShift) {
      const newShift = new ShiftAggregate("", rider.id, new Date(), null, [], "active");
      activeShift = await shiftRepository.create(newShift);
    }

    const activeBreak = activeShift.breaks.find((b) => !b.end);
    let saved = activeShift;
    if (!activeBreak) {
      activeShift.startBreak();
      saved = await shiftRepository.save(activeShift);
    }

    if (rider.availabilityStatus !== "BREAK") {
      rider.updateStatus("BREAK");
      await this.riderRepository.save(rider);
    }

    return ShiftMapper.toDto(saved);
  }

  async resumeShift(userId: string): Promise<any> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) throw new NotFoundError("Rider profile not found");

    let activeShift = await shiftRepository.findActiveByRiderId(rider.id);
    if (!activeShift) {
      const newShift = new ShiftAggregate("", rider.id, new Date(), null, [], "active");
      activeShift = await shiftRepository.create(newShift);
    }

    const activeBreak = activeShift.breaks.find((b) => !b.end);
    let saved = activeShift;
    if (activeBreak) {
      activeShift.endBreak();
      saved = await shiftRepository.save(activeShift);
    }

    if (rider.availabilityStatus !== "ONLINE") {
      rider.updateStatus("ONLINE");
      await this.riderRepository.save(rider);
    }

    return ShiftMapper.toDto(saved);
  }

  async getShiftHistory(userId: string): Promise<any[]> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) throw new NotFoundError("Rider profile not found");

    const list = await shiftRepository.findHistoryByRiderId(rider.id);
    return list.map(ShiftMapper.toDto);
  }

  async getVehicle(userId: string): Promise<any> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) throw new NotFoundError("Rider profile not found");

    if (!rider.vehicle) throw new NotFoundError("No vehicle details configured");
    return rider.vehicle;
  }

  async updateVehicle(userId: string, dto: any): Promise<any> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) throw new NotFoundError("Rider profile not found");

    const domainVehicle = new Vehicle(
      dto.type,
      dto.fuelType,
      dto.number,
      dto.manufacturer,
      dto.model,
      dto.color,
      dto.ownership,
      dto.insuranceExpiry ? new Date(dto.insuranceExpiry) : null,
      dto.rcExpiry ? new Date(dto.rcExpiry) : null,
      false
    );

    rider.setVehicle(domainVehicle);
    const saved = await this.riderRepository.save(rider);
    return RiderMapper.toDto(saved).vehicle;
  }

  async getWalletSummary(userId: string): Promise<any> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) throw new NotFoundError("Rider profile not found");

    const wallet = await walletRepository.findByRiderId(rider.id);
    if (!wallet) throw new NotFoundError("Wallet details not found");

    return WalletMapper.toDto(wallet);
  }

  async getWalletTransactions(userId: string): Promise<any[]> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) throw new NotFoundError("Rider profile not found");

    return transactionRepository.findByRiderId(rider.id);
  }

  async getWalletSettlements(userId: string): Promise<any[]> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) throw new NotFoundError("Rider profile not found");

    return transactionRepository.findSettlementsByRiderId(rider.id);
  }

  async withdrawFunds(userId: string, amount: number): Promise<any> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) throw new NotFoundError("Rider profile not found");

    const wallet = await walletRepository.findByRiderId(rider.id);
    if (!wallet) throw new NotFoundError("Wallet not found");

    wallet.debitAmount(amount, "withdrawal");
    await walletRepository.save(wallet);

    const tx = await transactionRepository.create({
      riderId: rider.id,
      amount,
      type: "debit",
      category: "withdrawal",
      status: "pending",
      description: `Settlement request of ₹${amount}`
    });

    const destination = wallet.upiId || wallet.bankAccountNumber || "UPI";

    const settlement = await transactionRepository.createSettlement({
      riderId: rider.id,
      amount,
      status: "pending",
      destinationType: wallet.upiId ? "upi" : "bank",
      destinationDetails: destination,
      gatewayReference: tx._id.toString()
    });

    await publishEvent("PAYMENT_SETTLED", {
      riderId: rider.id,
      amount,
      settlementId: settlement._id.toString()
    });

    return settlement;
  }

  async configureBankDetails(userId: string, dto: any): Promise<any> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) throw new NotFoundError("Rider profile not found");

    const wallet = await walletRepository.findByRiderId(rider.id);
    if (!wallet) throw new NotFoundError("Wallet not found");

    let hasUpdated = false;

    if (dto.upiId && dto.upiId.trim().length > 0) {
      wallet.configureUpi(dto.upiId);
      hasUpdated = true;
    }

    if (dto.bankName && dto.bankName.trim().length > 0 &&
        dto.bankAccountNumber && dto.bankAccountNumber.trim().length > 0 &&
        dto.bankIfsc && dto.bankIfsc.trim().length > 0) {
      wallet.configureBank(dto.bankName, dto.bankAccountNumber, dto.bankIfsc);
      hasUpdated = true;
    }

    if (!hasUpdated) {
      throw new ValidationError("Please provide valid Bank Details or UPI ID to configure payouts");
    }

    const saved = await walletRepository.save(wallet);
    return WalletMapper.toDto(saved);
  }

  async getDocuments(userId: string): Promise<any> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) throw new NotFoundError("Rider profile not found");

    return {
      profilePhotoUrl: rider.picture,
      drivingLicenseUrl: rider.drivingLicesce,
      aadhaarUrl: rider.aadhaarNumber,
      isVerified: rider.isVerified
    };
  }

  async uploadDocument(userId: string, dto: any): Promise<any> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) throw new NotFoundError("Rider profile not found");

    if (dto.pictureUrl) rider.picture = dto.pictureUrl;
    if (dto.drivingLicenseUrl) rider.drivingLicesce = dto.drivingLicenseUrl;
    if (dto.aadhaarUrl) rider.aadhaarNumber = dto.aadhaarUrl;

    const saved = await this.riderRepository.save(rider);

    await notificationRepository.create({
      riderId: rider.id,
      title: "Document Uploaded",
      message: "Your KYC document was successfully submitted for background verification.",
      category: "document",
      priority: "medium"
    });

    return this.getDocuments(userId);
  }

  async getNotifications(userId: string): Promise<any[]> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) throw new NotFoundError("Rider profile not found");

    return notificationRepository.findByRiderId(rider.id);
  }

  async markNotificationRead(userId: string, notificationId: string): Promise<any> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) throw new NotFoundError("Rider profile not found");

    return notificationRepository.markAsRead(notificationId, rider.id);
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) throw new NotFoundError("Rider profile not found");

    await notificationRepository.markAllAsRead(rider.id);
  }

  async getPerformanceStatistics(userId: string): Promise<any> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) throw new NotFoundError("Rider profile not found");
    
    const history = await orderAssignmentRepository.findHistoryByRiderId(rider.id, 100);
    const total = history.length;
    const completed = history.filter((o: any) => o.status === "delivered").length;
    const cancelled = history.filter((o: any) => o.status === "cancelled").length;
    
    let avgTime = 0;
    let onTimeCount = 0;
    let deliveredCount = 0;
    
    history.forEach((o: any) => {
      if (o.status === "delivered" && o.pickedAt && o.deliveredAt) {
        deliveredCount++;
        const durationMin = Math.round((new Date(o.deliveredAt).getTime() - new Date(o.pickedAt).getTime()) / 60000);
        avgTime += durationMin;
        
        if (o.eta && new Date(o.deliveredAt) <= new Date(o.eta)) {
          onTimeCount++;
        } else if (!o.eta) {
          onTimeCount++;
        }
      }
    });
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 100;
    const onTimeRate = deliveredCount > 0 ? Math.round((onTimeCount / deliveredCount) * 100) : 100;
    const acceptanceRate = total > 0 ? Math.round(((total - cancelled) / total) * 100) : 100;
    
    return {
      riderId: rider.id,
      totalDeliveries: rider.totalDeliveries,
      totalEarnings: rider.totalEarnings,
      rating: rider.ratingCount > 0 ? +(rider.rating).toFixed(1) : 5.0,
      acceptanceRate,
      completionRate,
      onTimeDeliveryRate: onTimeRate,
      averageDeliveryTimeMinutes: deliveredCount > 0 ? Math.round(avgTime / deliveredCount) : 0
    };
  }

  async getPerformanceDashboard(userId: string): Promise<any> {
    return this.getPerformanceStatistics(userId);
  }

  async getLeaderboard(): Promise<any[]> {
    return leaderboardRepository.getWeeklyTopRiders(10);
  }

  async getAnalytics(userId: string): Promise<any> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) throw new NotFoundError("Rider profile not found");
    
    const history = await orderAssignmentRepository.findHistoryByRiderId(rider.id, 100);
    
    const getLocalWeekday = (d: Date) => {
      const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return weekdays[d.getDay()] as string;
    };

    const dailyMap: Record<string, { deliveries: number; earnings: number }> = {
      "Mon": { deliveries: 0, earnings: 0 },
      "Tue": { deliveries: 0, earnings: 0 },
      "Wed": { deliveries: 0, earnings: 0 },
      "Thu": { deliveries: 0, earnings: 0 },
      "Fri": { deliveries: 0, earnings: 0 },
      "Sat": { deliveries: 0, earnings: 0 },
      "Sun": { deliveries: 0, earnings: 0 }
    };

    history.forEach((o: any) => {
      if (o.deliveredAt) {
        const weekday = getLocalWeekday(new Date(o.deliveredAt));
        if (weekday in dailyMap) {
          const entry = dailyMap[weekday];
          if (entry) {
            entry.deliveries += 1;
            entry.earnings += (o.deliveryFee ?? 0) + (o.tip ?? 0);
          }
        }
      }
    });

    const weeklyComparison = Object.entries(dailyMap).map(([day, data]) => ({
      day,
      deliveries: data.deliveries,
      earnings: data.earnings
    }));

    const stats = await this.getPerformanceStatistics(userId);

    return {
      statistics: stats,
      peakHours: [
        { hour: "12:00-14:00", demand: "High", multiplier: 1.2 },
        { hour: "19:00-21:00", demand: "Very High", multiplier: 1.5 },
        { hour: "08:00-10:00", demand: "Medium", multiplier: 1.0 }
      ],
      incomePredictions: {
        estimatedDaily: rider.totalDeliveries > 0 ? Math.round(rider.totalEarnings / rider.totalDeliveries) : 0,
        estimatedWeekly: rider.totalDeliveries > 0 ? Math.round((rider.totalEarnings / rider.totalDeliveries) * 7) : 0
      },
      weeklyComparison
    };
  }
}
