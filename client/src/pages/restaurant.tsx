import React, { useEffect, useState } from "react";
import type { IMenuItem, IRestaurant } from "../types/types";
import axios from "axios";
import { menuBaseUrl, restaurantBaseUrl } from "../components/common/constant";
import AddRestaurant from "../components/restaurant/addRestaurant";
import RestaurantProfile from "../components/restaurant/restaurantProfile";
import Menuitems from "../components/restaurant/menuitems";
import AddMenuItems from "../components/restaurant/addMenuItems";

type SellerTab = "menu" | "add-item" | "sales";

const Restaurant = () => {

      const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
      const [loading, setLoading] = useState(true);

      const [tab, setTab] = useState<SellerTab>(
            () => (localStorage.getItem("restaurantTab") as SellerTab) || "menu"
      );

      const handleTabChange = (value: SellerTab) => {
            setTab(value);
            localStorage.setItem("restaurantTab", value);
      };

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

      useEffect(() => {
            fetchMyRestaurant();
      }, []);

      const [menuItem, setMenuItem] = useState<IMenuItem[]>([]);

      const fetchMenuItem = async (restaurantId: string) => {
            try {
                  const { data } = await axios.get(`${menuBaseUrl}/all/${restaurantId}`, {
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
            if (restaurant?._id) {
                  fetchMenuItem(restaurant._id);
            }
      }, [restaurant]);

      if (loading) {
            return (
                  <div className="w-full h-screen flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary animate-pulse">Loading Your Restaurant...</span>
                  </div>
            );
      }

      if (!restaurant) {
            return <AddRestaurant fetchMyRestaurant={fetchMyRestaurant} />
      }
      return (
            <div className="min-h-screen bg-gray-50">
                  <div className=" px-4 py-6 space-y-10">
                        <RestaurantProfile restaurant={restaurant} onUpdate={setRestaurant} isSeller={true} />
                        <div className="rounded-xl bg-white shadow-sm">
                              <div className="flex items-center  border-gray-600">
                                    {[
                                          { label: "Menu", value: "menu" },
                                          { label: "Add Menu Item", value: "add-item" },
                                          { label: "Sales", value: "sales" },
                                    ].map((item, index, arr) => (
                                          <React.Fragment key={item.value}>
                                                <button
                                                      onClick={() => handleTabChange(item.value as SellerTab)}
                                                      className={` flex-1 px-4 py-3 text-sm font-medium transition cursor-pointer border-gray-600 ${tab === item.value ? "border-b-2 border-primary text-primary" : "text-gray-600 hover:text-gray-800"
                                                            }`}
                                                >{item.label}</button>
                                                {index < arr.length - 1 && <div className="w-px h-8 bg-gray-600 self-center" />}
                                          </React.Fragment>
                                    ))}
                              </div>
                              <div className="rounded-lg p-6">
                                    {tab === "menu" && <Menuitems
                                          items={menuItem}
                                          onItemDelete={() => {
                                                fetchMenuItem(restaurant._id)
                                          }}
                                          isSeller={true}
                                    />}
                                    {tab === "add-item" && <AddMenuItems onItemAdded={() => {
                                          fetchMenuItem(restaurant._id)
                                    }} />}
                                    {tab === "sales" && <div>Sales Analytics Coming Soon...</div>}
                              </div>
                        </div>
                  </div>
            </div>
      );
}

export default Restaurant;
