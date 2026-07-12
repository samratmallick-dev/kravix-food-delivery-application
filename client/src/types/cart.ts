import type { IRestaurant, IMenuItem } from "./restaurant";

export interface ICart {
      _id: string;
      userId: string;
      restaurantId: string | IRestaurant;
      itemId: string | IMenuItem;
      quantity: number;
      createdAt: Date;
      updatedAt: Date;
}
