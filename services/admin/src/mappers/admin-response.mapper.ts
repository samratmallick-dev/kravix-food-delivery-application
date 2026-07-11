import { User } from "../domain/entities/User.js";
import { Restaurant } from "../domain/entities/Restaurant.js";
import { Rider } from "../domain/entities/Rider.js";
import { Order } from "../domain/entities/Order.js";
import { UserResponseDto, RestaurantResponseDto, RiderResponseDto, OrderResponseDto } from "../dto/admin.dto.js";

export class AdminResponseMapper {
  static toUserDto(user: User, riderPicture?: string): UserResponseDto {
    const dto: UserResponseDto = {
      _id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      isBlocked: user.isBlocked,
      blockedUntil: user.blockedUntil ? user.blockedUntil.toISOString() : null,
      createdAt: user.createdAt.toISOString()
    };
    if (riderPicture) {
      dto.riderPicture = riderPicture;
    }
    return dto;
  }

  static toRestaurantDto(restaurant: Restaurant): RestaurantResponseDto {
    return {
      _id: restaurant.id,
      name: restaurant.name,
      description: restaurant.description,
      image: restaurant.image,
      ownerId: restaurant.ownerId,
      phone: restaurant.phone,
      isVerified: restaurant.isVerified,
      autoLocation: restaurant.autoLocation,
      isOpen: restaurant.isOpen,
      createdAt: restaurant.createdAt.toISOString()
    };
  }

  static toRiderDto(rider: Rider): RiderResponseDto {
    return {
      _id: rider.id,
      userId: rider.userId,
      picture: rider.picture,
      phoneNumber: rider.phoneNumber,
      aadhaarNumber: rider.aadhaarNumber,
      drivingLicesce: rider.drivingLicesce,
      panNumber: rider.panNumber,
      isVerified: rider.isVerified,
      location: rider.location,
      isAvailable: rider.isAvailable,
      lastActiveAt: rider.lastActiveAt.toISOString(),
      createdAt: rider.createdAt.toISOString()
    };
  }

  static toOrderDto(order: Order): OrderResponseDto {
    const dto: OrderResponseDto = {
      _id: order.id,
      userId: order.userId,
      restaurantId: order.restaurantId,
      restaurantName: order.restaurantName,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt ? order.createdAt.toISOString() : new Date().toISOString(),
    };

    if (order.deliveryAddress) dto.deliveryAddress = order.deliveryAddress;
    if (order.items) dto.items = order.items;
    if (order.subtotal !== undefined) dto.subtotal = order.subtotal;
    if (order.deliveryFee !== undefined) dto.deliveryFee = order.deliveryFee;
    if (order.platformFee !== undefined) dto.platformFee = order.platformFee;
    if (order.riderName !== undefined && order.riderName !== null) dto.riderName = order.riderName;

    return dto;
  }
}
