import axios from "axios";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authBaseUrl } from "../components/common/constant";
import toast from "react-hot-toast";
import type { AppContextType, LocationData, User } from "../types/types";

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
      children: ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {

      const [user, setUser] = useState<User | null>(null);
      const [isAuth, setIsAuth] = useState(false);
      const [loading, setLoading] = useState(false);

      const [location, setLocation] = useState<LocationData | null>(null);
      const [locationLoading, setLocationLoading] = useState(false);
      const [city, setCity] = useState("Fetching Your City");

      async function fetchUser() {
            try {
                  const token = localStorage.getItem("token");
                  if (!token) {
                        throw new Error("Missing token");
                  }

                  const { data } = await axios.get(`${authBaseUrl}/api/v1/auth/profile`, {
                        headers: {
                              Authorization: `Bearer ${token}`
                        }
                  });
                  setUser(data.data);
                  setIsAuth(true);
            } catch (error: any) {
                  console.log(error);
                  toast.error(error.response?.data?.message || "Failed to fetch user")
                  setUser(null);
                  setIsAuth(false);
            } finally {
                  setLoading(false);
            }
      };

      useEffect(() => {
            fetchUser();
      }, []);

      return (
            <AppContext.Provider
                  value={{
                        isAuth,
                        setIsAuth,
                        loading,
                        setLoading,
                        user,
                        setUser,
                        location,
                        city,
                        locationLoading
                  }}
            >
                  {children}
            </AppContext.Provider>
      );
};

export const useAppData = () : AppContextType => {
      const context = useContext(AppContext);
      if (!context) throw new Error("useAppData must be used within AppProvider");
      return context;
};