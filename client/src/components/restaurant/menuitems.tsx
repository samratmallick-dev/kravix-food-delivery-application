import { useState } from "react";
import type { IMenuItem } from "../../types/types";
import { Eye, Loader, Trash2 } from "lucide-react";
import { BsCart, BsEyeSlash } from "react-icons/bs";
import axios from "axios";
import { menuBaseUrl } from "../common/constant";
import toast from "react-hot-toast";

interface MenuItemProps {
      items: IMenuItem[];
      onItemDelete: () => void;
      isSeller: boolean;
}

const Menuitems = ({ items, onItemDelete, isSeller }: MenuItemProps) => {
      const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

      const handleDeleteItem = async (itemId: string) => {
            const conform = window.confirm("Are you sure you want to delete this item?");
            if (!conform) return;

            try {
                  const response = await axios.delete(`${menuBaseUrl}/delete/${itemId}`, {
                        headers: {
                              Authorization: `Bearer ${localStorage.getItem("token")}`
                        }, withCredentials: true
                  });
                  toast.success(response.data.message);
                  onItemDelete();
            } catch (error: any) {
                  console.log(error);
                  toast.error(error.response?.data?.message || "Failed to delete menu item");
            }
      };

      const toggleMenuItemAvailability = async (itemId: string) => {
            try {
                  const response = await axios.patch(`${menuBaseUrl}/availability/${itemId}`, {}, {
                        headers: {
                              Authorization: `Bearer ${localStorage.getItem("token")}`
                        }, withCredentials: true
                  });
                  toast.success(response.data.message);
                  onItemDelete();
            } catch (error: any) {
                  console.log(error);
                  toast.error(error.response?.data?.message || "Failed to delete menu item");
            }
      };


      return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {
                        items && items.map((item) => {
                              const isLoading = loadingItemId === item._id;
                              return (
                                    <div
                                          key={item._id}
                                          className={`relative flex flex-col rounded-xl bg-white shadow-md overflow-hidden transition ${!item.isAvailable ? "opacity-70" : ""}`}
                                    >
                                          <div className="relative w-full h-36">
                                                <img
                                                      src={item.imageUrl}
                                                      alt={item.name}
                                                      className={`w-full h-full object-fill ${!item.isAvailable ? "grayscale brightness-75" : ""}`}
                                                />
                                                {!item.isAvailable && (
                                                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white bg-black/50">Unavailable</span>
                                                )}
                                          </div>
                                          <div className="flex flex-col flex-1 p-3 gap-1">
                                                <h3 className="text-sm font-semibold leading-tight line-clamp-1">{item.name}</h3>
                                                {item.description && (
                                                      <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
                                                )}
                                                <div className="flex items-center justify-between mt-auto pt-2">
                                                      <span className="text-sm font-bold text-primary">₹{item.price.toFixed(2)}</span>
                                                      {isSeller ? (
                                                            <div className="flex items-center gap-1">
                                                                  <button
                                                                        onClick={() => toggleMenuItemAvailability(item._id)}
                                                                        className="p-1 rounded text-gray-500 hover:bg-gray-100 hover:text-primary transition"
                                                                  >
                                                                        {item.isAvailable ? <Eye size={16} /> : <BsEyeSlash size={16} />}
                                                                  </button>
                                                                  <button
                                                                        onClick={() => handleDeleteItem(item._id)}
                                                                        className="p-1 rounded text-red-400 hover:bg-red-50 transition"
                                                                  >
                                                                        <Trash2 size={16} />
                                                                  </button>
                                                            </div>
                                                      ) : (
                                                            <button
                                                                  disabled={!item.isAvailable || isLoading}
                                                                  onClick={() => { }}
                                                                  className={`flex items-center justify-center rounded-lg p-2 ${!item.isAvailable || isLoading
                                                                              ? "cursor-not-allowed text-gray-400"
                                                                              : "text-red-500 hover:bg-red-50"
                                                                        }`}
                                                            >
                                                                  {isLoading ? <Loader size={18} className="animate-spin" /> : <BsCart />}
                                                            </button>
                                                      )}

                                                </div>
                                          </div>
                                    </div>
                              );
                        })
                  }
            </div>
      );
};

export default Menuitems;
