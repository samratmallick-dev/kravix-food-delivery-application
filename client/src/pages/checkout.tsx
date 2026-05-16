import { useEffect, useMemo, useState } from "react";
import { useAppData } from "../context/AppContext";
import axios from "axios";
import { addressBaseUrl, orderBaseUrl, paymentBaseUrl, stripPublishableKey } from "../components/common/constant";
import { useLocation, useNavigate } from "react-router-dom";
import type { ICart, IMenuItem, IRestaurant } from "../types/types";
import toast from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";

interface Address {
      _id: string;
      formatedAddress: string;
      mobile: number;
      latitude: number;
      longitude: number;
};

const Checkout = () => {
      const { cart, subTotal, quantity, location: userLocation, user } = useAppData();
      const isBlocked = !!(user?.isBlocked && user.blockedUntil && new Date(user.blockedUntil) > new Date());
      const [addresses, setAddresses] = useState<Address[]>([]);
      const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
      const [loadingAddress, setLoadingAddress] = useState(true);
      const [loadingRazorpay, setLoadingRazorpay] = useState(false);
      const [loadingStripe, setLoadingStripe] = useState(false);
      const [creatingOrders, setCreatingOrder] = useState(false);
      const [selectedPayment, setSelectedPayment] = useState<"razorpay" | "stripe" | null>(null);

      const location = useLocation();
      const navigate = useNavigate();
      const token = localStorage.getItem("token");

      const restaurant = (cart?.[0]?.restaurantId as IRestaurant) ?? null;
      const platformFee = 7;
      const selectedAddress = addresses.find(a => a._id === selectedAddressId) ?? null;

      const deliveryFee = useMemo(() => {
            if (subTotal >= 250) return 0;
            if (!restaurant?.autoLocation?.coordinates) return 49;
            const [restLng, restLat] = restaurant.autoLocation.coordinates;
            const toRad = (deg: number) => (deg * Math.PI) / 180;
            const coords = selectedAddress
                  ? { latitude: selectedAddress.latitude, longitude: selectedAddress.longitude }
                  : userLocation && isFinite(userLocation.latitude) && isFinite(userLocation.longitude)
                        ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
                        : null;
            if (!coords) return 49;
            const dLat = toRad(coords.latitude - restLat);
            const dLng = toRad(coords.longitude - restLng);
            const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(restLat)) * Math.cos(toRad(coords.latitude)) * Math.sin(dLng / 2) ** 2;
            const distance = +(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);
            return Math.ceil(distance <= 3 ? 35 : 35 + (distance - 3) * 9);
      }, [subTotal, selectedAddress, userLocation, restaurant?.autoLocation?.coordinates]);

      const foodGST = +(subTotal * 0.05).toFixed(2);
      const deliveryGST = +(deliveryFee * 0.18).toFixed(2);
      const totalGST = +(foodGST + deliveryGST).toFixed(2);
      const total = (subTotal + deliveryFee + platformFee + totalGST).toFixed(2);

      const createOrder = async (paymentMethod: "razorpay" | "stripe") => {
            if (!selectedAddressId) return null;
            setCreatingOrder(true);
            try {
                  const { data } = await axios.post(
                        `${orderBaseUrl}`,
                        { paymentMethod, addressId: selectedAddressId },
                        { headers: { Authorization: `Bearer ${token}` } }
                  );
                  return data.data;
            } catch (error: any) {
                  toast.error(error.response?.data?.message || "Something went wrong while creating order!");
                  return null;
            } finally {
                  setCreatingOrder(false);
            }
      };

      const payWithRazorpay = async () => {
            try {
                  setLoadingRazorpay(true);
                  const order = await createOrder("razorpay");
                  if (!order) return;

                  const { orderId, totalAmount } = order;
                  const { data } = await axios.post(`${paymentBaseUrl}/razorpay`, { orderId });
                  const { razorpayOrderId, key_id } = data.data;

                  await new Promise<void>((resolve, reject) => {
                        if ((window as any).Razorpay) return resolve();
                        const script = document.createElement("script");
                        script.src = "https://checkout.razorpay.com/v1/checkout.js";
                        script.onload = () => resolve();
                        script.onerror = () => reject(new Error("Razorpay SDK failed to load"));
                        document.head.appendChild(script);
                  });

                  const options = {
                        key: key_id,
                        amount: Math.round(totalAmount * 100),
                        currency: "INR",
                        name: "Kravix - Online Food Delivery Platform",
                        description: "Food Order Payment",
                        order_id: razorpayOrderId,
                        handler: async (response: any) => {
                              try {
                                    await axios.post(`${paymentBaseUrl}/razorpay/verify`, {
                                          razorpay_order_id: response.razorpay_order_id,
                                          razorpay_payment_id: response.razorpay_payment_id,
                                          razorpay_signature: response.razorpay_signature,
                                          orderId
                                    });
                                    toast.success("🎉 Payment Successful!");
                                    navigate("/payment-success/" + response.razorpay_payment_id);
                                     window.scrollTo({ top: 0, behavior: "smooth" });
                              } catch (error: any) {
                                    toast.error(error.response?.data?.message || "Payment verification failed!");
                              }
                        },
                        theme: { color: "#fff4f1" }
                  };

                  const razorpay = new (window as any).Razorpay(options);
                  razorpay.open();
            } catch (error) {
                  toast.error("Something went wrong! Please refresh the page.");
            } finally {
                  setLoadingRazorpay(false);
            }
      };

      const stripePromise = useMemo(() => loadStripe(stripPublishableKey), []);

      const payWithStripe = async () => {
            try {
                  setLoadingStripe(true);
                  const order = await createOrder("stripe");
                  if (!order) return;
                  const { orderId } = order;
                  try {
                        const stripe = await stripePromise;
                        if (!stripe) throw new Error("Stripe failed to load");

                        const { data } = await axios.post(`${paymentBaseUrl}/stripe`, {
                              orderId
                        });

                        if(data.data.url) {
                              window.location.href = data.data.url;
                        } else {
                              toast.error("Failed to create stripe payment session.");
                        }
                  } catch (error) {
                        console.log(error);
                        toast.error("Payment failed");
                  }
            } catch (error) {
                  toast.error("Something went wrong! Please refresh the page.");
            } finally {
                  setLoadingStripe(false);
            }
      };

      useEffect(() => {
            const fetchAddress = async () => {
                  if (!cart || cart.length === 0) {
                        setLoadingAddress(false);
                        return;
                  }
                  try {
                        const { data } = await axios.get(`${addressBaseUrl}`, {
                              headers: { Authorization: `Bearer ${token}` },
                        });
                        setAddresses(data.data || []);
                  } catch (error) {
                        console.log(error);
                  } finally {
                        setLoadingAddress(false);
                  }
            };
            fetchAddress();
      }, [cart]);

      useEffect(() => {
            if ((!cart || cart.length === 0) && location.pathname === "/checkout") {
                  const timer = setTimeout(() => navigate("/"), 3000);
                  return () => clearTimeout(timer);
            }
      }, [cart, location.pathname]);

      if ((!cart || cart.length === 0) && location.pathname === "/checkout") {
            return (
                  <div className="container-app min-h-[calc(100vh-80px)] mx-auto px-4 py-8 flex flex-col items-center justify-center gap-3">
                        <p className="text-lg font-semibold text-gray-600">Your cart is empty!</p>
                        <p className="text-sm text-gray-400">Redirecting to home in 3 seconds...</p>
                  </div>
            );
      }

      return (
            <div className="container-app space-y-6 py-6">
                  <h1 className="text-2xl font-bold text-gray-700 text-center md:text-start">Checkout Your Order</h1>
                  {isBlocked && (
                        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                              <span className="text-red-500 text-xl">🚫</span>
                              <div>
                                    <p className="text-sm font-semibold text-red-700">Your account is temporarily blocked</p>
                                    <p className="text-xs text-red-500">You cannot place orders until {new Date(user!.blockedUntil!).toLocaleDateString("en-IN")}.</p>
                              </div>
                        </div>
                  )}
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
                                                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${restaurant.isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
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

                              <div className="bg-white rounded-2xl shadow-sm border border-border p-4">
                                    <div className="flex items-center justify-between mb-4">
                                          <h2 className="font-semibold text-gray-800">Delivery Address</h2>
                                          {addresses.length > 0 && (
                                                <button
                                                      onClick={() => navigate("/address")}
                                                      className="text-xs font-medium text-primary border border-primary px-3 py-1.5 rounded-lg hover:bg-primary/10 transition"
                                                >
                                                      + Add Address
                                                </button>
                                          )}
                                    </div>
                                    {loadingAddress ? (
                                          <div className="space-y-3">
                                                {[1, 2, 3].map((i) => (
                                                      <div key={i} className="w-full h-16 rounded-lg bg-gray-100 animate-pulse" />
                                                ))}
                                          </div>
                                    ) : addresses.length > 0 ? (
                                          <div className="space-y-3">
                                                {addresses.map((address) => (
                                                      <div
                                                            key={address._id}
                                                            onClick={() => setSelectedAddressId(address._id)}
                                                            className={`p-4 rounded-xl border-2 cursor-pointer transition ${selectedAddressId === address._id
                                                                  ? "border-primary bg-primary/5"
                                                                  : "border-border hover:border-gray-300"
                                                                  }`}
                                                      >
                                                            <div className="flex items-start gap-3">
                                                                  <div className="mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0">
                                                                        {selectedAddressId === address._id && (
                                                                              <span className="w-2 h-2 rounded-full bg-primary" />
                                                                        )}
                                                                  </div>
                                                                  <div className="min-w-0">
                                                                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{address.formatedAddress}</p>
                                                                        <p className="text-xs text-gray-500 mt-1">📞 {address.mobile}</p>
                                                                  </div>
                                                            </div>
                                                      </div>
                                                ))}
                                          </div>
                                    ) : (
                                          <div className="text-center py-8">
                                                <span className="text-4xl block mb-3">🏠</span>
                                                <p className="text-gray-500">No address found</p>
                                                <button
                                                      onClick={() => navigate("/address")}
                                                      className="mt-3 text-sm text-primary font-medium hover:underline"
                                                >
                                                      Add Address →
                                                </button>
                                          </div>
                                    )}
                              </div>
                        </div>

                        <div className="lg:w-125 space-y-4">
                              <div className="bg-white rounded-2xl shadow-sm border border-border p-4">
                                    <h2 className="font-semibold text-gray-800 mb-4">Order Summary</h2>
                                    <div className="space-y-3 mb-4">
                                          {cart.map((item: ICart) => {
                                                const menuItem = item.itemId as IMenuItem;
                                                return (
                                                      <div key={item._id} className="flex items-center gap-3">
                                                            {menuItem.imageUrl ? (
                                                                  <img src={menuItem.imageUrl} alt={menuItem.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                                                            ) : (
                                                                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-xl">🍽️</div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                  <p className="text-sm font-medium text-gray-800 truncate">{menuItem.name}</p>
                                                                  <p className="text-xs text-gray-500">x{item.quantity} · ₹{menuItem.price}</p>
                                                            </div>
                                                            <p className="text-sm font-semibold text-gray-700 shrink-0">₹{menuItem.price * item.quantity}</p>
                                                      </div>
                                                );
                                          })}
                                    </div>
                                    <div className="border-t border-border pt-3 space-y-2 text-sm text-gray-600">
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
                                          {deliveryFee > 0 && subTotal < 250 && (
                                                <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                                                      🎉 Add ₹{250 - subTotal} more for free delivery!
                                                </p>
                                          )}
                                          <div className="border-t border-border pt-3 flex justify-between font-bold text-gray-800">
                                                <span>Total</span>
                                                <span>₹{total}</span>
                                          </div>
                                    </div>
                              </div>

                              <div className="bg-white rounded-2xl shadow-sm border border-border p-4">
                                    <h2 className="font-semibold text-gray-800 mb-3">Payment Method</h2>
                                    <div className="flex flex-col gap-3">
                                          <div
                                                onClick={() => setSelectedPayment("razorpay")}
                                                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${selectedPayment === "razorpay" ? "border-primary bg-primary/5" : "border-border hover:border-gray-300"}`}
                                          >
                                                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0">
                                                      {selectedPayment === "razorpay" && <span className="w-2 h-2 rounded-full bg-primary" />}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                      <span className="text-lg">💳</span>
                                                      <div>
                                                            <p className="text-sm font-medium text-gray-800">Razorpay</p>
                                                            <p className="text-xs text-gray-400">UPI, Cards, Net Banking & more</p>
                                                      </div>
                                                </div>
                                          </div>

                                          <div
                                                onClick={() => setSelectedPayment("stripe")}
                                                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${selectedPayment === "stripe" ? "border-primary bg-primary/5" : "border-border hover:border-gray-300"}`}
                                          >
                                                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0">
                                                      {selectedPayment === "stripe" && <span className="w-2 h-2 rounded-full bg-primary" />}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                      <span className="text-lg">🌐</span>
                                                      <div>
                                                            <p className="text-sm font-medium text-gray-800">Stripe</p>
                                                            <p className="text-xs text-gray-400">International Cards & Wallets</p>
                                                      </div>
                                                </div>
                                          </div>
                                    </div>

                                    <button
                                          onClick={() => {selectedPayment === "razorpay" ? payWithRazorpay() : payWithStripe()}}
                                          disabled={isBlocked || !selectedAddressId || !selectedPayment || loadingRazorpay || loadingStripe || creatingOrders}
                                          className="mt-4 w-full py-3 rounded-xl font-semibold text-white transition bg-primary hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-95"
                                    >
                                          {(loadingRazorpay || loadingStripe || creatingOrders) ? (
                                                <span className="flex items-center justify-center gap-2">
                                                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                      Processing...
                                                </span>
                                          ) : isBlocked ? "Account blocked — cannot place orders"
                                                : !selectedAddressId ? "Select a delivery address"
                                                      : !selectedPayment ? "Select a payment method"
                                                            : `Pay ₹${total} via ${selectedPayment === "razorpay" ? "Razorpay" : "Stripe"}`}
                                    </button>
                              </div>
                        </div>
                  </div>
            </div>
      );
};

export default Checkout;
