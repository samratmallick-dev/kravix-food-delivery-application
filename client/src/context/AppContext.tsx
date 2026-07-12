import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import type { ICart, AppContextType, LocationData, User } from "@/types";
import { storage } from "@/utils";
import { getMyProfile } from "@/services/api/auth.services";
import { fetchCart as apiFetchCart } from "@/services/api/cart.services";
import { locationService } from "@/utils";

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
    children: ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {

    const [user, setUser] = useState<User | null>(null);
    const [isAuth, setIsAuth] = useState(() => !!storage.getToken());
    const [loading, setLoading] = useState(true);

    const [location, setLocation] = useState<LocationData | null>(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [city, setCity] = useState("Fetching Your City");

    const [cart, setCart] = useState<ICart[]>([]);
    const [subTotal, setSubTotal] = useState(0);
    const [quantity, setQuantity] = useState(0);

    const fetchCurrentUser = useCallback(async () => {
        const token = storage.getToken();
        if (!token) {
            setUser(null);
            setIsAuth(false);
            return null;
        }
        try {
            const res = await getMyProfile(token);
            setUser(res.data);
            setIsAuth(true);
            if (res.data?.role) {
                localStorage.setItem("userRole", res.data.role);
            }
            return res.data;
        } catch (error: any) {
            const status = error.status;
            if (status === 401 || status === 403) {
                storage.removeToken();
                setUser(null);
                setIsAuth(false);
            } else {
                console.error("auth fetch failed:", error.message);
            }
            return null;
        }
    }, []);

    const fetchCart = useCallback(async () => {
        const token = storage.getToken();
        if (!token) { setCart([]); setSubTotal(0); setQuantity(0); return; }
        
        const path = typeof window !== "undefined" ? window.location.pathname : "";
        const isNonCustomerPath = path.startsWith("/seller") || path.startsWith("/rider") || path.startsWith("/admin");
        const cachedRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
        if (isNonCustomerPath || (cachedRole && cachedRole !== "customer") || (user && user.role !== "customer")) {
            setCart([]);
            setSubTotal(0);
            setQuantity(0);
            return;
        }
        try {
            const res = await apiFetchCart(token);
            setCart(res.data?.cart || []);
            setSubTotal(res.data?.subTotal || 0);
            setQuantity(res.data?.cartLength || 0);
        } catch (error: any) {
            console.error(error);
        }
    }, [user]);

    useEffect(() => {
        const token = storage.getToken();
        if (!token) {
            setUser(null);
            setIsAuth(false);
            setLoading(false);
            return;
        }
        const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
            Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);

        const init = async () => {
            try {
                const path = typeof window !== "undefined" ? window.location.pathname : "";
                const isNonCustomerPath = path.startsWith("/seller") || path.startsWith("/rider") || path.startsWith("/admin");
                const cachedRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;

                if (isNonCustomerPath || (cachedRole && cachedRole !== "customer")) {
                    const userData = await withTimeout(fetchCurrentUser(), 5000);
                    if (userData && userData.role !== "customer") {
                        setCart([]);
                        setSubTotal(0);
                        setQuantity(0);
                    } else if (userData && userData.role === "customer") {
                        await withTimeout(fetchCart(), 5000);
                    }
                } else {
                    const [userData] = await Promise.all([
                        withTimeout(fetchCurrentUser(), 5000),
                        withTimeout(fetchCart(), 5000)
                    ]);
                    if (userData && userData.role !== "customer") {
                        setCart([]);
                        setSubTotal(0);
                        setQuantity(0);
                    }
                }
            } catch (error) {
                console.error("Init failed:", error);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [fetchCurrentUser, fetchCart]);

    const detectUserLocation = useCallback(async (forcePrompt = false): Promise<boolean> => {
        if (!locationService.isSupported()) {
            toast.error("Geolocation is not supported by your browser");
            setCity("Location Not Supported");
            return false;
        }

        const permission = await locationService.getPermissionState();
        if (permission === "denied" && forcePrompt) {
            toast.error("Location access is blocked. Please allow location permissions in browser settings.");
            return false;
        }

        const cached = localStorage.getItem("locationData");
        if (cached && !forcePrompt) {
            try {
                const parsed = JSON.parse(cached);
                setLocation({
                    latitude: parsed.latitude,
                    longitude: parsed.longitude,
                    formattedAddress: parsed.formattedAddress
                });
                setCity(parsed.city ?? "Your Location");
                return true;
            } catch {
                localStorage.removeItem("locationData");
            }
        }

        try {
            setLocationLoading(true);
            const data = await locationService.getCurrentLocation();
            
            setLocation({
                latitude: data.latitude,
                longitude: data.longitude,
                formattedAddress: data.formattedAddress
            });
            setCity(data.city);

            localStorage.setItem("locationData", JSON.stringify(data));
            return true;
        } catch (err: any) {
            console.error("Location retrieval failed:", err);
            if (err.message === "PERMISSION_DENIED") {
                toast.error("Location access was denied. Please enable location permissions in browser settings.");
            } else if (err.message === "POSITION_UNAVAILABLE") {
                toast.error("Location unavailable. Please check your GPS settings.");
            } else if (err.message === "TIMEOUT") {
                toast.error("Location request timed out. Please try again.");
            } else {
                toast.error("Failed to detect location. Please try again.");
            }
        } finally {
            setLocationLoading(false);
        }

        return false;
    }, []);

    useEffect(() => {
        const initLocation = async () => {
            const cached = localStorage.getItem("locationData");
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    setLocation({
                        latitude: parsed.latitude,
                        longitude: parsed.longitude,
                        formattedAddress: parsed.formattedAddress
                    });
                    setCity(parsed.city ?? "Your Location");
                    return;
                } catch {
                    localStorage.removeItem("locationData");
                }
            }
            const permission = await locationService.getPermissionState();
            if (permission === "granted" || permission === "prompt") {
                await detectUserLocation(false);
            }
        };
        initLocation();
    }, [detectUserLocation]);

    const contextValue = useMemo(() => ({
        isAuth,
        setIsAuth,
        loading,
        setLoading,
        locationLoading,
        user,
        setUser,
        location,
        setLocation,
        city,
        cart,
        fetchCart,
        fetchCurrentUser,
        quantity,
        subTotal,
        detectUserLocation
    }), [
        isAuth,
        loading,
        locationLoading,
        user,
        location,
        city,
        cart,
        fetchCart,
        fetchCurrentUser,
        quantity,
        subTotal,
        detectUserLocation
    ]);

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppData = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useAppData must be used within AppProvider");
    return context;
};