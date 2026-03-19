import { useParams, useNavigate } from "react-router-dom";
import type { IMenuItem, IRestaurant } from "../types/types";
import { useEffect, useState } from "react";
import { menuBaseUrl, restaurantBaseUrl } from "../components/common/constant";
import axios from "axios";
import RestaurantProfile from "../components/restaurant/restaurantProfile";
import Menuitems from "../components/restaurant/menuitems";
import { useAppData } from "../context/AppContext";
import { ShoppingCart } from "lucide-react";

const CustomerRestaurantPage = () => {
      const { id } = useParams();
      const navigate = useNavigate();
      const { cart } = useAppData();

      const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
      const [menuItem, setMenuItem] = useState<IMenuItem[]>([]);
      const [loading, setLoading] = useState(true);

      const fetchRestaurant = async () => {
            try {
                  const { data } = await axios.get(`${restaurantBaseUrl}/${id}`, {
                        headers: {
                              Authorization: `Bearer ${localStorage.getItem("token")}`
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
                  const { data } = await axios.get(`${menuBaseUrl}/all/${id}`, {
                        headers: {
                              Authorization: `Bearer ${localStorage.getItem("token")}`
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

      if (loading) {
            return (
                  <div className="flex items-center justify-center h-screen">
                        <p className="text-xl font-semibold">Loading Restaurant...</p>
                  </div>
            );
      }

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
                              className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full shadow-lg hover:bg-primary/90 transition-all z-50"
                        >
                              <ShoppingCart size={18} />
                              View Cart ({cart.length})
                        </button>
                  )}
            </div>
      );
}

export default CustomerRestaurantPage;
