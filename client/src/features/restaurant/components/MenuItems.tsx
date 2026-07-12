import { useState, useEffect } from "react";
import type { IMenuItem } from "@/types";
import { Eye, Loader, Minus, Plus, Trash2, Pencil } from "lucide-react";
import { BsCartPlus, BsEyeSlash } from "react-icons/bs";
import { addToCart as apiAddToCart, incrementCartQuantity, decrementCartQuantity } from "@/services/api/cart.services";
import { deleteMenuItem, toggleMenuItemAvailability as apiToggleMenuItemAvailability } from "@/services/api/menu.services";
import toast from "react-hot-toast";
import { useAppData } from "@/context/AppContext";
import { useSocket } from "@/context/SocketContext";
import EditMenuItems from "./EditMenuItems";

interface MenuItemProps {
      items: IMenuItem[];
      onItemDelete: () => void;
      isSeller: boolean;
}

type PriceFilter = "all" | "under100" | "100to300" | "above300";
type DietFilter = "all" | "veg" | "nonveg";
type SortOption = "default" | "price_asc" | "price_desc" | "name_asc";

const PRICE_FILTERS: { label: string; value: PriceFilter }[] = [
      { label: "All Prices", value: "all" },
      { label: "Under ₹100", value: "under100" },
      { label: "₹100 – ₹300", value: "100to300" },
      { label: "Above ₹300", value: "above300" },
];

const FoodTypeBadge = ({ isVeg }: { isVeg: boolean }) => (
      <div className={`inline-flex items-center justify-center border-2 w-4 h-4 p-0.5 rounded-sm shrink-0 ${isVeg ? "border-green-600" : "border-red-600"}`}>
            <span className={`w-2 h-2 rounded-full ${isVeg ? "bg-green-600" : "bg-red-700"}`} />
      </div>
);

