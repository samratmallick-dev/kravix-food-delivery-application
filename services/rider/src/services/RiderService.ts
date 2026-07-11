import axios from "axios";
import { IRiderService } from "../interfaces/IRiderService.js";
import { IRiderRepository } from "../interfaces/IRiderRepository.js";
import { RiderFactory } from "../factories/rider.factory.js";
import { RiderMapper } from "../mappers/rider.mapper.js";
import { CreateRiderDto, UpdateRiderLocationDto, RiderResponseDto } from "../dto/CreateRiderDto.js";
import { NotFoundError, ValidationError, ConflictError, ExternalServiceError, AuthorizationError } from "../utils/errors.js";
import { Coordinates } from "../domain/valueObjects/Coordinates.js";

export class RiderService implements IRiderService {
  constructor(private readonly riderRepository: IRiderRepository) {}

  async createProfile(userId: string, dto: CreateRiderDto): Promise<RiderResponseDto> {
    const existing = await this.riderRepository.findByUserId(userId);
    if (existing) {
      throw new ConflictError("Rider profile already exists");
    }

    const rider = RiderFactory.create(userId, dto);
    const saved = await this.riderRepository.create(rider);
    return RiderMapper.toDto(saved);
  }

  async updateProfile(userId: string, updates: Partial<CreateRiderDto> & { picture?: string }): Promise<RiderResponseDto> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) {
      throw new NotFoundError("Rider profile not found");
    }

    const picture = updates.picture ?? rider.picture;
    const phoneNumber = updates.phoneNumber ?? rider.phoneNumber;
    const aadhaarNumber = updates.aadhaarNumber ?? rider.aadhaarNumber;
    const drivingLicesce = updates.drivingLicesce ?? rider.drivingLicesce;
    const panNumber = updates.panNumber !== undefined ? updates.panNumber : rider.panNumber;

    rider.updateProfile(picture, phoneNumber, aadhaarNumber, drivingLicesce, panNumber);

    const updatedRider = await this.riderRepository.findOneAndUpdate(
      { userId },
      { picture, phoneNumber, aadhaarNumber, drivingLicesce, panNumber }
    );

    if (!updatedRider) {
      throw new NotFoundError("Rider profile not found during update");
    }

    return RiderMapper.toDto(updatedRider);
  }

  async getProfile(userId: string): Promise<RiderResponseDto> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) {
      throw new NotFoundError("Rider profile not found");
    }
    return RiderMapper.toDto(rider);
  }

  async toggleAvailability(userId: string, isAvailable: boolean, latitude: number, longitude: number): Promise<RiderResponseDto> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) {
      throw new NotFoundError("Rider profile not found");
    }

    const coords = new Coordinates(longitude, latitude);
    rider.toggleAvailability(isAvailable, coords);

    const updated = await this.riderRepository.findOneAndUpdate(
      { userId },
      {
        isAvailable: rider.isAvailable,
        location: { type: "Point", coordinates: coords.toArray() },
        lastActiveAt: rider.lastActiveAt
      }
    );

    if (!updated) {
      throw new NotFoundError("Rider profile not found");
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

  async acceptOrder(userId: string, name: string, orderId: string): Promise<RiderResponseDto> {
    const rider = await this.riderRepository.findOneAndUpdate(
      { userId, isAvailable: true, isVerified: true },
      { isAvailable: false }
    );

    if (!rider) {
      throw new ConflictError("You are no longer available or already on a delivery");
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

      return RiderMapper.toDto(rider);
    } catch (error: any) {
      await this.riderRepository.findOneAndUpdate({ userId }, { isAvailable: true });
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
        return data.data;
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

      if (data.data?.status === "delivered") {
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
        }

        rider.completeDelivery(data.data?.riderAmount ?? 0);
        await this.riderRepository.save(rider);

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

    rider.generateOtp(otp, expiry);
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
    const rider = await this.riderRepository.findOneAndUpdate(
      { userId },
      {
        location: { type: "Point", coordinates: coords.toArray() },
        lastActiveAt: new Date()
      }
    );

    if (!rider) {
      throw new NotFoundError("Rider profile not found");
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

    try {
      const { data } = await axios.get(
        `${process.env.RESTAURANT_SERVICE_URI}/api/v1/orders/internal/delivery-history?riderId=${rider.id}`,
        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } }
      );

      const orders: any[] = data.data?.orders ?? [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 6);

      const todayEarnings = orders
        .filter((o) => o.createdAt && new Date(o.createdAt) >= today)
        .reduce((sum, o) => sum + (o.riderAmount ?? 0), 0);

      const weekEarnings = orders
        .filter((o) => o.createdAt && new Date(o.createdAt) >= weekAgo)
        .reduce((sum, o) => sum + (o.riderAmount ?? 0), 0);

      const getLocalDateString = (d: Date) => {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      };

      const dailyMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        dailyMap[getLocalDateString(d)] = 0;
      }
      orders.forEach((o) => {
        if (!o.createdAt) return;
        const day = getLocalDateString(new Date(o.createdAt));
        if (day in dailyMap) {
          dailyMap[day] += o.riderAmount ?? 0;
        }
      });
      const weeklyBreakdown = Object.entries(dailyMap).map(([date, amount]) => ({ date, amount }));

      return {
        totalEarnings: rider.totalEarnings,
        totalDeliveries: rider.totalDeliveries,
        rating: rider.ratingCount > 0 ? +(rider.rating / rider.ratingCount).toFixed(1) : null,
        todayEarnings,
        weekEarnings,
        weeklyBreakdown
      };
    } catch (error: any) {
      throw new ExternalServiceError(error?.message || "Failed to fetch earnings");
    }
  }

  async getDeliveryHistory(userId: string): Promise<any> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) {
      throw new NotFoundError("Rider profile not found");
    }

    try {
      const { data } = await axios.get(
        `${process.env.RESTAURANT_SERVICE_URI}/api/v1/orders/internal/delivery-history?riderId=${rider.id}`,
        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! } }
      );
      return data.data;
    } catch (error: any) {
      throw new ExternalServiceError(error?.response?.data?.message || error?.message || "Failed to fetch delivery history");
    }
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

  async getRiderLocation(riderId: string): Promise<{ latitude: number; longitude: number }> {
    const rider = await this.riderRepository.findById(riderId);
    if (!rider) {
      throw new NotFoundError("Rider not found");
    }
    const [lng, lat] = rider.location.toArray();
    return { latitude: lat, longitude: lng };
  }
}
