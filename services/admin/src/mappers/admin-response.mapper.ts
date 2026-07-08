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
      blockedUntil: user.blockedUntil ? user.blockedUntil.toISOString() : null
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
      isOpen: restaurant.isOpen
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
      isVerified: rider.isVerified,
      location: rider.location,
      isAvailable: rider.isAvailable
    };
  }

  static toOrderDto(order: Order): OrderResponseDto {
    return {
      _id: order.id,
      userId: order.userId,
      restaurantId: order.restaurantId,
      restaurantName: order.restaurantName,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount
    };
  }
}
