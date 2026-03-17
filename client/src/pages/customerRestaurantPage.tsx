import { useParams } from "react-router-dom";
import type { IMenuItem, IRestaurant } from "../types/types";
import { useEffect, useState } from "react";
import { menuBaseUrl, restaurantBaseUrl } from "../components/common/constant";
import axios from "axios";
import RestaurantProfile from "../components/restaurant/restaurantProfile";
import Menuitems from "../components/restaurant/menuitems";

const CustomerRestaurantPage = () => {
      const { id } = useParams();

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
            </div>
      );
}

export default CustomerRestaurantPage;
