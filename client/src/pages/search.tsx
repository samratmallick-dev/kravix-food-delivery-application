import { useSearchParams } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import type { IRestaurant } from "../types/types";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { restaurantBaseUrl } from "../components/common/constant";
import RestaurantsCard from "../components/restaurant/restaurantsCard";

const SearchPage = () => {

      const { location } = useAppData();
      const [searchParams] = useSearchParams();
      const search = searchParams.get("search") || "";

      const [restaurants, setRestaurants] = useState<IRestaurant[]>([]);
      const [loading, setLoading] = useState(true);

      const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
            const R = 6371;
            const dLat = ((lat2 - lat1) * Math.PI) / 180;
            const dLon = ((lon2 - lon1) * Math.PI) / 180;
            const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return +(R * c).toFixed(2);
      };

      useEffect(() => {
            if (!location?.latitude || !location.longitude) return;
            setLoading(true);
            axios.get(`${restaurantBaseUrl}/all`, {
                  params: { latitude: location.latitude, longitude: location.longitude, search },
                  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            }).then(({ data }) => {
                  setRestaurants(data.data || []);
            }).catch((error: any) => {
                  toast.error(error.response?.data?.message || "Failed to fetch restaurants");
            }).finally(() => setLoading(false));
      }, [location, search]);

      return (
            <div className="container-app py-6 space-y-4">
                  <h1 className="font-semibold md:text-2xl text-xl text-primary">
                        {search ? `Results for "${search}"` : "All Restaurants"}
                  </h1>
                  {loading ? (
                        <p className="text-xl font-semibold text-center py-20">Finding restaurants near you...</p>
                  ) : restaurants.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {restaurants.map((restaurant) => {
                                    const [resLong, resLat] = restaurant.autoLocation.coordinates;
                                    const distance = getDistanceKm(
                                          location!.latitude, location!.longitude, resLat, resLong
                                    );
                                    return (
                                          <RestaurantsCard
                                                key={restaurant._id}
                                                id={restaurant._id}
                                                name={restaurant.name}
                                                image={restaurant.image ?? ""}
                                                distance={`${distance}`}
                                                isOpen={restaurant.isOpen}
                                          />
                                    );
                              })}
                        </div>
                  ) : (
                        <p className="text-center text-gray-600">No Restaurant Found...</p>
                  )}
            </div>
      );
};

export default SearchPage;
