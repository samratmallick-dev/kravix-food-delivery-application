import React, { useEffect, useState } from "react";
import type { IRestaurant } from "../types/types";
import axios from "axios";
import { restaurantBaseUrl } from "../components/common/constant";
import AddRestaurant from "../components/restaurant/addRestaurant";
import RestaurantProfile from "../components/restaurant/restaurantProfile";

type SellerTab = "menu" | "add-item" | "sales";

const Restaurant = () => {

      const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
      const [loading, setLoading] = useState(true);

      const [tab, setTab] = useState<SellerTab>("menu");

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
      }, [])

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
                                          { label: "Add Item", value: "add-item" },
                                          { label: "Sales", value: "sales" },
                                    ].map((item, index, arr) => (
                                          <React.Fragment key={item.value}>
                                                <button
                                                      onClick={() => setTab(item.value as SellerTab)}
                                                      className={` flex-1 px-4 py-3 text-sm font-medium transition cursor-pointer border-gray-600 ${tab === item.value ? "border-b-2 border-primary text-primary" : "text-gray-600 hover:text-gray-800"
                                                            }`}
                                                >{item.label}</button>
                                                {index < arr.length - 1 && <div className="w-px h-8 bg-gray-600 self-center" />}
                                          </React.Fragment>
                                    ))}
                              </div>
                              <div className="rounded-lg p-6">
                                    {tab === "menu" && <div>Menu Management Coming Soon...</div>}
                                    {tab === "add-item" && <div>Add Item Coming Soon...</div>}
                                    {tab === "sales" && <div>Sales Analytics Coming Soon...</div>}
                              </div>
                        </div>
                  </div>
            </div>
      );
}

export default Restaurant;
