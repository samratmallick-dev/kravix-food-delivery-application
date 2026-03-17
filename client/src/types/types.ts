import type React from "react";

export interface User {
      _id: string;
      name: string;
      email: string;
      image: string;
      role: string | null;
      restaurantId?: string | null;
};

export interface LocationData {
      latitude: number;
      longitude: number;
      formattedAddress: string;
};

export interface AppContextType {
      user: User | null;
      loading: boolean;
      isAuth: boolean;
      setUser: React.Dispatch<React.SetStateAction<User | null>>;
      setLoading: React.Dispatch<React.SetStateAction<boolean>>;
      setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
      location: LocationData | null;
      city: string;
      locationLoading: boolean;
      cart: ICart[] | [];
      fetchCart: () => Promise<void>;
      subTotal: number;
      quantity: number;
};

export interface IRestaurant {
      _id: string;
      name: string;
      description: string;
      image: string;
      ownerId: string;
      phone: number;
      isVerified: boolean;

      autoLocation: {
            type: "Point";
            coordinates: [number, number];
            formattedAddress: string;
      };
      isOpen: boolean;
      createdAt: Date;
};

export interface IMenuItem {
      _id: string;
      restaurantId : string;
      name: string;
      description: string;
      price: number;
      imageUrl?: string;
      isAvailable: boolean;
      createdAt: Date;
      updatedAt: Date;
};

export interface ICart {
      _id: string;
      userId: string;
      restaurantId : string | IRestaurant;
      itemId: string | IMenuItem;
      quantity:number;
      createdAt: Date;
      updatedAt: Date;
};