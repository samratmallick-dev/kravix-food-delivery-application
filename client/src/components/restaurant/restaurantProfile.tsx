import { useState } from "react";
import type { IRestaurant } from "../../types/types";
import axios from "axios";
import { restaurantBaseUrl } from "../common/constant";
import toast from "react-hot-toast";
import { BiMapPin } from "react-icons/bi";
import { Edit, SaveAll } from "lucide-react";

interface props {
      restaurant: IRestaurant;
      isSeller: boolean;
      onUpdate: (restaurant: IRestaurant) => void
};

const RestaurantProfile = ({ restaurant, isSeller, onUpdate }: props) => {

      const [editMode, setEditMode] = useState(false);
      const [name, setName] = useState(restaurant.name);
      const [description, setDescription] = useState(restaurant.description);
      const [isOpen, setIsOpen] = useState(restaurant.isOpen);
      const [loading, setLoading] = useState(false);

      const toggleOpenStatus = async () => {
            try {
                  const { data } = await axios.put(`${restaurantBaseUrl}/status`, { status: !isOpen },
                        {
                              headers: {
                                    Authorization: `Bearer ${localStorage.getItem("token")}`
                              },
                              withCredentials: true
                        }
                  );
                  toast.success(data.message);
                  setIsOpen(data.data.isOpen);

            } catch (error: any) {
                  console.log(error);
                  toast.error(error instanceof Error ? error.message : error.response.data.message);
            }
      };

      const saveChanges = async () => {
            try {
                  setLoading(true);
                  const { data } = await axios.put(`${restaurantBaseUrl}/update`, { name, description }, {
                        headers: {
                              Authorization: `Bearer ${localStorage.getItem("token")}`
                        },
                        withCredentials: true
                  });
                  onUpdate(data.data);
                  toast.success(data.message);
            } catch (error: any) {
                  console.log(error);
                  toast.error(error instanceof Error ? error.message : (error.response.data.message || "Failed to update restaurant"));
            } finally {
                  setLoading(false);
                  setEditMode(false);
            }
      };

      return (
            <div className="w-full max-w-xl container mx-auto rounded-lg shadow-sm overflow-hidden">
                  {
                        restaurant && restaurant.image && (
                              <img src={restaurant.image} alt={restaurant.name} className="w-full h-64 object-cover" />
                        )
                  }

                  <div className="p-5 space-y-4">
                        {
                              isSeller && <div className="flex items-start justify-between gap-2">
                                    <div>
                                          {
                                                editMode ? (
                                                      <input
                                                            value={name}
                                                            onChange={(e) => setName(e.target.value)}
                                                            className="w-full text-lg font-semibold border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                                                      />
                                                ) : (
                                                      <h2 className="text-2xl font-semibold">{restaurant.name}</h2>
                                                )
                                          }
                                          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                                                <BiMapPin size={24} className="text-primary" />
                                                {
                                                      restaurant?.autoLocation.formattedAddress || "Location unavailable"
                                                }
                                          </div>
                                    </div>
                                    <button
                                          onClick={() => setEditMode(!editMode)}
                                          className="text-gray-500 hover:text-primary"
                                    >
                                          <Edit size={18} />
                                    </button>
                              </div>
                        }
                        {
                              editMode ? (
                                    <textarea
                                          value={description}
                                          onChange={(e) => setDescription(e.target.value)}
                                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                          placeholder="Add Your Restaurnat Description"
                                    />
                              ) : (
                                    <p className="text-gray-700 text-sm">{restaurant.description || "No description added"}</p>
                              )
                        }

                        <div className="flex items-center justify-between pt-3 border-t border-gray-600">
                              <span className={`text-sm font-medium ${isOpen ? "text-green-600" : "text-red-600"}`}>
                                    {isOpen ? "OPEN" : "CLOSED"}
                              </span>
                              <div className="flex items-center gap-3">
                                    {
                                          editMode && (
                                                <button
                                                      className="flex items-center gap-1 rounded-lg bg-blue-600 text-gray-200 px-3 py-1.5 text-sm hover:bg-blue-700 cursor-pointer"
                                                      onClick={saveChanges}
                                                      disabled={loading}
                                                >
                                                      <SaveAll size={16} /> Save Changes
                                                </button>
                                          )
                                    }
                                    {
                                          isSeller && (
                                                <button
                                                      onClick={toggleOpenStatus}
                                                      className={`px-3 py-1.5 text-sm rounded-lg ${isOpen ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"} text-gray-200`}
                                                >
                                                      {isOpen ? "Close Restaurant" : "Open Restaurant"}
                                                </button>
                                          )
                                    }
                              </div>
                        </div>
                        <p className="text-xs text-gray-400">
                              Created at : {new Date(restaurant.createdAt).toLocaleDateString(
                                    "en-US",
                                    {
                                          year: "numeric",
                                          month: "short",
                                          day: "numeric",
                                    },
                              )}
                        </p>
                  </div>
            </div>
      );
};

export default RestaurantProfile;
