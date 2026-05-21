import { useSearchParams } from "react-router-dom";
import Hero from "../components/home/hero";
import { useAppData } from "../context/AppContext";
import type { IRestaurant } from "../types/types";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { restaurantBaseUrl } from "../components/common/constant";
import FeatureBanmner from "../components/home/featureBanner";
import RestaurantsCard from "../components/restaurant/restaurantsCard";
import { useMobile } from "../components/common/useMobile";
import { useSocket } from "../context/SocketContext";
import AppSkeleton from "../components/common/AppSkeleton";

const Home = () => {

      const { location } = useAppData();
      const [searchParams] = useSearchParams();
      const isMobile = useMobile();
      const { socket } = useSocket();

      const search = searchParams.get("search") || "";

      const [retaurants, setRestaurants] = useState<IRestaurant[]>([]);
      const [loading, setLoading] = useState(true);
      const [searching, setSearching] = useState(false);

      const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
            const R = 6371;
            const dLat = ((lat2 - lat1) * Math.PI) / 180;
            const dLon = ((lon2 - lon1) * Math.PI) / 180;
            const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return +(R * c).toFixed(2);
      };

      const fetchRestaurant = async () => {
            if (!location?.latitude || !location.longitude) {
                  toast.error("You need to give parmission of your location to continue");
                  throw new Error("You need to give parmission of your location to continue");
            }
            try {
                  if (search) setSearching(true);
                  else setLoading(true);
                  const { data } = await axios.get(`${restaurantBaseUrl}`, {
                        params: {
                              latitude: location.latitude,
                              longitude: location.longitude,
                              search
                        },
                        headers: {
                              Authorization: `Bearer ${localStorage.getItem("token")}`
                        }
                  });
                  setRestaurants(data.data || []);
                  setLoading(false);
                  setSearching(false);
            } catch (error: any) {
                  console.log(error);
                  toast.error(error.response?.data?.message || "Failed to fetch restaurants");
            }
      };
      useEffect(() => {
            if (!location) return;
            fetchRestaurant();
      }, [location, search]);

      useEffect(() => {
            if (!socket) return;

            retaurants.forEach((r) => socket.emit("join:restaurant", r._id));

            socket.on("restaurant:status", ({ isOpen, restaurantId }: { isOpen: boolean; restaurantId: string }) => {
                  setRestaurants((prev) =>
                        prev.map((r) => r._id === restaurantId ? { ...r, isOpen } : r)
                  );
            });

            socket.on("restaurant:verified", ({ restaurantId, isVerified }: { restaurantId: string; isVerified: boolean }) => {
                  if (isVerified) {
                        fetchRestaurant();
                  } else {
                        setRestaurants((prev) => prev.filter((r) => r._id !== restaurantId));
                  }
            });

            socket.on("restaurant:deleted", ({ restaurantId }: { restaurantId: string }) => {
                  setRestaurants((prev) => prev.filter((r) => r._id !== restaurantId));
            });

            socket.on("restaurant:ownerBlocked", ({ restaurantId, isBlocked }: { restaurantId: string; isBlocked: boolean }) => {
                  if (isBlocked) {
                        setRestaurants((prev) => prev.filter((r) => r._id !== restaurantId));
                  } else {
                        fetchRestaurant();
                  }
            });

            return () => {
                  socket.off("restaurant:status");
                  socket.off("restaurant:verified");
                  socket.off("restaurant:deleted");
                  socket.off("restaurant:ownerBlocked");
            };
      }, [socket, retaurants.length]);

      if ((loading && !searching) || !location) {
            return <AppSkeleton />;
      }

      return (
            <div>
                  <Hero />
                  <FeatureBanmner />
                  <div className="container-app py-5 space-y-3">
                        <h1 className={`font-semibold text-wrap text-primary ${isMobile ? "text-lg" : "text-2xl"}`}>Your Nearest Restaurants</h1>
                        {searching && (
                              <p className="text-sm text-gray-400 animate-pulse">Searching...</p>
                        )}
                        {
                              retaurants.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                          {
                                                retaurants.map((restaurant) => {
                                                      const [resLong, resLat] = restaurant.autoLocation.coordinates;
                                                      const distance = getDistanceKm(
                                                            location.latitude,
                                                            location.longitude,
                                                            resLat,
                                                            resLong
                                                      );
                                                      return <RestaurantsCard
                                                            key={restaurant._id}
                                                            id={restaurant._id}
                                                            name={restaurant.name}
                                                            image={restaurant.image ?? ""}
                                                            distance={`${distance}`}
                                                            isOpen={restaurant.isOpen}
                                                      />;
                                                })
                                          }
                                    </div>
                              ) : (
                                    <p className="text-center text-gray-600">No Restaurant Found...</p>
                              )
                        }
                  </div>
            </div>
      );
}

export default Home;
