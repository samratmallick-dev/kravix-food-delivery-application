import axios from "axios";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { authBaseUrl, cartBaseUrl } from "../components/common/constant";
import toast from "react-hot-toast";
import type { ICart, AppContextType, LocationData, User } from "../types/types";

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
    children: ReactNode;
};

const isCacheStillValid = (
    cachedLat: number,
    cachedLng: number,
    freshLat: number,
    freshLng: number,
    thresholdDeg = 0.001
): boolean => {
    return (
        Math.abs(cachedLat - freshLat) < thresholdDeg &&
        Math.abs(cachedLng - freshLng) < thresholdDeg
    );
};

export const AppProvider = ({ children }: AppProviderProps) => {

    const [user, setUser] = useState<User | null>(null);
    const [isAuth, setIsAuth] = useState(() => !!localStorage.getItem("token"));
    const [loading, setLoading] = useState(false);

    const [location, setLocation] = useState<LocationData | null>(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [city, setCity] = useState("Fetching Your City");

    const [cart, setCart] = useState<ICart[]>([]);
    const [subTotal, setSubTotal] = useState(0);
    const [quantity, setQuantity] = useState(0);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setUser(null);
            setIsAuth(false);
            setLoading(false);
            return;
        }
        const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
            Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);

        Promise.allSettled([
            withTimeout(axios.get(`${authBaseUrl}/me`, { headers: { Authorization: `Bearer ${token}` } }), 5000),
            withTimeout(axios.get(`${cartBaseUrl}`, { headers: { Authorization: `Bearer ${token}` } }), 5000),
        ]).then(([userResult, cartResult]) => {
            if (userResult.status === "fulfilled") {
                setUser(userResult.value.data.data);
                setIsAuth(true);
            } else {
                console.error("auth fetch failed:", userResult.reason?.message);
                setUser(null);
                setIsAuth(false);
            }
            if (cartResult.status === "fulfilled") {
                setCart(cartResult.value.data.data.cart || []);
                setSubTotal(cartResult.value.data.data.subTotal || 0);
                setQuantity(cartResult.value.data.data.cartLength || 0);
            }
        }).finally(() => setLoading(false));
    }, []);

    const fetchCart = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) { setCart([]); setSubTotal(0); setQuantity(0); return; }
        try {
            const { data } = await axios.get(`${cartBaseUrl}`, {
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
        if (!navigator.geolocation) {
            const cached = sessionStorage.getItem("locationData");
            if (cached) {
                try {
                    const { latitude, longitude, formattedAddress, city: cachedCity } = JSON.parse(cached);
                    setLocation({ latitude, longitude, formattedAddress });
                    setCity(cachedCity ?? "Your Location");
                } catch {
                    sessionStorage.removeItem("locationData");
                }
            } else {
                toast.error("Geolocation is not supported by your browser");
            }
            return;
        }

        setLocationLoading(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const cached = sessionStorage.getItem("locationData");
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        if (isCacheStillValid(parsed.latitude, parsed.longitude, latitude, longitude)) {
                            setLocation({ latitude, longitude, formattedAddress: parsed.formattedAddress });
                            setCity(parsed.city ?? "Your Location");
                            setLocationLoading(false);
                            return;
                        } else {
                            console.log("Location changed, clearing stale sessionStorage cache");
                            sessionStorage.removeItem("locationData");
                        }
                    } catch {
                        sessionStorage.removeItem("locationData");
                    }
                }

                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
                        { headers: { "User-Agent": "Kravix/1.0" } }
                    );
                    if (response.status === 429) throw new Error("Rate limited");

                    const data = await response.json();
                    const resolvedCity =
                        data.address.city ||
                        data.address.town ||
                        data.address.village ||
                        data.address.suburb ||
                        data.address.city_district ||
                        data.address.county ||
                        "Your Location";
                    const formattedAddress = data.display_name || "current location";

                    setLocation({ latitude, longitude, formattedAddress });
                    setCity(resolvedCity);
                    sessionStorage.setItem(
                        "locationData",
                        JSON.stringify({ latitude, longitude, formattedAddress, city: resolvedCity })
                    );
                } catch (error) {
                    console.error("Error fetching location data:", error);
                    toast.error("Failed to fetch location data");
                    setCity("Your Location");
                    setLocation({ latitude, longitude, formattedAddress: `${latitude}, ${longitude}` });
                } finally {
                    setLocationLoading(false);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                const cached = sessionStorage.getItem("locationData");
                if (cached) {
                    try {
                        const { latitude, longitude, formattedAddress, city: cachedCity } = JSON.parse(cached);
                        setLocation({ latitude, longitude, formattedAddress });
                        setCity(cachedCity ?? "Your Location");
                        console.warn("GPS failed, using cached location as fallback");
                    } catch {
                        sessionStorage.removeItem("locationData");
                        toast.error("Unable to retrieve your location");
                    }
                } else {
                    toast.error("Unable to retrieve your location");
                    setCity("Your Location");
                }
                setLocationLoading(false);
            },
            { timeout: 8000, maximumAge: 0 }
        );
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
                setLocation,
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