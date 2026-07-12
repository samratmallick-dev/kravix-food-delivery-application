import { useEffect, useState } from "react";
import type { IMenuItem, IRestaurant } from "../types/types";
import Footer from "../components/home/footer";
import { fetchMyRestaurant as apiFetchMyRestaurant } from "../utils/restaurant.api";
import { getAllMenuItems } from "../utils/menu.api";
import AddRestaurant from "../components/restaurant/addRestaurant";
import RestaurantProfile from "../components/restaurant/restaurantProfile";
import Menuitems from "../components/restaurant/menuitems";
import AddMenuItems from "../components/restaurant/addMenuItems";
import RestaurantOrders from "../components/restaurant/restaurantOrders";
import SalesAnalytics from "../components/restaurant/SalesAnalytics";
import { useMobile } from "../components/common/useMobile";
import { useAppData } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import toast from "react-hot-toast";
import { storage } from "../utils/secureStorage";

type SellerTab = "menu" | "add-item" | "sales";

const Restaurant = () => {

      const { user, setUser } = useAppData();
      const { socket } = useSocket();
      const isBlocked = !!(user?.isBlocked && user.blockedUntil && new Date(user.blockedUntil) > new Date());

      const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
      const [loading, setLoading] = useState(true);
      const isMobile = useMobile();

      const [tab, setTab] = useState<SellerTab>(
            () => (storage.getRestaurantTab() as SellerTab) || "menu"
      );

      const handleTabChange = (value: SellerTab) => {
            setTab(value);
            storage.setRestaurantTab(value);
      };

      const fetchMyRestaurant = async () => {
            try {
                  const res = await apiFetchMyRestaurant();
                  const isNested = res.data && "restaurant" in res.data;
                  const restaurantData = isNested
                        ? (res.data as { restaurant: IRestaurant; token: string }).restaurant
                        : (res.data as IRestaurant);
                  const token = isNested
                        ? (res.data as { restaurant: IRestaurant; token: string }).token
                        : undefined;

                  if (token) {
                        storage.setToken(token);
                        setUser((prev) => prev ? { ...prev, restaurantId: restaurantData._id } : prev);
                  }
                  setRestaurant(restaurantData || null);
            } catch (error: any) {
                  console.log(error.message);
            } finally {
                  setLoading(false);
            }
      };

      useEffect(() => {
            fetchMyRestaurant();
      }, []);

      useEffect(() => {
            if (!socket || !restaurant?._id) return;
            const onVerified = ({ isVerified }: { isVerified: boolean }) => {
                  setRestaurant((prev) => prev ? { ...prev, isVerified } : prev);
            };
            const onDeleted = () => {
                  toast.error("Your restaurant has been removed by the admin.");
                  setRestaurant(null);
            };
            const onStatus = ({ isOpen }: { isOpen: boolean }) => {
                  setRestaurant((prev) => prev ? { ...prev, isOpen } : prev);
            };
            socket.emit("join:restaurant", restaurant._id);
            socket.on("restaurant:verified", onVerified);
            socket.on("restaurant:deleted", onDeleted);
            socket.on("restaurant:status", onStatus);
            return () => {
                  socket.off("restaurant:verified", onVerified);
                  socket.off("restaurant:deleted", onDeleted);
                  socket.off("restaurant:status", onStatus);
            };
      }, [socket, restaurant?._id]);

      const [menuItem, setMenuItem] = useState<IMenuItem[]>([]);

      const fetchMenuItem = async (restaurantId: string) => {
            try {
                  const data = await getAllMenuItems(restaurantId);
                  setMenuItem(Array.isArray(data.data) ? data.data : []);
            } catch (error) {
                  console.log(error);
            }
      };

      useEffect(() => {
            if (restaurant?._id) {
                  fetchMenuItem(restaurant._id);
            }
      }, [restaurant]);

      if (loading) {
            return (
                  <div className="w-full h-screen flex flex-col items-center justify-center gap-3">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-base font-medium text-gray-500">Loading your restaurant...</span>
                  </div>
            );
      }

      if (!restaurant) {
            return <AddRestaurant fetchMyRestaurant={fetchMyRestaurant} />
      }
      return (
            <div className="min-h-screen bg-background flex flex-col">
                  {isBlocked && (
                        <div className="flex items-center gap-3 bg-red-50 border-b border-red-200 px-6 py-3">
                              <span className="text-red-500 text-xl">🚫</span>
                              <div>
                                    <p className="text-sm font-semibold text-red-700">Your account is temporarily blocked</p>
                                    <p className="text-xs text-red-500">Your restaurant is hidden from customers and you cannot manage orders until {new Date(user!.blockedUntil!).toLocaleDateString("en-IN")}.</p>
                              </div>
                        </div>
                  )}
                  <RestaurantProfile restaurant={restaurant} onUpdate={setRestaurant} isSeller={true} fetchMyRestaurant={fetchMyRestaurant} />
                  <RestaurantOrders restaurantId={restaurant._id} />
                  <div className="w-full container-app sm:px-6 py-8 space-y-6">

                        <div className="rounded-2xl bg-white shadow-md overflow-hidden">
                              <div className="flex border-b border-gray-100">
                                    {[
                                          { label: "Menu", value: "menu" },
                                          { label: "Add Item", value: "add-item" },
                                          { label: "Sales", value: "sales" },
                                    ].map((item) => (
                                          <button
                                                key={item.value}
                                                onClick={() => handleTabChange(item.value as SellerTab)}
                                                className={`flex-1 text-sm font-medium transition cursor-pointer ${isMobile ? "py-2.5" : "py-3.5"} ${tab === item.value
                                                      ? "border-b-2 border-primary text-primary bg-primary/30"
                                                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                                      }`}
                                          >
                                                {isMobile && item.value === "add-item" ? "+Item" : item.label}
                                          </button>
                                    ))}
                              </div>

                              <div className="p-4 sm:p-6">
                                    {tab === "menu" && (
                                          <Menuitems
                                                items={menuItem}
                                                onItemDelete={() => fetchMenuItem(restaurant._id)}
                                                isSeller={true}
                                          />
                                    )}
                                    {tab === "add-item" && (
                                          <AddMenuItems onItemAdded={() => fetchMenuItem(restaurant._id)} />
                                    )}
                                    {tab === "sales" && (
                                          <SalesAnalytics restaurantId={restaurant._id} />
                                    )}
                              </div>
                        </div>
                  </div>
                  <Footer />
            </div>
      );
}

export default Restaurant;
