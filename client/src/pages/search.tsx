import { useSearchParams } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import type { IRestaurant, IFoodSearchResult } from "../types/types";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { restaurantBaseUrl, menuBaseUrl, cartBaseUrl } from "../components/common/constant";
import RestaurantsCard from "../components/restaurant/restaurantsCard";
import SearchBar from "../components/navbar/SearchBar";
import { BsCartPlus } from "react-icons/bs";
import { Loader, Minus, Plus } from "lucide-react";
import { useMobile } from "../components/common/useMobile";
import { useSocket } from "../context/SocketContext";
import AppSkeleton from "../components/common/AppSkeleton";

const SearchPage = () => {
      const { location, cart, fetchCart } = useAppData();
      const [searchParams, setSearchParams] = useSearchParams();
      const search = searchParams.get("search") || "";
      const searchType = (searchParams.get("type") as "restaurant" | "food") || "restaurant";
      const isMobile = useMobile();
      const { socket } = useSocket();

      const [restaurants, setRestaurants] = useState<IRestaurant[]>([]);
      const [foodResults, setFoodResults] = useState<IFoodSearchResult[]>([]);
      const [loading, setLoading] = useState(false);
      const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
      const [loadingAction, setLoadingAction] = useState<"inc" | "dec" | "add" | null>(null);
      const joinedRooms = useRef<Set<string>>(new Set());

      const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
            const R = 6371;
            const dLat = ((lat2 - lat1) * Math.PI) / 180;
            const dLon = ((lon2 - lon1) * Math.PI) / 180;
            const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return +(R * c).toFixed(2);
      };

      const handleSearch = (value: string) => {
            const params: Record<string, string> = { type: searchType };
            if (value) params.search = value;
            setSearchParams(params);
      };

      const setType = (type: "restaurant" | "food") => {
            const params: Record<string, string> = { type };
            if (search) params.search = search;
            setSearchParams(params);
      };

      const addToCart = async (restaurantId: string, itemId: string) => {
            try {
                  setLoadingItemId(itemId);
                  setLoadingAction("add");
                  const { data } = await axios.post(`${cartBaseUrl}`, { restaurantId, itemId }, {
                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                  });
                  toast.success(data.message);
                  await fetchCart();
            } catch (error: any) {
                  toast.error(error.response?.data?.message || "Failed to add to cart");
            } finally {
                  setLoadingItemId(null);
                  setLoadingAction(null);
            }
      };

      const increaseItem = async (itemId: string) => {
            try {
                  setLoadingItemId(itemId);
                  setLoadingAction("inc");
                  await axios.patch(`${cartBaseUrl}/increment`, { itemId }, {
                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                  });
                  await fetchCart();
            } catch (error: any) {
                  toast.error(error.response?.data?.message || "Failed to update cart");
            } finally {
                  setLoadingItemId(null);
                  setLoadingAction(null);
            }
      };

      const decreaseItem = async (itemId: string) => {
            try {
                  setLoadingItemId(itemId);
                  setLoadingAction("dec");
                  await axios.patch(`${cartBaseUrl}/decrement`, { itemId }, {
                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                  });
                  await fetchCart();
            } catch (error: any) {
                  toast.error(error.response?.data?.message || "Failed to update cart");
            } finally {
                  setLoadingItemId(null);
                  setLoadingAction(null);
            }
      };

      useEffect(() => {
            if (!location?.latitude || !location.longitude) return;
            setLoading(true);
            joinedRooms.current.clear();
            const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

            if (searchType === "restaurant") {
                  axios.get(`${restaurantBaseUrl}`, {
                        params: { latitude: location.latitude, longitude: location.longitude, search },
                        headers
                  }).then(({ data }) => {
                        setRestaurants(data.data || []);
                  }).catch((error: any) => {
                        toast.error(error.response?.data?.message || "Failed to fetch restaurants");
                  }).finally(() => setLoading(false));
            } else {
                  axios.get(`${menuBaseUrl}/search`, {
                        params: { latitude: location.latitude, longitude: location.longitude, search },
                        headers
                  }).then(({ data }) => {
                        const results: IFoodSearchResult[] = data.data || [];
                        setFoodResults(results);
                        if (socket) {
                              results.forEach(({ restaurant: r }) => {
                                    if (!joinedRooms.current.has(r._id)) {
                                          socket.emit("join:restaurant", r._id);
                                          joinedRooms.current.add(r._id);
                                    }
                              });
                        }
                  }).catch((error: any) => {
                        toast.error(error.response?.data?.message || "Failed to fetch food items");
                  }).finally(() => setLoading(false));
            }
      }, [location, search, searchType]);

      useEffect(() => {
            if (!socket || restaurants.length === 0) return;

            restaurants.forEach((r) => socket.emit("join:restaurant", r._id));

            socket.on("restaurant:status", ({ isOpen, restaurantId }: { isOpen: boolean; restaurantId: string }) => {
                  setRestaurants((prev) =>
                        prev.map((r) => r._id === restaurantId ? { ...r, isOpen } : r)
                  );
            });

            return () => { socket.off("restaurant:status"); };
      }, [socket, restaurants.length]);

      useEffect(() => {
            if (!socket || !location?.latitude || !location.longitude || searchType !== "food") return;

            const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
            axios.get(`${restaurantBaseUrl}`, {
                  params: { latitude: location.latitude, longitude: location.longitude },
                  headers
            }).then(({ data }) => {
                  const nearby: IRestaurant[] = data.data || [];
                  nearby.forEach(({ _id }) => {
                        if (!joinedRooms.current.has(_id)) {
                              socket.emit("join:restaurant", _id);
                              joinedRooms.current.add(_id);
                        }
                  });
            }).catch(() => {});
      }, [socket, searchType, location]);

      useEffect(() => {
            if (!socket || searchType !== "food") return;

            socket.on("menuitem:availability", ({ itemId, isAvailable, item, restaurant: r }: { itemId: string; isAvailable: boolean; item?: IFoodSearchResult["item"]; restaurant?: IFoodSearchResult["restaurant"] }) => {
                  if (!isAvailable) {
                        setFoodResults((prev) => prev.filter((f) => f.item._id !== itemId));
                  } else if (item && r) {
                        if (!joinedRooms.current.has(r._id)) {
                              socket.emit("join:restaurant", r._id);
                              joinedRooms.current.add(r._id);
                        }
                        setFoodResults((prev) =>
                              prev.some((f) => f.item._id === itemId)
                                    ? prev
                                    : [...prev, { item, restaurant: r }]
                        );
                  }
            });

            return () => { socket.off("menuitem:availability"); };
      }, [socket, searchType]);

      return (
            <div className="container-app py-6 space-y-5">
                  <SearchBar initialValue={search} onSearch={handleSearch} autoFocus />

                  <div className="flex items-center justify-between flex-wrap gap-3">
                        <h1 className={`font-semibold text-primary ${isMobile ? "text-lg" : "text-2xl"}`}>
                              {search
                                    ? `Results for "${search}"`
                                    : searchType === "restaurant" ? "All Restaurants" : "All Food Items"}
                        </h1>
                        <div className="flex rounded-lg overflow-hidden border border-gray-300">
                              <button
                                    onClick={() => setType("restaurant")}
                                    className={`px-4 py-1.5 text-sm font-medium transition-colors ${searchType === "restaurant" ? "bg-primary text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
                              >
                                    Restaurant
                              </button>
                              <button
                                    onClick={() => setType("food")}
                                    className={`px-4 py-1.5 text-sm font-medium transition-colors ${searchType === "food" ? "bg-primary text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
                              >
                                    Food
                              </button>
                        </div>
                  </div>

                  {loading ? (
                        <AppSkeleton />
                  ) : searchType === "restaurant" ? (
                        restaurants.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {restaurants.map((restaurant) => {
                                          const [resLong, resLat] = restaurant.autoLocation.coordinates;
                                          const distance = getDistanceKm(location!.latitude, location!.longitude, resLat, resLong);
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
                              <p className="text-center text-gray-500 py-20">No restaurants found</p>
                        )
                  ) : (
                        foodResults.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {foodResults.map(({ item, restaurant }) => {
                                          const isLoading = loadingItemId === item._id;
                                          const cartItem = cart.find(c =>
                                                (typeof c.itemId === "object" ? c.itemId._id : c.itemId) === item._id
                                          );
                                          return (
                                                <div key={item._id} className="bg-white rounded-xl shadow hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                                                      <div>
                                                            <img
                                                                  src={item.imageUrl || "https://placehold.co/400x160?text=Food"}
                                                                  alt={item.name}
                                                                  className="w-full h-40 object-cover"
                                                            />
                                                      </div>
                                                      <div className="p-3 flex flex-col flex-1 gap-1">
                                                            <p className="font-semibold text-gray-800 truncate">
                                                                  {item.name}
                                                            </p>
                                                            {item.description && (
                                                                  <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
                                                            )}
                                                            <div className="flex items-center justify-between mt-auto pt-2">
                                                                  <div>
                                                                        <p className="text-primary font-bold">₹ {item.price}</p>
                                                                        <p className="text-xs text-gray-400 truncate">📍 {restaurant.name} · {restaurant.distanceKm} km</p>
                                                                  </div>
                                                                  {cartItem ? (
                                                                        <div className="flex items-center border border-green-500 rounded-full overflow-hidden">
                                                                              <button
                                                                                    disabled={isLoading}
                                                                                    onClick={() => decreaseItem(item._id)}
                                                                                    className="px-2 py-1 text-green-600 hover:bg-green-50 disabled:text-gray-400 transition"
                                                                              >
                                                                                    {isLoading && loadingAction === "dec" ? <Loader size={12} className="animate-spin" /> : <Minus size={12} />}
                                                                              </button>
                                                                              <span className="text-sm font-semibold text-green-600 min-w-5 text-center">{cartItem.quantity}</span>
                                                                              <button
                                                                                    disabled={isLoading}
                                                                                    onClick={() => increaseItem(item._id)}
                                                                                    className="px-2 py-1 text-green-600 hover:bg-green-50 disabled:text-gray-400 transition"
                                                                              >
                                                                                    {isLoading && loadingAction === "inc" ? <Loader size={12} className="animate-spin" /> : <Plus size={12} />}
                                                                              </button>
                                                                        </div>
                                                                  ) : (
                                                                        <button
                                                                              disabled={isLoading}
                                                                              onClick={() => addToCart(restaurant._id, item._id)}
                                                                              className="flex items-center justify-center rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:text-gray-400 transition"
                                                                        >
                                                                              {isLoading && loadingAction === "add" ? <Loader size={18} className="animate-spin" /> : <BsCartPlus size={18} />}
                                                                        </button>
                                                                  )}
                                                            </div>
                                                      </div>
                                                </div>
                                          );
                                    })}
                              </div>
                        ) : (
                              <p className="text-center text-gray-500 py-20">No food items found</p>
                        )
                  )}
            </div>
      );
};

export default SearchPage;
