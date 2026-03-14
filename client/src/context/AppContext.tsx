import axios from "axios";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AppContextType, LocationData, User } from "../types/types";
import toast from "react-hot-toast";

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
      children: ReactNode
};

const baseUrl = import.meta.env.VITE_API_URL;

export const AppProvider = ({ children }: AppProviderProps) => {

      const [user, setUser] = useState<User | null>(null);
      const [isAuth, setIsAuth] = useState(false);
      const [loading, setLoading] = useState(true);

      const [location, setLocation] = useState<LocationData | null>(null);
      const [locationLoading, setLocationLoading] = useState(false);
      const [city, setCity] = useState("Fatching Location...");

      async function fatchUser() {
            try {
                  const token = localStorage.getItem("token");

                  if (!token) {
                        setLoading(false);
                        return;
                  }

                  const { data } = await axios.get(`${baseUrl}/api/v1/auth/profile`, {
                        headers: {
                              Authorization: `Bearer ${token}`
                        }
                  });
                  setUser(data.data);
                  setIsAuth(true);
            } catch (error) {
                  console.log(error);
                  localStorage.removeItem("token");
                  setUser(null);
                  setIsAuth(false);
            } finally {
                  setLoading(false);
            }
      };

      useEffect(() => {
            fatchUser();
      }, []);

      useEffect(() => {
            if (!navigator.geolocation) {
                  toast.error("Please allow Geo Location to continue");
                  return;
            }

            navigator.geolocation.getCurrentPosition(async (position) => {
                  setLocationLoading(true);
                  const { latitude, longitude } = position.coords;
                  try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                        const data = await response.json();
                        setLocation({
                              latitude,
                              longitude,
                              fomattedAddress: data.display_name || "current location"
                        });

                        setCity(
                              data.address.city_district ||
                              data.address.suburb ||
                              data.address.town ||
                              data.address.village ||
                              data.address.city ||
                              data.address.county ||
                              "Your Location"
                        );
                  } catch (error) {
                        console.error("Error fetching location data:", error);
                        toast.error("Failed to fetch location data");
                        setLocation({
                              latitude,
                              longitude,
                              fomattedAddress: "Unknown Location"
                        });
                        setCity("Faild to load");

                  }
            });
      }, []);

      return <AppContext.Provider
            value={{
                  isAuth,
                  setIsAuth,
                  loading,
                  setLoading,
                  user,
                  setUser,
                  fatchUser,
                  location,
                  locationLoading,
                  city
            }}
      >
            {children}
      </AppContext.Provider>
};

export const useAppData = (): AppContextType => {
      const context = useContext(AppContext);

      if (!context) {
            throw new Error("useAppData must be used within an AppProvider");
      }

      return context;
};