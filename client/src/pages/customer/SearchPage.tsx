import { useSearchParams } from "react-router-dom";
import { useAppData } from "@/context/AppContext";
import type { IRestaurant, IFoodSearchResult } from "@/types";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { addToCart as apiAddToCart, incrementCartQuantity, decrementCartQuantity } from "@/services/api/cart.services";
import { getNearestRestaurant } from "@/services/api/restaurant.services";
import { searchByFood as apiSearchByFood } from "@/services/api/menu.services";
import RestaurantsCard from "@/features/restaurant/components/RestaurantsCard";
import { SearchBar } from "@/features/customer";
import { BsCartPlus } from "react-icons/bs";
import { Loader, Minus, Plus, MapPin } from "lucide-react";
import { useMobile } from "@/hooks/useMobile";
import { useSocket } from "@/context/SocketContext";
import { AppSkeleton } from "@/components/common";
import { detectSearchType } from "@/utils";
import SEO from "@/components/common/SEO";
import StructuredData from "@/components/common/StructuredData";

const SearchPage = () => {
      const { location, locationLoading, detectUserLocation, cart, fetchCart } = useAppData();
      const [searchParams, setSearchParams] = useSearchParams();
      const search = searchParams.get("search") || "";
      const searchType = (searchParams.get("type") as "restaurant" | "food") || "restaurant";
      const isMobile = useMobile();
      const { socket } = useSocket();

      const [restaurants, setRestaurants] = useState<IRestaurant[]>([]);
      const [foodResults, setFoodResults] = useState<IFoodSearchResult[]>([]);
      const [loading, setLoading] = useState(false);
      const [correctedQuery, setCorrectedQuery] = useState<string | null>(null);
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
            const hasExplicitType = searchParams.get("type") !== null;
            const type = hasExplicitType ? searchType : (value ? detectSearchType(value) : searchType);
            const params: Record<string, string> = { type };
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
                  const data = await apiAddToCart({ restaurantId, itemId });
                  toast.success(data.message || "Added to cart");
                  await fetchCart();
            } catch (error: any) {
                  toast.error(error.message || "Failed to add to cart");
            } finally {
                  setLoadingItemId(null);
                  setLoadingAction(null);
            }
      };

      const increaseItem = async (itemId: string) => {
            try {
                  setLoadingItemId(itemId);
                  setLoadingAction("inc");
                  await incrementCartQuantity({ itemId });
                  await fetchCart();
            } catch (error: any) {
                  toast.error(error.message || "Failed to update cart");
            } finally {
                  setLoadingItemId(null);
                  setLoadingAction(null);
            }
      };

      const decreaseItem = async (itemId: string) => {
            try {
                  setLoadingItemId(itemId);
                  setLoadingAction("dec");
                  await decrementCartQuantity({ itemId });
                  await fetchCart();
            } catch (error: any) {
                  toast.error(error.message || "Failed to update cart");
            } finally {
                  setLoadingItemId(null);
                  setLoadingAction(null);
            }
      };

      const handleRequestLocation = () => {
            detectUserLocation(true);
      };

      useEffect(() => {
            if (!location?.latitude || !location.longitude) return;
            setRestaurants([]);
            setFoodResults([]);
            setCorrectedQuery(null);
            setLoading(true);
            joinedRooms.current.clear();


            if (searchType === "restaurant") {
                  getNearestRestaurant({ latitude: location.latitude, longitude: location.longitude, search, radius: 10000 })
                        .then((data) => {
                              setRestaurants(data.data || []);
                              if (data.correctedQuery) setCorrectedQuery(data.correctedQuery);
                        }).catch((error: any) => {
                              toast.error(error.message || "Failed to fetch restaurants");
                        }).finally(() => setLoading(false));
            } else {
                  apiSearchByFood({ latitude: location.latitude, longitude: location.longitude, search, radius: 10000 })
                        .then((data) => {
                              const results: IFoodSearchResult[] = data.data || [];
                              setFoodResults(results);
                              if (data.correctedQuery) setCorrectedQuery(data.correctedQuery);
                              if (socket) {
                                    results.forEach(({ restaurant: r }) => {
                                          if (!joinedRooms.current.has(r._id)) {
                                                socket.emit("join:restaurant", r._id);
                                                joinedRooms.current.add(r._id);
                                          }
                                    });
                              }
                        }).catch((error: any) => {
                              toast.error(error.message || "Failed to fetch food items");
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

            return () => {
                  socket.off("restaurant:status");
                  restaurants.forEach((r) => socket.emit("leave:restaurant", r._id));
            };
      }, [socket, restaurants.length]);



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

            return () => {
                  socket.off("menuitem:availability");
                  joinedRooms.current.forEach((id) => socket.emit("leave:restaurant", id));
            };
      }, [socket, searchType]);

      const searchSchema = {
            "@context": "https://schema.org",
            "@type": "SearchResultsPage",
            "mainEntity": {
                  "@type": "ItemList",
                  "numberOfItems": searchType === "restaurant" ? restaurants.length : foodResults.length,
                  "itemListElement": searchType === "restaurant" 
                        ? restaurants.map((r, i) => ({
                              "@type": "ListItem",
                              "position": i + 1,
                              "item": {
                                    "@type": "Restaurant",
                                    "name": r.name,
                                    "url": `https://kravix-nu.vercel.app/restaurant/${r.slug || r._id}`
                              }
                        }))
                        : foodResults.map((f, i) => ({
                              "@type": "ListItem",
                              "position": i + 1,
                              "item": {
                                    "@type": "MenuItem",
                                    "name": f.item.name,
                                    "offers": {
                                          "@type": "Offer",
                                          "price": `${f.item.price}`,
                                          "priceCurrency": "INR"
                                    }
                              }
                        }))
            }
      };

      return (
            <div className="container-app py-6 space-y-5">
                  <SEO
                        title="Search Restaurants & Dishes | Kravix"
                        description="Find the best restaurants and dishes near you on Kravix. Search for Bengali, Indian, Asian, and other delicious cuisines for fast delivery."
                        path="/search"
                  />
                  <StructuredData data={searchSchema} />
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

                  {correctedQuery && (
                        <p className="text-sm text-gray-500">
                              Showing results for{" "}
                              <span className="font-medium text-gray-800 italic">&ldquo;{correctedQuery}&rdquo;</span>
                              {" instead of "}
                              <span className="italic">&ldquo;{search}&rdquo;</span>
                        </p>
                  )}

                  {!location ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-gray-100 rounded-3xl text-center shadow-xs max-w-2xl mx-auto space-y-6 animate-fadeIn">
                              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <MapPin size={32} className="animate-bounce" />
                              </div>
                              <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-gray-800">Location Access Required</h3>
                                    <p className="text-xs text-text-secondary font-semibold max-w-md mx-auto leading-relaxed">
                                          Please allow location access to discover local restaurants, calculate delivery distance, and browse menus active in your area.
                                    </p>
                              </div>
                              <button 
                                    onClick={handleRequestLocation}
                                    disabled={locationLoading}
                                    className="px-6 py-3 bg-primary hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                    {locationLoading ? (
                                          <>
                                                <Loader size={16} className="animate-spin" />
                                                Detecting Location...
                                          </>
                                    ) : (
                                          "Allow Location Access"
                                    )}
                              </button>
                        </div>
                  ) : loading ? (
                        <AppSkeleton />
                  ) : searchType === "restaurant" ? (
                        restaurants.length > 0 ? (
                              <div className="container-app py-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {restaurants.map((restaurant) => {
                                          const [resLong, resLat] = restaurant.autoLocation.coordinates;
                                          const distance = getDistanceKm(location!.latitude, location!.longitude, resLat, resLong);
                                          return (
                                                <RestaurantsCard
                                                      key={restaurant._id}
                                                      id={restaurant._id}
                                                      slug={restaurant.slug}
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
                              <div className="container-app py-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {foodResults.map(({ item, restaurant }) => {
                                          const isLoading = loadingItemId === item._id;
                                          const cartItem = cart.find((c: any) =>
                                                (typeof c.itemId === "object" ? c.itemId._id : c.itemId) === item._id
                                          );
                                          return (
                                                <div key={item._id} className="group bg-white rounded-2xl border border-gray-100 hover:border-transparent shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col w-full overflow-hidden">
                                                      <div className="relative h-32 sm:h-36 w-full overflow-hidden shrink-0">
                                                            <img
                                                                  src={item.imageUrl || `"https://placehold.co/400x160?text=${encodeURIComponent(item.name)}`}
                                                                  alt={item.name}
                                                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                                  loading="lazy"
                                                                  width={400}
                                                                  height={160}
                                                                  decoding="async"
                                                            />
                                                      </div>
                                                      <div className="p-4 flex flex-col flex-1 gap-1">
                                                            <p className="font-bold text-gray-800 text-sm group-hover:text-primary transition-colors line-clamp-1">
                                                                  {item.name}
                                                            </p>
                                                            {item.description && (
                                                                  <p className="text-xs text-gray-400 font-semibold line-clamp-2 leading-relaxed">{item.description}</p>
                                                            )}
                                                            <div className="flex items-center justify-between gap-2 mt-auto pt-2.5 border-t border-gray-50">
                                                                  <div className="min-w-0 flex-1">
                                                                        <p className="text-primary font-extrabold text-sm">₹ {item.price}</p>
                                                                        <p className="text-[10px] text-gray-400 font-semibold truncate">📍 {restaurant.name} · {restaurant.distanceKm} km</p>
                                                                  </div>
                                                                  {cartItem ? (
                                                                        <div className="flex items-center border border-green-500 rounded-full shrink-0">
                                                                              <button
                                                                                    disabled={isLoading}
                                                                                    onClick={() => decreaseItem(item._id)}
                                                                                    className="px-2 py-1 text-green-600 hover:bg-green-50 disabled:text-gray-400 transition cursor-pointer"
                                                                                    aria-label={`Decrease quantity of ${item.name}`}
                                                                              >
                                                                                    {isLoading && loadingAction === "dec" ? <Loader size={12} className="animate-spin" /> : <Minus size={12} />}
                                                                              </button>
                                                                              <span className="text-sm font-semibold text-green-600 min-w-5 text-center">{cartItem.quantity}</span>
                                                                              <button
                                                                                    disabled={isLoading}
                                                                                    onClick={() => increaseItem(item._id)}
                                                                                    className="px-2 py-1 text-green-600 hover:bg-green-50 disabled:text-gray-400 transition cursor-pointer"
                                                                                    aria-label={`Increase quantity of ${item.name}`}
                                                                              >
                                                                                    {isLoading && loadingAction === "inc" ? <Loader size={12} className="animate-spin" /> : <Plus size={12} />}
                                                                              </button>
                                                                        </div>
                                                                  ) : (
                                                                        <button
                                                                              disabled={isLoading}
                                                                              onClick={() => addToCart(restaurant._id, item._id)}
                                                                              className="flex items-center justify-center rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:text-gray-400 transition cursor-pointer"
                                                                              aria-label={`Add ${item.name} to cart`}
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