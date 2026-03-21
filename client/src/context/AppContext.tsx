import axios from "axios";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { authBaseUrl, cartBaseUrl } from "../components/common/constant";
import toast from "react-hot-toast";
import type { ICart, AppContextType, LocationData, User } from "../types/types";

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
      children: ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {

      const [user, setUser] = useState<User | null>(null);
      const [isAuth, setIsAuth] = useState(false);
      const [loading, setLoading] = useState(true);

      const [location, setLocation] = useState<LocationData | null>(null);
      const [locationLoading, setLocationLoading] = useState(false);
      const [city, setCity] = useState("Fetching Your City");

      const [cart, setCart] = useState<ICart[]>([]);
      const [subTotal, setSubTotal] = useState(0);
      const [quantity, setQuantity] = useState(0);

      async function fetchUser() {
            try {
                  const token = localStorage.getItem("token");
                  if (!token) {
                        throw new Error("Missing token");
                  }

                  const { data } = await axios.get(`${authBaseUrl}/profile`, {
                        headers: {
                              Authorization: `Bearer ${token}`
                        }
                  });
                  setUser(data.data);
                  setIsAuth(true);
            } catch (error: any) {
                  console.log(error);
                  toast.error(error?.response?.data?.message || "Something went wrong");
                  setUser(null);
                  setIsAuth(false);
            } finally {
                  setLoading(false);
            }
      };

      const fetchCart = useCallback(async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                  setCart([]);
                  setSubTotal(0);
                  setQuantity(0);
                  return;
            }
            try {
                  const { data } = await axios.get(`${cartBaseUrl}/all`, {
                        headers: { Authorization: `Bearer ${token}` }
                  });

                  setCart(data.data.cart || []);
                  setSubTotal(data.data.subTotal || 0);
                  setQuantity(data.data.cartLength || 0);
            } catch (error: any) {
                  console.log(error);
            }
      }, []);

      useEffect(() => {
            fetchUser();
      }, []);

      useEffect(() => {
            fetchCart();
      }, [fetchCart]);

      useEffect(() => {
            const cached = sessionStorage.getItem("locationData");
            if (cached) {
                  const { latitude, longitude, formattedAddress, city: cachedCity } = JSON.parse(cached);
                  setLocation({ latitude, longitude, formattedAddress });
                  setCity(cachedCity);
                  return;
            }

            if (!navigator.geolocation) {
                  toast.error("Geolocation is not supported by your browser");
                  return;
            }
            setLocationLoading(true);
            navigator.geolocation.getCurrentPosition(async (possition) => {
                  const { latitude, longitude } = possition.coords;
                  try {
                        const response = await fetch(
                              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
                              { headers: { "User-Agent": "AbarKhabo/1.0" } }
                        );
                        if (response.status === 429) {
                              throw new Error("Rate limited");
                        }
                        const data = await response.json();
                        const resolvedCity =
                              data.address.city_district ||
                              data.address.suburb ||
                              data.address.town ||
                              data.address.village ||
                              data.address.city ||
                              data.address.county ||
                              "Your Location";
                        const formattedAddress = data.display_name || "current location";

                        setLocation({ latitude, longitude, formattedAddress });
                        setCity(resolvedCity);
                        sessionStorage.setItem("locationData", JSON.stringify({ latitude, longitude, formattedAddress, city: resolvedCity }));
                        setLocationLoading(false);
                  } catch (error) {
                        console.error("Error fetching location data:", error);
                        toast.error("Failed to fetch location data");
                        setCity("Your Location");
                        setLocationLoading(false);
                  }
            });
      }, []);

      return (
            <AppContext.Provider
                  value={{
                        isAuth,
                        setIsAuth,
                        loading,
                        setLoading,
                        locationLoading,
                        user,
                        setUser,
                        location,
                        city,
                        cart,
                        fetchCart,
                        quantity,
                        subTotal
                  }}
            >
                  {children}
            </AppContext.Provider>
      );
};

export const useAppData = (): AppContextType => {
      const context = useContext(AppContext);
      if (!context) throw new Error("useAppData must be used within AppProvider");
      return context;
};