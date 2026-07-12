import type React from "react";
import type { ICart } from "./cart";

export interface User {
      _id: string;
      name: string;
      email: string;
      image: string;
      role: string | null;
      restaurantId?: string | null;
      isBlocked?: boolean;
      blockedUntil?: string | null;
      authProviders?: Array<"email" | "google">;
      isEmailVerified?: boolean;
}

export interface LocationData {
      latitude: number;
      longitude: number;
      formattedAddress: string;
}

export interface AppContextType {
      user: User | null;
      loading: boolean;
      isAuth: boolean;
      setUser: React.Dispatch<React.SetStateAction<User | null>>;
      setLoading: React.Dispatch<React.SetStateAction<boolean>>;
      setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
      location: LocationData | null;
      setLocation: React.Dispatch<React.SetStateAction<LocationData | null>>;
      city: string;
      locationLoading: boolean;
      cart: ICart[] | [];
      fetchCart: () => Promise<void>;
      fetchCurrentUser: () => Promise<User | null>;
      subTotal: number;
      quantity: number;
      detectUserLocation: (forcePrompt?: boolean) => Promise<boolean>;
}
