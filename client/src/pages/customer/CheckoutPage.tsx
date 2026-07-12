import { useEffect, useMemo, useState } from "react";
import { useAppData } from "@/context/AppContext";
import { stripePublishableKey } from "@/constants";
import { useLocation, useNavigate } from "react-router-dom";
import type { ICart, IMenuItem, IRestaurant, ICoupon } from "@/types";
import toast from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";
import { storage } from "@/utils";
import AddressModal from "@/features/customer/components/AddressModal";
import { Trash2 } from "lucide-react";
import { getCoupons, applyCoupon } from "@/services/api/coupon.services";
import { createOrder as apiCreateOrder } from "@/services/api/order.services";
import { createRazorpayOrder, verifyRazorpayPayment, payWithStripe as apiPayWithStripe } from "@/services/api/payment.services";
import { getMyAddresses, deleteAddress } from "@/services/api/address.services";

interface Address {
      _id: string;
      formatedAddress: string;
      mobile: number;
      latitude: number;
      longitude: number;
};



const Checkout = () => {
      const { cart, subTotal, quantity, location: userLocation, user, fetchCart } = useAppData();
      const isBlocked = !!(user?.isBlocked && user.blockedUntil && new Date(user.blockedUntil) > new Date());
      const [addresses, setAddresses] = useState<Address[]>([]);
      const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
      const [loadingAddress, setLoadingAddress] = useState(true);
      const [loadingRazorpay, setLoadingRazorpay] = useState(false);
      const [loadingStripe, setLoadingStripe] = useState(false);
      const [creatingOrders, setCreatingOrder] = useState(false);
      const [selectedPayment, setSelectedPayment] = useState<"razorpay" | "stripe" | "cod" | null>(null);
      const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
      const [deletingId, setDeletingId] = useState<string | null>(null);

      const [couponInput, setCouponInput] = useState("");
      const [appliedCoupon, setAppliedCoupon] = useState<{
            code: string;
            discountType: string;
            discountValue: number;
            discountAmount: number;
      } | null>(null);
      const [applyingCoupon, setApplyingCoupon] = useState(false);
      const [availableCoupons, setAvailableCoupons] = useState<ICoupon[]>([]);
      const [loadingCoupons, setLoadingCoupons] = useState(false);
      const [showAllCoupons, setShowAllCoupons] = useState(false);

      const location = useLocation();
      const navigate = useNavigate();
      const token = storage.getToken();

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

      const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
      const discountedSubtotal = Math.max(0, subTotal - discountAmount);
      const foodGST = +(discountedSubtotal * 0.05).toFixed(2);
      const deliveryGST = +(deliveryFee * 0.18).toFixed(2);
      const totalGST = +(foodGST + deliveryGST).toFixed(2);
      const total = (discountedSubtotal + deliveryFee + platformFee + totalGST).toFixed(2);

      useEffect(() => {
            if (!restaurant?._id) {
                  setLoadingCoupons(false);
                  setLoadingAddress(false);
                  return;
            }
            const loadCheckoutData = async () => {
                  setLoadingCoupons(true);
                  setLoadingAddress(true);
                  try {
                        const [couponsRes, addressesRes] = await Promise.all([
                              getCoupons(restaurant._id),
                              getMyAddresses()
                        ]);
                        if (couponsRes.success) {
                              setAvailableCoupons(couponsRes.data || []);
                        }
                        setAddresses(addressesRes.data as any || []);
                  } catch (error) {
                        console.error("Failed to fetch checkout data:", error);
                  } finally {
                        setLoadingCoupons(false);
                        setLoadingAddress(false);
                  }
            };
            loadCheckoutData();
      }, [restaurant?._id]);

      const handleApplyCoupon = async (e?: React.FormEvent) => {
            if (e) e.preventDefault();
            if (!couponInput.trim()) {
                  toast.error("Please enter a coupon code");
                  return;
            }
            if (!restaurant) return;
            setApplyingCoupon(true);
            try {
                  const res = await applyCoupon({
                        code: couponInput.trim(),
                        restaurantId: restaurant._id,
                        orderAmount: subTotal,
                        deliveryFee: deliveryFee
                  });
                  if (res && res.success) {
                        setAppliedCoupon(res.data);
                        storage.setAppliedCoupon(res.data.code);
                        toast.success(`Coupon Applied! Saved ₹${res.data.discountAmount}`);
                  }
            } catch (err: any) {
                  console.error(err);
                  toast.error(err.message || "Invalid coupon code");
            } finally {
                  setApplyingCoupon(false);
            }
      };

      const handleRemoveCoupon = () => {
            setAppliedCoupon(null);
            setCouponInput("");
            storage.removeAppliedCoupon();
            toast.success("Coupon removed");
      };

      const handleQuickApplyCoupon = async (code: string) => {
            setCouponInput(code);
            if (!restaurant) return;
            setApplyingCoupon(true);
            try {
                  const res = await applyCoupon({
                        code: code.trim(),
                        restaurantId: restaurant._id,
                        orderAmount: subTotal,
                        deliveryFee: deliveryFee
                  });
                  if (res && res.success) {
                        setAppliedCoupon(res.data);
                        storage.setAppliedCoupon(res.data.code);
                        toast.success(`🎉 Coupon Applied! Saved ₹${res.data.discountAmount}`);
                  }
            } catch (err: any) {
                  console.error(err);
                  toast.error(err.message || "Coupon not applicable");
            } finally {
                  setApplyingCoupon(false);
            }
      };

      const getCouponLabel = (coupon: ICoupon): string => {
            if (coupon.discountType === "percentage") {
                  const cap = coupon.maxDiscountAmount > 0 ? ` (up to ₹${coupon.maxDiscountAmount})` : "";
                  return `${coupon.discountValue}% off${cap}`;
            } else if (coupon.discountType === "flat") {
                  return `₹${coupon.discountValue} flat off`;
            } else if (coupon.discountType === "free_delivery") {
                  return "Free Delivery";
            }
            return "";
      };

      const createOrder = async (paymentMethod: "razorpay" | "stripe") => {
            if (!selectedAddressId) return null;
            setCreatingOrder(true);
            try {
                  const data = await apiCreateOrder({ paymentMethod, addressId: selectedAddressId, couponCode: appliedCoupon?.code || undefined });
                  await fetchCart();
                  return data.data;
            } catch (err: any) {
                  toast.error(err.message || "Something went wrong while creating order!");
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
                  const data = await createRazorpayOrder(orderId);
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
                        name: "Kravix - Be Smart, Eat Better",
                        description: "Food Order Payment",
                        order_id: razorpayOrderId,
                        handler: async (response: any) => {
                              try {
                                    await verifyRazorpayPayment({
                                          razorpay_order_id: response.razorpay_order_id,
                                          razorpay_payment_id: response.razorpay_payment_id,
                                          razorpay_signature: response.razorpay_signature,
                                          orderId
                                    });
                                    toast.success("🎉 Payment Successful!");
                                    storage.removeAppliedCoupon();
                                    navigate("/payment-success/" + response.razorpay_payment_id);
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                              } catch (err: any) {
                                    toast.error(err.message || "Payment verification failed!");
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

      const stripePromise = useMemo(() => loadStripe(stripePublishableKey), []);

      const payWithStripe = async () => {
            try {
                  setLoadingStripe(true);
                  const order = await createOrder("stripe");
                  if (!order) return;
                  const { orderId } = order;
                  try {
                        const stripe = await stripePromise;
                        if (!stripe) throw new Error("Stripe failed to load");

                        const data = await apiPayWithStripe(orderId);

                        if (data.data.url) {
                              storage.removeAppliedCoupon();
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

      const payWithCOD = async () => {
            if (!selectedAddressId) return;
            setCreatingOrder(true);
            try {
                  const data = await apiCreateOrder({
                        paymentMethod: "cod",
                        addressId: selectedAddressId,
                        couponCode: appliedCoupon?.code || undefined,
                  });
                  storage.removeAppliedCoupon();
                  await fetchCart();
                  navigate("/order-success/" + data.data.orderId);
                  window.scrollTo({ top: 0, behavior: "smooth" });
            } catch (err: any) {
                  toast.error(err.message || "Failed to place COD order");
            } finally {
                  setCreatingOrder(false);
            }
      };



      const handleAddressAdded = async (newAddress: Address) => {
            if (!cart || cart.length === 0) return;
            try {
                  const data = await getMyAddresses();
                  const list = data.data as any || [];
                  setAddresses(list);
                  if (newAddress && newAddress._id) {
                        setSelectedAddressId(newAddress._id);
                  }
            } catch (error) {
                  console.log(error);
            } finally {
                  setIsAddressModalOpen(false);
            }
      };

      const handleDeleteAddress = async (id: string, e: React.MouseEvent) => {
            e.stopPropagation();
            if (!window.confirm("Delete this address?")) return;
            if (deletingId) return;
            setDeletingId(id);
            try {
                  const data = await deleteAddress(id);
                  toast.success(data.message || "Address deleted successfully");
                  setAddresses(prev => prev.filter(a => a._id !== id));
                  if (selectedAddressId === id) {
                        setSelectedAddressId(null);
                  }
            } catch (err: any) {
                  console.error(err);
                  toast.error(err.message || "Failed to delete address");
            } finally {
                  setDeletingId(null);
            }
      };



      useEffect(() => {
            const savedCouponCode = storage.getAppliedCoupon();
            if (!savedCouponCode || !restaurant?._id || !token) {
                  return;
            }
            let active = true;
            const revalidateCoupon = async () => {
                  try {
                        const res = await applyCoupon({
                              code: savedCouponCode,
                              restaurantId: restaurant._id,
                              orderAmount: subTotal,
                              deliveryFee: deliveryFee
                        });
                        if (active && res && res.success) {
                              setAppliedCoupon(res.data);
                              setCouponInput(savedCouponCode);
                        }
                  } catch (err: any) {
                        if (active) {
                              console.error(err);
                              storage.removeAppliedCoupon();
                              setAppliedCoupon(null);
                              setCouponInput("");
                              toast.error(err.message || "Applied coupon is no longer valid");
                        }
                  }
            };
            revalidateCoupon();
            return () => {
                  active = false;
            };
      }, [restaurant?._id, subTotal, deliveryFee, token]);

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
                                                      onClick={() => setIsAddressModalOpen(true)}
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
                                                            <div className="flex items-start justify-between gap-3">
                                                                  <div className="flex items-start gap-3 flex-1 min-w-0">
                                                                        <div className="mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0">
                                                                              {selectedAddressId === address._id && (
                                                                                    <span className="w-2 h-2 rounded-full bg-primary" />
                                                                              )}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                              <p className="text-sm text-gray-600 leading-relaxed">{address.formatedAddress}</p>
                                                                              <p className="text-xs text-gray-500 mt-1">📞 {address.mobile}</p>
                                                                        </div>
                                                                  </div>
                                                                  <button
                                                                        type="button"
                                                                        onClick={(e) => handleDeleteAddress(address._id, e)}
                                                                        disabled={deletingId === address._id}
                                                                        className="ml-2 rounded-lg p-2 text-gray-400 hover:bg-red-55/10 hover:text-red-600 transition shrink-0"
                                                                  >
                                                                        {deletingId === address._id ? (
                                                                              <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin block" />
                                                                        ) : (
                                                                              <Trash2 size={16} className="text-red-500 hover:text-red-750" />
                                                                        )}
                                                                  </button>
                                                            </div>
                                                      </div>
                                                ))}
                                          </div>
                                    ) : (
                                          <div className="text-center py-8">
                                                <span className="text-4xl block mb-3">🏠</span>
                                                <p className="text-gray-500">No address found</p>
                                                <button
                                                      onClick={() => setIsAddressModalOpen(true)}
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
                                          {appliedCoupon && (
                                                <div className="flex justify-between text-green-650 font-medium">
                                                      <span>Discount ({appliedCoupon.code})</span>
                                                      <span>-₹{appliedCoupon.discountAmount}</span>
                                                </div>
                                          )}
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
                                    <div className="flex items-center justify-between mb-3">
                                          <h2 className="font-semibold text-gray-800">Coupons & Offers</h2>
                                          {availableCoupons.length > 0 && !appliedCoupon && (
                                                <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                                                      {availableCoupons.length} offer{availableCoupons.length > 1 ? "s" : ""} available
                                                </span>
                                          )}
                                    </div>

                                    {appliedCoupon ? (
                                          <div className="flex items-center justify-between border-2 border-dashed border-green-500 bg-green-50/50 rounded-xl p-3.5 transition">
                                                <div className="flex items-center gap-2">
                                                      <span className="text-lg">🎟️</span>
                                                      <div>
                                                            <p className="text-sm font-bold text-green-700 uppercase tracking-wide">{appliedCoupon.code}</p>
                                                            <p className="text-xs text-green-600">Saved ₹{appliedCoupon.discountAmount} on this order</p>
                                                      </div>
                                                </div>
                                                <button
                                                      onClick={handleRemoveCoupon}
                                                      className="text-xs font-semibold text-red-500 hover:text-red-750 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition cursor-pointer"
                                                >
                                                      Remove
                                                </button>
                                          </div>
                                    ) : (
                                          <>
                                                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                                                      <input
                                                            type="text"
                                                            placeholder="Enter Promo Code"
                                                            value={couponInput}
                                                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                                            className="flex-1 px-3 py-2 border border-border bg-gray-50 focus:bg-white rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
                                                      />
                                                      <button
                                                            type="submit"
                                                            disabled={applyingCoupon || !couponInput.trim()}
                                                            className="px-4 py-2 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary/95 transition cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed"
                                                      >
                                                            {applyingCoupon ? "Applying..." : "Apply"}
                                                      </button>
                                                </form>

                                                {loadingCoupons ? (
                                                      <div className="mt-3 space-y-2">
                                                            {[1, 2].map((i) => (
                                                                  <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
                                                            ))}
                                                      </div>
                                                ) : availableCoupons.length > 0 ? (
                                                      <div className="mt-3">
                                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Available Coupons</p>
                                                            <div className="space-y-2">
                                                                  {(showAllCoupons ? availableCoupons : availableCoupons.slice(0, 3)).map((coupon) => {
                                                                        const isExpiringSoon = new Date(coupon.expiryDate).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;
                                                                        const isLimitedLeft = coupon.usageLimit > 0 && (coupon.usageLimit - coupon.usedCount) <= 5;
                                                                        const meetsMin = subTotal >= coupon.minOrderAmount;
                                                                        return (
                                                                              <div
                                                                                    key={coupon._id}
                                                                                    className={`relative flex items-center justify-between gap-3 border-2 border-dashed rounded-xl px-3.5 py-3 transition ${
                                                                                          meetsMin
                                                                                                ? "border-primary/30 bg-primary/3 hover:border-primary/60"
                                                                                                : "border-gray-200 bg-gray-50 opacity-60"
                                                                                    }`}
                                                                              >
                                                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white border border-gray-200" />
                                                                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 rounded-full bg-white border border-gray-200" />

                                                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                                                          <span className="text-xl shrink-0">{coupon.discountType === "free_delivery" ? "🚚" : "🏷️"}</span>
                                                                                          <div className="min-w-0">
                                                                                                <p className="text-sm font-bold text-gray-800 uppercase tracking-wide">{coupon.code}</p>
                                                                                                <p className="text-xs font-medium text-primary">{getCouponLabel(coupon)}</p>
                                                                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                                                                                                      {coupon.minOrderAmount > 0 && (
                                                                                                            <span className={`text-[10px] ${meetsMin ? "text-gray-400" : "text-red-400 font-medium"}`}>
                                                                                                                  Min ₹{coupon.minOrderAmount}
                                                                                                                  {!meetsMin && ` (need ₹${coupon.minOrderAmount - subTotal} more)`}
                                                                                                            </span>
                                                                                                      )}
                                                                                                      <span className={`text-[10px] ${isExpiringSoon ? "text-orange-500 font-semibold" : "text-gray-400"}`}>
                                                                                                            Expires {new Date(coupon.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                                                                                      </span>
                                                                                                      {coupon.couponType === "global" && (
                                                                                                            <span className="text-[10px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-full font-medium">Global</span>
                                                                                                      )}
                                                                                                      {isLimitedLeft && (
                                                                                                            <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full font-medium">Limited!</span>
                                                                                                      )}
                                                                                                </div>
                                                                                          </div>
                                                                                    </div>

                                                                                    <button
                                                                                          onClick={() => meetsMin && handleQuickApplyCoupon(coupon.code)}
                                                                                          disabled={!meetsMin || applyingCoupon}
                                                                                          className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border transition cursor-pointer disabled:cursor-not-allowed
                                                                                                border-primary text-primary hover:bg-primary hover:text-white
                                                                                                disabled:border-gray-200 disabled:text-gray-300 disabled:hover:bg-transparent"
                                                                                    >
                                                                                          Apply
                                                                                    </button>
                                                                              </div>
                                                                        );
                                                                  })}
                                                            </div>
                                                            {availableCoupons.length > 3 && (
                                                                  <button
                                                                        onClick={() => setShowAllCoupons((p) => !p)}
                                                                        className="mt-2 w-full text-xs text-center text-primary font-medium hover:underline cursor-pointer"
                                                                  >
                                                                        {showAllCoupons ? "Show less ↑" : `View all ${availableCoupons.length} coupons ↓`}
                                                                  </button>
                                                            )}
                                                      </div>
                                                ) : (
                                                      <p className="mt-3 text-xs text-gray-400 text-center py-2">No coupons available for this restaurant right now.</p>
                                                )}
                                          </>
                                    )}
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

                                          <div
                                                onClick={() => setSelectedPayment("cod")}
                                                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${selectedPayment === "cod" ? "border-primary bg-primary/5" : "border-border hover:border-gray-300"}`}
                                          >
                                                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0">
                                                      {selectedPayment === "cod" && <span className="w-2 h-2 rounded-full bg-primary" />}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                      <span className="text-lg">💵</span>
                                                      <div>
                                                            <p className="text-sm font-medium text-gray-800">Cash on Delivery</p>
                                                            <p className="text-xs text-gray-400">Pay cash upon arrival</p>
                                                      </div>
                                                </div>
                                          </div>
                                    </div>

                                    <button
                                          onClick={() => {
                                                if (selectedPayment === "razorpay") payWithRazorpay();
                                                else if (selectedPayment === "stripe") payWithStripe();
                                                else if (selectedPayment === "cod") payWithCOD();
                                          }}
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
                                                            : selectedPayment === "cod"
                                                                  ? `Place Order ₹${total} (Pay on Delivery)`
                                                                  : `Pay ₹${total} via ${selectedPayment === "razorpay" ? "Razorpay" : "Stripe"}`}
                                    </button>
                              </div>
                        </div>
                  </div>
                  <AddressModal
                        isOpen={isAddressModalOpen}
                        onClose={() => setIsAddressModalOpen(false)}
                        onAddressAdded={handleAddressAdded}
                  />
            </div>
      );
};

export default Checkout;
