import { Restaurant } from "../domain/entities/Restaurant.js";
import { MenuItem } from "../domain/entities/MenuItem.js";
import { Cart } from "../domain/entities/Cart.js";
import { Order } from "../domain/entities/Order.js";
import { RestaurantResponseDto, MenuItemResponseDto, CartResponseDto, OrderResponseDto } from "../dto/restaurant.dto.js";

export class RestaurantResponseMapper {
  static toRestaurantDto(restaurant: Restaurant): RestaurantResponseDto {
    const dto: RestaurantResponseDto = {
      _id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      description: restaurant.description,
      image: restaurant.image,
      ownerId: restaurant.ownerId,
      phone: restaurant.phone,
      isVerified: restaurant.isVerified,
      autoLocation: {
        type: "Point",
        coordinates: restaurant.autoLocation.coordinates,
        formattedAddress: restaurant.autoLocation.formattedAddress
      },
      isOpen: restaurant.isOpen
    };
    if (restaurant.distanceKm !== undefined) {
      dto.distanceKm = restaurant.distanceKm;
    }
    return dto;
  }

  static toMenuItemDto(item: MenuItem): MenuItemResponseDto {
    return {
      _id: item.id,
      restaurantId: item.restaurantId,
      name: item.name,
      description: item.description,
      price: item.price,
      imageUrl: item.imageUrl,
      isAvailable: item.isAvailable,
      isVeg: item.isVeg,
      category: item.category
    };
  }

  static toCartDto(cart: Cart): CartResponseDto {
    return {
      _id: cart.id,
      userId: cart.userId,
      itemId: cart.itemId,
      restaurantId: cart.restaurantId,
      quantity: cart.quantity
    };
  }

  static toOrderDto(order: Order): OrderResponseDto {
    const dto: OrderResponseDto = {
      _id: order.id,
      userId: order.userId,
      restaurantId: order.restaurantId,
      restaurantName: order.restaurantName,
      items: order.items.map((i) => ({
        itemId: i.itemId,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        total: i.total
      })),
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      platformFee: order.platformFee,
      totalGST: order.totalGST,
      totalAmount: order.totalAmount,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      addressId: order.addressId,
      deliveryAddress: order.deliveryAddress,
      riderAmount: order.riderAmount,
      createdAt: order.createdAt ? order.createdAt.toISOString() : new Date().toISOString()
    };
    if (order.riderName !== undefined && order.riderName !== null) {
      dto.riderName = order.riderName;
    }
    if (order.riderPhoneNumber !== undefined && order.riderPhoneNumber !== null) {
      dto.riderPhoneNumber = order.riderPhoneNumber;
    }
    if (order.distance !== undefined) {
      dto.distance = order.distance;
    }
    return dto;
  }
}
