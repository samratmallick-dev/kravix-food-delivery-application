import { useState, useEffect } from "react";
import type { IMenuItem } from "../../types/types";
import { Eye, Loader, Minus, Pencil, Plus, Trash2, X } from "lucide-react";
import { BsCartPlus, BsEyeSlash } from "react-icons/bs";
import axios from "axios";
import { cartBaseUrl, menuBaseUrl } from "../common/constant";
import toast from "react-hot-toast";
import { useAppData } from "../../context/AppContext";
import { useSocket } from "../../context/SocketContext";

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
      const { socket } = useSocket();
      const [editItem, setEditItem] = useState<IMenuItem | null>(null);
      const [editForm, setEditForm] = useState({ name: "", description: "", price: "" });
      const [saving, setSaving] = useState(false);

      useEffect(() => {
            setLocalItems(items);
      }, [items]);

      useEffect(() => {
            if (!socket) return;

            const onAvailability = ({ itemId, isAvailable }: { itemId: string; isAvailable: boolean }) => {
                  setLocalItems((prev) =>
                        prev.map((i) => i._id === itemId ? { ...i, isAvailable } : i)
                  );
            };
            const onDeleted = ({ itemId }: { itemId: string }) => {
                  setLocalItems((prev) => prev.filter((i) => i._id !== itemId));
            };
            const onUpdated = ({ itemId, name, description, price }: { itemId: string; name: string; description: string; price: number }) => {
                  setLocalItems((prev) => prev.map((i) => i._id === itemId ? { ...i, name, description, price } : i));
            };

            socket.on("menuitem:availability", onAvailability);
            socket.on("menuitem:deleted", onDeleted);
            socket.on("menuitem:updated", onUpdated);

            return () => {
                  socket.off("menuitem:availability", onAvailability);
                  socket.off("menuitem:deleted", onDeleted);
                  socket.off("menuitem:updated", onUpdated);
            };
      }, [socket]);

      const openEdit = (item: IMenuItem) => {
            setEditItem(item);
            setEditForm({ name: item.name, description: item.description ?? "", price: String(item.price) });
      };

      const handleEditSave = async () => {
            if (!editItem) return;
            if (!editForm.name.trim()) return toast.error("Name is required");
            if (isNaN(Number(editForm.price)) || Number(editForm.price) < 0) return toast.error("Enter a valid price");
            setSaving(true);
            try {
                  const { data } = await axios.patch(`${menuBaseUrl}/${editItem._id}`,
                        { name: editForm.name.trim(), description: editForm.description.trim(), price: Number(editForm.price) },
                        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, withCredentials: true }
                  );
                  setLocalItems((prev) => prev.map((i) => i._id === editItem._id ? { ...i, ...data.data } : i));
                  toast.success("Menu item updated");
                  setEditItem(null);
            } catch (err: any) {
                  toast.error(err.response?.data?.message || "Failed to update item");
            } finally {
                  setSaving(false);
            }
      };

      const handleDeleteItem = async (itemId: string) => {
            const conform = window.confirm("Are you sure you want to delete this item?");
            if (!conform) return;

            try {
                  const response = await axios.delete(`${menuBaseUrl}/${itemId}`, {
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
                  const response = await axios.patch(`${menuBaseUrl}/${itemId}/availability`, {}, {
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
                  const { data } = await axios.post(`${cartBaseUrl}`, {
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
                  toast.error(error.response?.data?.message || "Failed to add item to cart");
            } finally {
                  setLoadingItemId(null);
                  setLoadingAction(null);
            }
      };

      const increaseItem = async (itemId: string) => {
            try {
                  setLoadingItemId(itemId);
                  setLoadingAction("inc");
                  await axios.patch(`${cartBaseUrl}/increment`, { itemId }, {
                        headers: {
                              Authorization: `Bearer ${localStorage.getItem("token")}`
                        }, withCredentials: true
                  });
                  await fetchCart();
            } catch (error: any) {
                  console.log(error);
                  toast.error(error.response?.data?.message || "Failed to update cart");
            } finally {
                  setLoadingItemId(null);
                  setLoadingAction(null);
            }
      };

      const decreaseItem = async (itemId: string) => {
            try {
                  setLoadingItemId(itemId);
                  setLoadingAction("dec");
                  await axios.patch(`${cartBaseUrl}/decrement`, { itemId }, {
                        headers: {
                              Authorization: `Bearer ${localStorage.getItem("token")}`
                        }, withCredentials: true
                  });
                  await fetchCart();
            } catch (error: any) {
                  console.log(error);
                  toast.error(error.response?.data?.message || "Failed to update cart");
            } finally {
                  setLoadingItemId(null);
                  setLoadingAction(null);
            }
      };


      return (
            <>
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
                                                                        onClick={() => openEdit(item)}
                                                                        className="p-1 rounded text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition"
                                                                  >
                                                                        <Pencil size={15} />
                                                                  </button>
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

            {editItem && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditItem(null)}>
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                                    <h2 className="text-sm font-bold text-gray-800">Edit Menu Item</h2>
                                    <button onClick={() => setEditItem(null)} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"><X size={15} /></button>
                              </div>
                              <div className="p-5 space-y-3">
                                    <div>
                                          <label className="block text-xs font-semibold text-gray-500 mb-1">Name</label>
                                          <input
                                                value={editForm.name}
                                                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                                          />
                                    </div>
                                    <div>
                                          <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                                          <textarea
                                                value={editForm.description}
                                                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                                                rows={2}
                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                          />
                                    </div>
                                    <div>
                                          <label className="block text-xs font-semibold text-gray-500 mb-1">Price (₹)</label>
                                          <input
                                                type="number"
                                                min={0}
                                                value={editForm.price}
                                                onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                                          />
                                    </div>
                                    <div className="flex gap-3 pt-1">
                                          <button onClick={() => setEditItem(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer">Cancel</button>
                                          <button onClick={handleEditSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold transition disabled:opacity-60 cursor-pointer hover:opacity-90 flex items-center justify-center gap-2">
                                                {saving && <Loader size={13} className="animate-spin" />}
                                                {saving ? "Saving..." : "Save"}
                                          </button>
                                    </div>
                              </div>
                        </div>
                  </div>
            )}
      </>
      );
};

export default Menuitems;
