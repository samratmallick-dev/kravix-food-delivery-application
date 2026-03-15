import { useEffect, useState } from "react";
import type { IRestaurant } from "../types/types";
import axios from "axios";
import { restaurantBaseUrl } from "../components/common/constant";
import AddRestaurant from "../components/restaurant/addRestaurant";
import RestaurantProfile from "../components/restaurant/restaurantProfile";

const Restaurant = () => {

      const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
      const [loading, setLoading] = useState(true);

      const fetchMyRestaurant = async () => {
            try {
                  const token = localStorage.getItem("token");
                  const { data } = await axios.get(`${restaurantBaseUrl}/my-restaurant`, {
                        headers: {
                              Authorization: `Bearer ${token}`
                        },
                        withCredentials: true
                  });

                  console.log(data);
                  
                  
                  if (data.token) {
                        localStorage.setItem("token", data.token);
                  }
                  setRestaurant(data.data || null);
            } catch (error: any) {
                  console.log(error.message);
            } finally {
                  setLoading(false);
            }
      };

      useEffect(()=> {
            fetchMyRestaurant();
      },[])

      if (loading) {
            return (
                  <div className="w-full h-screen flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary animate-pulse">Loading Your Restaurant...</span>
                  </div>
            );
      }

      if(!restaurant) {
            return <AddRestaurant fetchMyRestaurant={fetchMyRestaurant} />
      }
      return (
            <div>
                  <RestaurantProfile restaurant={restaurant} />
            </div>
      );
}

export default Restaurant;
