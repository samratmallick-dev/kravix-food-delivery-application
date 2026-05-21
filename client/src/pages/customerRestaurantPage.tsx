import { useParams, useNavigate } from "react-router-dom";
import type { IMenuItem, IRestaurant } from "../types/types";
import { useEffect, useState } from "react";
import { menuBaseUrl, restaurantBaseUrl } from "../components/common/constant";
import axios from "axios";
import RestaurantProfile from "../components/restaurant/restaurantProfile";
import Menuitems from "../components/restaurant/menuitems";
import { useAppData } from "../context/AppContext";
import { ShoppingCart } from "lucide-react";
import { useMobile } from "../components/common/useMobile";
import { useSocket } from "../context/SocketContext";
import AppSkeleton from "../components/common/AppSkeleton";
import toast from "react-hot-toast";
import { storage } from "../utils/secureStorage";

const CustomerRestaurantPage = () => {
      const { id } = useParams();
      const navigate = useNavigate();
      const { cart } = useAppData();
      const isMobile = useMobile();
      const { socket } = useSocket();

      const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
      const [menuItem, setMenuItem] = useState<IMenuItem[]>([]);
      const [loading, setLoading] = useState(true);

      const fetchRestaurant = async () => {
            try {
                  const { data } = await axios.get(`${restaurantBaseUrl}/${id}`, {
                        headers: {
                              Authorization: `Bearer ${storage.getToken()}`
                        }, withCredentials: true
                  });
                  setRestaurant(data.data || null);
            } catch (error) {
                  console.log(error);
            } finally {
                  setLoading(false);
            }
      };

      const fetchMenuItem = async () => {
            try {
                  const { data } = await axios.get(`${menuBaseUrl}/${id}`, {
                        headers: {
                              Authorization: `Bearer ${storage.getToken()}`
                        }, withCredentials: true
                  });

                  setMenuItem(Array.isArray(data.data) ? data.data : []);
            } catch (error) {
                  console.log(error);
            }
      };

      useEffect(() => {
            if (id) {
                  fetchRestaurant();
                  fetchMenuItem();
            }
      }, [id]);

      useEffect(() => {
            if (!socket || !id) return;

            socket.emit("join:restaurant", id);

            const onStatus = ({ isOpen }: { isOpen: boolean }) => {
                  setRestaurant((prev) => prev ? { ...prev, isOpen } : prev);
            };
            const onVerified = ({ isVerified }: { isVerified: boolean }) => {
                  setRestaurant((prev) => prev ? { ...prev, isVerified } : prev);
            };
            const onDeleted = () => {
                  toast.error("This restaurant is no longer available.");
                  navigate("/");
            };
            const onAvailability = ({ itemId, isAvailable }: { itemId: string; isAvailable: boolean }) => {
                  setMenuItem((prev) =>
                        prev.map((m) => m._id === itemId ? { ...m, isAvailable } : m)
                  );
            };

            socket.on("restaurant:status", onStatus);
            socket.on("restaurant:verified", onVerified);
            socket.on("restaurant:deleted", onDeleted);
            socket.on("menuitem:availability", onAvailability);

            return () => {
                  socket.off("restaurant:status", onStatus);
                  socket.off("restaurant:verified", onVerified);
                  socket.off("restaurant:deleted", onDeleted);
                  socket.off("menuitem:availability", onAvailability);
            };
      }, [socket, id]);

      if (loading) return <AppSkeleton />;

      if (!restaurant) {
            return (
                  <div className="flex items-center justify-center h-screen">
                        <p className="text-xl font-semibold">No Restaurant found with this id: {id}</p>
                  </div>
            );
      }

      return (
            <div className="w-full min-h-auto bg-background">
                  <RestaurantProfile
                        restaurant={restaurant} onUpdate={setRestaurant} isSeller={false}
                        fetchMyRestaurant={fetchRestaurant}
                  />
                  <div className="container-app p-4">
                        <Menuitems items={menuItem} onItemDelete={() => {}} isSeller={false} />
                  </div>
                  {cart.length > 0 && (
                        <button
                              onClick={() => {
                                    navigate("/cart");
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="fixed left-1/2 -translate-x-1/2 flex items-center gap-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all z-50"
                              style={{ bottom: isMobile ? 16 : 24, padding: isMobile ? "10px 20px" : "12px 24px", fontSize: isMobile ? "0.875rem" : "1rem" }}
                        >
                              <ShoppingCart size={isMobile ? 16 : 18} />
                              View Cart ({cart.length})
                        </button>
                  )}
            </div>
      );
}

export default CustomerRestaurantPage;
