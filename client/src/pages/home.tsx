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

const Home = () => {

      const { location } = useAppData();
      const [searchParams] = useSearchParams();

      const search = searchParams.get("search") || "";

      const [retaurants, setRestaurants] = useState<IRestaurant[]>([]);
      const [loading, setLoading] = useState(true);

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
                  setLoading(true);
                  const { data } = await axios.get(`${restaurantBaseUrl}/all`, {
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
            } catch (error: any) {
                  console.log(error);
                  toast.error(error.response?.data?.message || "Failed to fetch restaurants");
            }
      };
      useEffect(() => {
            if (!location) return;
            fetchRestaurant();
      }, [location, search]);

      if (loading || !location) {
            return (
                  <div className="flex items-center justify-center h-screen">
                        <p className="text-xl font-semibold">Finding Restaurant near you...</p>
                  </div>
            );
      }

      return (
            <div>
                  <Hero />
                  <FeatureBanmner />
                  <div className="container-app py-5 space-y-3">
                        <h1 className="font-semibold md:text-2xl text-xl text-wrap text-primary">Your Nearest Restaurants</h1>
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
