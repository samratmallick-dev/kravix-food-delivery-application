import { AddressRepository } from "../repositories/address.repository.js";
import { CartRepository } from "../repositories/cart.repository.js";
import { CouponRepository } from "../repositories/coupon.repository.js";
import { MenuItemRepository } from "../repositories/menu-item.repository.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { RestaurantRepository } from "../repositories/restaurant.repository.js";
import { ReviewRepository } from "../repositories/review.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { RestaurantEventPublisher } from "../events/RestaurantEvents.js";

import { AddressService } from "./AddressService.js";
import { CartService } from "./CartService.js";
import { CouponService } from "./CouponService.js";
import { MenuItemService } from "./MenuItemService.js";
import { RestaurantService } from "./RestaurantService.js";
import { ReviewService } from "./ReviewService.js";
import { OrderService } from "./OrderService.js";

export const addressRepository = new AddressRepository();
export const cartRepository = new CartRepository();
export const couponRepository = new CouponRepository();
export const menuItemRepository = new MenuItemRepository();
export const orderRepository = new OrderRepository();
export const restaurantRepository = new RestaurantRepository();
export const reviewRepository = new ReviewRepository();
export const userRepository = new UserRepository();
export const eventPublisher = new RestaurantEventPublisher();

export const addressService = new AddressService(addressRepository);
export const cartService = new CartService(cartRepository);
export const couponService = new CouponService(couponRepository);
export const menuItemService = new MenuItemService(menuItemRepository, restaurantRepository, eventPublisher);
export const restaurantService = new RestaurantService(
  restaurantRepository,
  userRepository,
  menuItemRepository,
  orderRepository,
  eventPublisher
);
export const reviewService = new ReviewService(reviewRepository, orderRepository, eventPublisher);
export const orderService = new OrderService(
  orderRepository,
  restaurantRepository,
  cartRepository,
  couponRepository,
  addressRepository,
  menuItemRepository,
  eventPublisher
);
