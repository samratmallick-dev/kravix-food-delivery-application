export interface IRestaurantEventPublisher {
  publishOrderNew(orderId: string, restaurantId: string): Promise<void>;
  publishOrderUpdate(orderId: string, userId: string, restaurantId: string, status: string, riderId?: string | null): Promise<void>;
  publishOrderReadyForRider(orderId: string, restaurantId: string, location: any): Promise<void>;
  publishMenuItemAvailability(restaurantId: string, payload: any): Promise<void>;
  publishMenuItemDeleted(restaurantId: string, itemId: string): Promise<void>;
  publishRestaurantStatus(restaurantId: string, isOpen: boolean): Promise<void>;
  publishRiderRated(riderId: string, rating: number): Promise<void>;
}