const Menuitems = ({ items, onItemDelete, isSeller }: MenuItemProps) => {
      const [localItems, setLocalItems] = useState<IMenuItem[]>(items);
      const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
      const [loadingAction, setLoadingAction] = useState<"inc" | "dec" | "add" | null>(null);
      const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
      const [dietFilter, setDietFilter] = useState<DietFilter>("all");
      const [onlyAvailable, setOnlyAvailable] = useState(false);
      const [sortOption, setSortOption] = useState<SortOption>("default");
      const { fetchCart, cart } = useAppData();
      const { socket } = useSocket();

      const [isEditOpen, setIsEditOpen] = useState(false);
      const [selectedItem, setSelectedItem] = useState<IMenuItem | null>(null);

      const handleEditItem = (item: IMenuItem) => {
            setSelectedItem(item);
            setIsEditOpen(true);
      };

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

            socket.on("menuitem:availability", onAvailability);
            socket.on("menuitem:deleted", onDeleted);

            return () => {
                  socket.off("menuitem:availability", onAvailability);
                  socket.off("menuitem:deleted", onDeleted);
            };
      }, [socket]);

      const handleDeleteItem = async (itemId: string) => {
            const conform = window.confirm("Are you sure you want to delete this item?");
            if (!conform) return;

            try {
                  const response = await deleteMenuItem(itemId);
                  toast.success(response.message || "Item deleted");
                  onItemDelete();
            } catch (error: any) {
                  console.log(error);
                  toast.error(error.message || "Failed to delete menu item");
            }
      };

      const toggleMenuItemAvailability = async (itemId: string) => {
            setLocalItems(prev =>
                  prev.map(i => i._id === itemId ? { ...i, isAvailable: !i.isAvailable } : i)
            );
            try {
                  const response = await apiToggleMenuItemAvailability(itemId);
                  toast.success(response.message || "Availability toggled");
            } catch (error: any) {
                  setLocalItems(prev =>
                        prev.map(i => i._id === itemId ? { ...i, isAvailable: !i.isAvailable } : i)
                  );
                  toast.error(error.message || "Failed to toggle availability");
            }
      };

      const addToCart = async (restaurantId: string, itemId: string) => {
            try {
                  setLoadingItemId(itemId);
                  setLoadingAction("add");
                  const res = await apiAddToCart({ restaurantId, itemId });
                  toast.success(res.message || "Item added to cart");
                  await fetchCart();
            } catch (error: any) {
                  console.log(error);
                  toast.error(error.message || "Failed to add item to cart");
            } finally {
                  setLoadingItemId(null);
                  setLoadingAction(null);
            }
      };

      const increaseItem = async (itemId: string) => {
            try {
                  setLoadingItemId(itemId);
                  setLoadingAction("inc");
                  await incrementCartQuantity({ itemId });
                  await fetchCart();
            } catch (error: any) {
                  console.log(error);
                  toast.error(error.message || "Failed to update cart");
            } finally {
                  setLoadingItemId(null);
                  setLoadingAction(null);
            }
      };

      const decreaseItem = async (itemId: string) => {
            try {
                  setLoadingItemId(itemId);
                  setLoadingAction("dec");
                  await decrementCartQuantity({ itemId });
                  await fetchCart();
            } catch (error: any) {
                  console.log(error);
                  toast.error(error.message || "Failed to update cart");
            } finally {
                  setLoadingItemId(null);
                  setLoadingAction(null);
            }
      };

      const filteredItems = localItems
            .filter((item) => {
                  if (onlyAvailable && !item.isAvailable) return false;
                  if (dietFilter === "veg" && !item.isVeg) return false;
                  if (dietFilter === "nonveg" && item.isVeg) return false;
                  if (priceFilter === "under100" && item.price >= 100) return false;
                  if (priceFilter === "100to300" && (item.price < 100 || item.price > 300)) return false;
                  if (priceFilter === "above300" && item.price <= 300) return false;
                  return true;
            })
            .sort((a, b) => {
                  if (sortOption === "price_asc") return a.price - b.price;
                  if (sortOption === "price_desc") return b.price - a.price;
                  if (sortOption === "name_asc") return a.name.localeCompare(b.name);
                  return 0;
            });

      const activeFilterCount = [
            dietFilter !== "all",
            priceFilter !== "all",
            onlyAvailable,
            sortOption !== "default",
      ].filter(Boolean).length;

      return (
            <div>
                  <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-3 mb-5 shadow-sm space-y-3">
                        <div className="flex flex-wrap items-center gap-2 justify-between">
                              <div className="flex items-center gap-2">
                                    {(["all", "veg", "nonveg"] as DietFilter[]).map((d) => (
                                          <button
                                                key={d}
                                                onClick={() => setDietFilter(d)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                                                      dietFilter === d
                                                            ? d === "veg"
                                                                  ? "bg-green-500 text-white border-green-500"
                                                                  : d === "nonveg"
                                                                        ? "bg-red-500 text-white border-red-500"
                                                                        : "bg-primary text-white border-primary"
                                                            : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"
                                                }`}
                                          >
                                                {d === "veg" && <span className="w-2 h-2 rounded-full bg-current" />}
                                                {d === "nonveg" && <span className="w-2 h-2 rounded-full bg-current" />}
                                                {d === "all" ? "All" : d === "veg" ? "Veg" : "Non-Veg"}
                                          </button>
                                    ))}
                                    <button
                                          onClick={() => setOnlyAvailable((p) => !p)}
                                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                                                onlyAvailable
                                                      ? "bg-emerald-500 text-white border-emerald-500"
                                                      : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"
                                          }`}
                                    >
                                          Available Only
                                    </button>
                              </div>
                              <select
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                                    className="text-xs bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-1.5 text-gray-600 font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                              >
                                    <option value="default">Sort: Default</option>
                                    <option value="price_asc">Price: Low to High</option>
                                    <option value="price_desc">Price: High to Low</option>
                                    <option value="name_asc">Name: A – Z</option>
                              </select>
                        </div>
                        <div className="flex flex-wrap gap-2">
                              {PRICE_FILTERS.map((f) => (
                                    <button
                                          key={f.value}
                                          onClick={() => setPriceFilter(f.value)}
                                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                                                priceFilter === f.value
                                                      ? "bg-primary text-white border-primary"
                                                      : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"
                                          }`}
                                    >
                                          {f.label}
                                    </button>
                              ))}
                        </div>

                        {activeFilterCount > 0 && (
                              <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                                    <span className="text-[11px] text-gray-400">{activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active · {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""} shown</span>
                                    <button
                                          onClick={() => { setDietFilter("all"); setPriceFilter("all"); setOnlyAvailable(false); setSortOption("default"); }}
                                          className="text-[11px] text-primary font-semibold hover:underline"
                                    >
                                          Reset all
                                    </button>
                              </div>
                        )}
                  </div>
            <div className="container-app py-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {
                        filteredItems.map((item) => {
                              const isLoading = loadingItemId === item._id;
                              const isIncLoading = isLoading && loadingAction === "inc";
                              const isDecLoading = isLoading && loadingAction === "dec";
                              const isAddLoading = isLoading && loadingAction === "add";
                              const cartItem = cart.find((c: any) => (typeof c.itemId === "object" ? c.itemId._id : c.itemId) === item._id);
                              return (
                                    <div
                                          key={item._id}
                                          className={`relative flex flex-col rounded-xl overflow-hidden border bg-white border-border transition ${!item.isAvailable ? "opacity-70" : ""}`}
                                    >
                                          <div className="relative h-36 w-full rounded-none">
                                                <img
                                                      src={item.imageUrl || `https://placehold.co/400x160?text=${encodeURIComponent(item.name)}`}
                                                      alt={item.name}
                                                      className={`w-full h-full object-cover ${!item.isAvailable ? "grayscale brightness-75" : ""}`}
                                                />
                                                {!item.isAvailable && (
                                                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white bg-black/50">Unavailable</span>
                                                )}
                                          </div>
                                          <div className="flex flex-col flex-1 p-3 gap-1.5">
                                                <div className="flex items-center gap-2">
                                                      <FoodTypeBadge isVeg={!!item.isVeg} />
                                                      <h3 className="text-sm font-semibold leading-tight line-clamp-1 flex-1">{item.name}</h3>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                      <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                            {item.category || "Main Course"}
                                                      </span>
                                                </div>
                                                {item.description && (
                                                      <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
                                                )}
                                                <div className="flex items-center justify-between mt-auto pt-2">
                                                      <span className="text-sm font-bold text-primary">₹{item.price.toFixed(2)}</span>
                                                      {isSeller ? (
                                                            <div className="flex items-center gap-1">
                                                                  <button
                                                                        onClick={() => handleEditItem(item)}
                                                                        className="p-1 rounded text-blue-500 hover:bg-blue-50 transition"
                                                                        aria-label="Edit item"
                                                                  >
                                                                        <Pencil size={16} />
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
            {filteredItems.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-10">No items match the selected filters.</p>
            )}

            {isEditOpen && selectedItem && (
                  <EditMenuItems
                        item={selectedItem}
                        onItemUpdated={onItemDelete}
                        onClose={() => {
                              setIsEditOpen(false);
                              setSelectedItem(null);
                        }}
                  />
            )}
            </div>
      );
};

export default Menuitems;
