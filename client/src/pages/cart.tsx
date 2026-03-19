import { useNavigate, Link } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import { useMemo, useState } from "react";
import type { IMenuItem, IRestaurant } from "../types/types";
import axios from "axios";
import { cartBaseUrl } from "../components/common/constant";
import toast from "react-hot-toast";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";

const Cart = () => {

      const { cart, subTotal, quantity, fetchCart, location } = useAppData();

      const navigate = useNavigate();

      const [loadingItemInc, setLoadingItemInc] = useState<string | null>(null);
      const [loadingItemDec, setLoadingItemDec] = useState<string | null>(null);
      const [clearingCart, setClearingCart] = useState(false);
      const [confirmClear, setConfirmClear] = useState(false);

      const restaurant = (cart?.[0]?.restaurantId as IRestaurant) ?? null;
      const platformFee = 7;

      const deliveryFee = useMemo(() => {
            if (subTotal >= 250) return 0;
            if (!location || !isFinite(location.latitude) || !isFinite(location.longitude)) return 49;
            if (!restaurant?.autoLocation?.coordinates) return 49;
            const [restLng, restLat] = restaurant.autoLocation.coordinates;
            const toRad = (deg: number) => (deg * Math.PI) / 180;
            const dLat = toRad(location.latitude - restLat);
            const dLng = toRad(location.longitude - restLng);
            const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(restLat)) * Math.cos(toRad(location.latitude)) * Math.sin(dLng / 2) ** 2;
            const distance = +(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);
            return Math.ceil(distance <= 3 ? 35 : 35 + (distance - 3) * 9);
      }, [subTotal, location, restaurant?.autoLocation?.coordinates]);

      const foodGST = +(subTotal * 0.05).toFixed(2);
      const deliveryGST = +(deliveryFee * 0.18).toFixed(2);
      const totalGST = +(foodGST + deliveryGST).toFixed(2);
      const totalAmount = subTotal + deliveryFee + platformFee + totalGST;

      if (!cart || cart.length === 0 || quantity === 0) {
            return (
                  <div className="container-app min-h-[60vh] flex items-center justify-center">
                        <div className="flex flex-col items-center justify-center text-center space-y-3">
                              <ShoppingBag className="w-16 h-16 text-gray-300 mb-2" />
                              <h3 className="text-lg font-semibold text-gray-700">Your cart is empty</h3>
                              <p className="text-sm text-gray-400">Add items to get started</p>
                              <Link
                                    to="/"
                                    className="flex items-center gap-2 mt-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition active:scale-95"
                              >
                                    Browse Restaurants <ArrowRight className="w-4 h-4" />
                              </Link>
                        </div>
                  </div>
            );
      }

      const increaseItem = async (itemId: string) => {
            try {
                  setLoadingItemInc(itemId);
                  await axios.patch(`${cartBaseUrl}/inc`, { itemId }, {
                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                        withCredentials: true
                  });
                  await fetchCart();
            } catch (error: any) {
                  console.log(error);
                  toast(error.response.data.message);
            } finally {
                  setLoadingItemInc(null);
            }
      };

      const decreaseItem = async (itemId: string) => {
            try {
                  setLoadingItemDec(itemId);
                  await axios.patch(`${cartBaseUrl}/dec`, { itemId }, {
                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                        withCredentials: true
                  });
                  await fetchCart();
            } catch (error: any) {
                  console.log(error);
                  toast(error.response.data.message);
            } finally {
                  setLoadingItemDec(null);
            }
      };

      const clearCart = async () => {

            try {
                  setClearingCart(true)
                  await axios.delete(`${cartBaseUrl}/clear`, {
                        headers: {
                              Authorization: `Bearer ${localStorage.getItem("token")}`
                        }, withCredentials: true
                  });
                  await fetchCart();
            } catch (error: any) {
                  console.log(error);
                  toast(error.response.data.message);
            } finally {
                  setClearingCart(false);
            }
      };

      const checkout = () => {
            navigate("/checkout");
            window.scrollTo({ top: 0, behavior: "smooth" });
      };

      return (
            <div className="container-app py-8 min-h-screen">
                  <h1 className="text-2xl font-bold text-gray-800 mb-6">Your Cart</h1>
                  <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                              <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                                    <div className="flex items-center gap-4 p-4">
                                          {restaurant.image && (
                                                <img
                                                      src={restaurant.image}
                                                      alt={restaurant.name}
                                                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                                                />
                                          )}
                                          <div className="flex-1 min-w-0">
                                                <h2 className="font-semibold text-gray-800 text-lg truncate">{restaurant.name}</h2>
                                                <p className="text-sm text-gray-500 line-clamp-1">{restaurant.description}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${restaurant.isOpen
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-600"
                                                            }`}>
                                                            {restaurant.isOpen ? "Open" : "Closed"}
                                                      </span>
                                                      {restaurant.phone && (
                                                            <span className="text-xs text-gray-400">📞 {restaurant.phone}</span>
                                                      )}
                                                </div>
                                          </div>
                                    </div>
                                    {restaurant.autoLocation && (
                                          <div className="border-t border-border">
                                                <div className="flex items-start gap-2 px-4 py-3">
                                                      <span className="text-base mt-0.5">📍</span>
                                                      <div className="min-w-0">
                                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Restaurant Location</p>
                                                            <p className="text-sm text-gray-700 leading-snug">{restaurant.autoLocation.formattedAddress}</p>
                                                            <a
                                                                  href={`https://www.google.com/maps?q=${restaurant.autoLocation.coordinates[1]},${restaurant.autoLocation.coordinates[0]}`}
                                                                  target="_blank"
                                                                  rel="noopener noreferrer"
                                                                  className="text-xs text-primary hover:underline mt-1 inline-block"
                                                            >
                                                                  Open in Google Maps →
                                                            </a>
                                                      </div>
                                                </div>
                                          </div>
                                    )}
                              </div>
                              <div className="bg-white rounded-2xl shadow-sm border border-border divide-y divide-border">
                                    {cart.map((cartItem) => {
                                          const item = cartItem.itemId as IMenuItem;
                                          const incLoading = loadingItemInc === item._id;
                                          const decLoading = loadingItemDec === item._id;
                                          return (
                                                <div key={cartItem._id} className="flex gap-3 p-4">
                                                      {item.imageUrl ? (
                                                            <img
                                                                  src={item.imageUrl}
                                                                  alt={item.name}
                                                                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                                                            />
                                                      ) : (
                                                            <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                                                                  <span className="text-2xl">🍽️</span>
                                                            </div>
                                                      )}
                                                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                            <div>
                                                                  <p className="font-semibold text-gray-800 text-sm leading-snug">{item.name}</p>
                                                                  {item.description && (
                                                                        <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{item.description}</p>
                                                                  )}
                                                            </div>
                                                            <div className="flex items-center justify-between mt-2">
                                                                  <p className="text-primary font-bold text-sm">₹{item.price}</p>
                                                                  <div className="flex items-center gap-2">
                                                                        <button
                                                                              onClick={() => decreaseItem(item._id)}
                                                                              disabled={decLoading || incLoading}
                                                                              className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition"
                                                                        >
                                                                              {decLoading ? (
                                                                                    <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin inline-block" />
                                                                              ) : (
                                                                                    <span className="text-base leading-none select-none">−</span>
                                                                              )}
                                                                        </button>
                                                                        <span className="w-5 text-center font-semibold text-gray-800 text-sm">{cartItem.quantity}</span>
                                                                        <button
                                                                              onClick={() => increaseItem(item._id)}
                                                                              disabled={incLoading || decLoading}
                                                                              className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition"
                                                                        >
                                                                              {incLoading ? (
                                                                                    <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin inline-block" />
                                                                              ) : (
                                                                                    <span className="text-base leading-none select-none">+</span>
                                                                              )}
                                                                        </button>
                                                                  </div>
                                                                  <p className="font-bold text-gray-800 text-sm">₹{item.price * cartItem.quantity}</p>
                                                            </div>
                                                      </div>
                                                </div>
                                          );
                                    })}
                              </div>
                              {confirmClear ? (
                                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                                          <span className="text-sm text-red-600 font-medium mr-1">Clear entire cart?</span>
                                          <button
                                                onClick={async () => { setConfirmClear(false); await clearCart(); }}
                                                disabled={clearingCart}
                                                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition active:scale-95"
                                          >
                                                {clearingCart ? (
                                                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                                                ) : null}
                                                {clearingCart ? "Clearing..." : "Yes, clear"}
                                          </button>
                                          <button
                                                onClick={() => setConfirmClear(false)}
                                                disabled={clearingCart}
                                                className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition active:scale-95"
                                          >
                                                Cancel
                                          </button>
                                    </div>
                              ) : (
                                    <button
                                          onClick={() => setConfirmClear(true)}
                                          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-500 text-sm font-medium hover:bg-red-100 hover:border-red-300 transition active:scale-95"
                                    >
                                          <Trash2 size={18} />
                                          Clear Cart
                                    </button>
                              )}
                        </div>
                        <div className="lg:w-80 xl:w-96">
                              <div className="bg-white rounded-2xl shadow-sm border border-border p-5 space-y-4">
                                    <h2 className="font-bold text-gray-800 text-lg">Order Summary</h2>

                                    <div className="space-y-2 text-sm">
                                          <div className="flex justify-between text-gray-600">
                                                <span>Subtotal ({quantity} {quantity === 1 ? "item" : "items"})</span>
                                                <span>₹{subTotal}</span>
                                          </div>
                                          <div className="flex justify-between text-gray-600">
                                                <span>Delivery Fee</span>
                                                {deliveryFee === 0 ? (
                                                      <span className="text-green-600 font-medium">FREE</span>
                                                ) : (
                                                      <span>₹{deliveryFee}</span>
                                                )}
                                          </div>
                                          <div className="flex justify-between text-gray-600">
                                                <span>Platform Fee</span>
                                                <span>₹{platformFee}</span>
                                          </div>
                                          <div className="flex justify-between text-gray-600">
                                                <span>GST</span>
                                                <span>₹{totalGST}</span>
                                          </div>
                                    </div>

                                    {deliveryFee > 0 && subTotal < 250 && (
                                          <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                                                🎉 Add ₹{250 - subTotal} more for free delivery!
                                          </p>
                                    )}

                                    <div className="border-t border-border pt-3 flex justify-between font-bold text-gray-800">
                                          <span>Total</span>
                                          <span>₹{totalAmount}</span>
                                    </div>

                                    <button
                                          onClick={checkout}
                                          disabled={!restaurant.isOpen}
                                          className={`w-full py-3 rounded-xl font-semibold transition text-white ${restaurant.isOpen
                                                ? "bg-primary hover:bg-primary/90 cursor-pointer"
                                                : "bg-gray-400 cursor-not-allowed"
                                                }`}
                                    >
                                          {restaurant.isOpen ? "Proceed to Checkout" : "Restaurant is not open"}
                                    </button>

                                    <button
                                          onClick={() => navigate(-1)}
                                          className="w-full text-sm text-gray-500 hover:text-gray-700 transition text-center"
                                    >
                                          ← Continue Shopping
                                    </button>
                              </div>
                        </div>

                  </div>
            </div>
      );
}

export default Cart;
