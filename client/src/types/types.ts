import type React from "react";

export interface User {
      _id: string;
      name: string;
      email: string;
      image: string;
      role: string | null;
};

export interface LocationData {
      latitude: number;
      longitude: number;
      fomattedAddress: string;
};

export interface AppContextType {
      user: User | null;
      loading: boolean;
      isAuth: boolean;
      setUser: React.Dispatch<React.SetStateAction<User | null>>;
      setLoading: React.Dispatch<React.SetStateAction<boolean>>;
      setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
      fatchUser: () => Promise<void>;
      location: LocationData | null;
      city: string;
      locationLoading: boolean;
};