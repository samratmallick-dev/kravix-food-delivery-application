import { useState, useEffect } from "react";
import type { IMenuItem } from "../../types/types";
import { Eye, Loader, Minus, Plus, Trash2 } from "lucide-react";
import { BsCartPlus, BsEyeSlash } from "react-icons/bs";
import axios from "axios";
import { cartBaseUrl, menuBaseUrl } from "../common/constant";
import toast from "react-hot-toast";
import { useAppData } from "../../context/AppContext";

interface MenuItemProps {
      items: IMenuItem[];
      onItemDelete: () => void;
      isSeller: boolean;
}

const Menuitems = ({ items, onItemDelete, isSeller }: MenuItemProps) => {
      const [localItems, setLocalItems] = useState<IMenuItem[]>(items);
      const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
      const [loadingAction, setLoadingAction] = useState<"inc" | "dec" | "add" | null>(null);
      const { fetchCart, cart } = useAppData();

      useEffect(() => {
            setLocalItems(items);
      }, [items]);

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
            setLocalItems(prev =>
                  prev.map(i => i._id === itemId ? { ...i, isAvailable: !i.isAvailable } : i)
            );
            try {
                  const response = await axios.patch(`${menuBaseUrl}/availability/${itemId}`, {}, {
                        headers: {
                              Authorization: `Bearer ${localStorage.getItem("token")}`
                        }, withCredentials: true
                  });
                  toast.success(response.data.message);
            } catch (error: any) {
                  setLocalItems(prev =>
                        prev.map(i => i._id === itemId ? { ...i, isAvailable: !i.isAvailable } : i)
                  );
                  toast.error(error.response?.data?.message || "Failed to toggle availability");
            }
      };

      const addToCart = async (restaurantId: string, itemId: string) => {
            try {
                  setLoadingItemId(itemId);
                  setLoadingAction("add");
                  const { data } = await axios.post(`${cartBaseUrl}/add`, {
                        restaurantId, itemId
                  }, {
                        headers: {
                              Authorization: `Bearer ${localStorage.getItem("token")}`
                        }, withCredentials: true
                  });

                  toast.success(data.message);
                  await fetchCart();
            } catch (error: any) {
                  console.log(error);
                  toast.error(error.response.data.message);
            } finally {
                  setLoadingItemId(null);
                  setLoadingAction(null);
            }
      };

      const increaseItem = async (itemId: string) => {
            try {
                  setLoadingItemId(itemId);
                  setLoadingAction("inc");
                  await axios.patch(`${cartBaseUrl}/inc`, { itemId }, {
                        headers: {
                              Authorization: `Bearer ${localStorage.getItem("token")}`
                        }, withCredentials: true
                  });
                  await fetchCart();
            } catch (error: any) {
                  console.log(error);
                  toast(error.response.data.message);
            } finally {
                  setLoadingItemId(null);
                  setLoadingAction(null);
            }
      };

      const decreaseItem = async (itemId: string) => {
            try {
                  setLoadingItemId(itemId);
                  setLoadingAction("dec");
                  await axios.patch(`${cartBaseUrl}/dec`, { itemId }, {
                        headers: {
                              Authorization: `Bearer ${localStorage.getItem("token")}`
                        }, withCredentials: true
                  });
                  await fetchCart();
            } catch (error: any) {
                  console.log(error);
                  toast(error.response.data.message);
            } finally {
                  setLoadingItemId(null);
                  setLoadingAction(null);
            }
      };


      return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {
                        localItems && localItems.map((item) => {
                              const isLoading = loadingItemId === item._id;
                              const isIncLoading = isLoading && loadingAction === "inc";
                              const isDecLoading = isLoading && loadingAction === "dec";
                              const isAddLoading = isLoading && loadingAction === "add";
                              const cartItem = cart.find(c => (typeof c.itemId === "object" ? c.itemId._id : c.itemId) === item._id);
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
                                                      ) : cartItem ? (
                                                            <div className="flex items-center border border-green-500 rounded-full overflow-hidden">
                                                                  <button
                                                                        disabled={isLoading}
                                                                        onClick={() => decreaseItem(item._id)}
                                                                        className="px-2 py-1 text-green-600 hover:bg-green-50 disabled:text-gray-400 transition"
                                                                  >
                                                                        {isDecLoading ? <Loader size={12} className="animate-spin" /> : <Minus size={12} />}
                                                                  </button>
                                                                  <span className="text-sm font-semibold text-green-600 min-w-5 text-center">{cartItem.quantity}</span>
                                                                  <button
                                                                        disabled={isLoading}
                                                                        onClick={() => increaseItem(item._id)}
                                                                        className="px-2 py-1 text-green-600 hover:bg-green-50 disabled:text-gray-400 transition"
                                                                  >
                                                                        {isIncLoading ? <Loader size={12} className="animate-spin" /> : <Plus size={12} />}
                                                                  </button>
                                                            </div>
                                                      ) : (
                                                            <button
                                                                  disabled={!item.isAvailable || isLoading}
                                                                  onClick={() => addToCart(item.restaurantId, item._id)}
                                                                  className={`flex items-center justify-center rounded-lg p-2 ${!item.isAvailable || isLoading
                                                                        ? "cursor-not-allowed text-gray-400"
                                                                        : "text-red-500 hover:bg-red-50"
                                                                        }`}
                                                            >
                                                                  {isAddLoading ? <Loader size={18} className="animate-spin" /> : <BsCartPlus />}
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
