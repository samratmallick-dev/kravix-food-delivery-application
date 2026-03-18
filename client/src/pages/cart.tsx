import { useNavigate, Link } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import { useEffect, useState } from "react";
import type { IRestaurant } from "../types/types";
import axios from "axios";
import { cartBaseUrl, addressBaseUrl } from "../components/common/constant";
import toast from "react-hot-toast";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BiMapPin, BiPhone, BiChevronDown } from "react-icons/bi";

interface SavedAddress {
      _id: string;
      formatedAddress: string;
      mobile: number;
      location: {
            coordinates: [number, number]; // [lng, lat]
      };
}

const restaurantIcon = L.divIcon({
      className: "",
      html: `<div style="width:16px;height:16px;background:#C22630;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      popupAnchor: [0, -12],
});

const customerIcon = L.divIcon({
      className: "",
      html: `<div style="width:16px;height:16px;background:#2563eb;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      popupAnchor: [0, -12],
});

const FitBounds = ({ positions }: { positions: [number, number][] }) => {
      const map = useMap();
      const valid = positions.filter(([lat, lng]) => isFinite(lat) && isFinite(lng));
      if (valid.length > 1) {
            map.fitBounds(L.latLngBounds(valid), { padding: [40, 40] });
      }
      return null;
};

const Cart = () => {

      const { cart, subTotal, quantity, fetchCart, location } = useAppData();

      const navigate = useNavigate();

      const [loadingItemInc, setLoadingItemInc] = useState<string | null>(null);
      const [loadingItemDec, setLoadingItemDec] = useState<string | null>(null);
      const [clearingCart, setClearingCart] = useState(false);
      const [confirmClear, setConfirmClear] = useState(false);
      const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
      const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null);
      const [addressDropdownOpen, setAddressDropdownOpen] = useState(false);

      useEffect(() => {
            const token = localStorage.getItem("token");
            if (!token) return;
            axios.get(`${addressBaseUrl}/all`, { headers: { Authorization: `Bearer ${token}` } })
                  .then(({ data }) => {
                        const addrs: SavedAddress[] = data.data || [];
                        setSavedAddresses(addrs);
                        if (addrs.length > 0) setSelectedAddress(addrs[0]);
                  })
                  .catch(() => {});
      }, []);

      const deliveryLocation = selectedAddress
            ? {
                  latitude: selectedAddress.location.coordinates[1],
                  longitude: selectedAddress.location.coordinates[0],
                  formattedAddress: selectedAddress.formatedAddress
            }
            : location;

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

      const restaurant = cart[0].restaurantId as IRestaurant;

      const deliveryFee = subTotal < 250 ? 49 : 0;

      const platformFee = 7;

      const totalAmount = subTotal + deliveryFee + platformFee;

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

                                                {/* Delivery Address Selector */}
                                                <div className="px-4 pb-3">
                                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Deliver To</p>
                                                      {savedAddresses.length === 0 ? (
                                                            <Link
                                                                  to="/address"
                                                                  className="flex items-center gap-2 text-xs text-primary hover:underline"
                                                            >
                                                                  <BiMapPin size={13} /> Add a delivery address
                                                            </Link>
                                                      ) : (
                                                            <div className="relative">
                                                                  <button
                                                                        onClick={() => setAddressDropdownOpen((o) => !o)}
                                                                        className="w-full flex items-start justify-between gap-2 rounded-lg border bg-gray-50 px-3 py-2 text-sm text-left hover:bg-white transition"
                                                                  >
                                                                        <div className="flex items-start gap-2 min-w-0">
                                                                              <BiMapPin size={14} className="text-primary mt-0.5 shrink-0" />
                                                                              <div className="min-w-0">
                                                                                    <p className="text-gray-800 text-xs font-medium line-clamp-1">{selectedAddress?.formatedAddress}</p>
                                                                                    <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                                                                                          <BiPhone size={10} /> {selectedAddress?.mobile}
                                                                                    </p>
                                                                              </div>
                                                                        </div>
                                                                        <BiChevronDown size={16} className={`shrink-0 mt-0.5 text-gray-400 transition-transform ${addressDropdownOpen ? "rotate-180" : ""}`} />
                                                                  </button>
                                                                  {addressDropdownOpen && (
                                                                        <ul className="absolute z-[1000] mt-1 w-full rounded-lg border bg-white shadow-lg max-h-44 overflow-y-auto">
                                                                              {savedAddresses.map((addr) => (
                                                                                    <li
                                                                                          key={addr._id}
                                                                                          onClick={() => { setSelectedAddress(addr); setAddressDropdownOpen(false); }}
                                                                                          className={`flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 border-b last:border-0 ${selectedAddress?._id === addr._id ? "bg-red-50" : ""}`}
                                                                                    >
                                                                                          <BiMapPin size={13} className="text-primary mt-0.5 shrink-0" />
                                                                                          <div>
                                                                                                <p className="text-xs text-gray-800 line-clamp-2">{addr.formatedAddress}</p>
                                                                                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><BiPhone size={10} /> {addr.mobile}</p>
                                                                                          </div>
                                                                                    </li>
                                                                              ))}
                                                                              <li className="px-3 py-2 border-t">
                                                                                    <Link to="/address" className="text-xs text-primary hover:underline flex items-center gap-1">
                                                                                          <BiMapPin size={12} /> Add new address
                                                                                    </Link>
                                                                              </li>
                                                                        </ul>
                                                                  )}
                                                            </div>
                                                      )}
                                                </div>

                                                <div className="h-56 w-full">
                                                      {isFinite(restaurant.autoLocation.coordinates[1]) && isFinite(restaurant.autoLocation.coordinates[0]) && (
                                                      <MapContainer
                                                            center={[
                                                                  restaurant.autoLocation.coordinates[1],
                                                                  restaurant.autoLocation.coordinates[0],
                                                            ]}
                                                            zoom={15}
                                                            className="h-full w-full"
                                                            scrollWheelZoom={false}
                                                      >
                                                            <TileLayer
                                                                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                                            />
                                                            <FitBounds
                                                                  positions={[
                                                                        [restaurant.autoLocation.coordinates[1], restaurant.autoLocation.coordinates[0]],
                                                                        ...(deliveryLocation ? [[deliveryLocation.latitude, deliveryLocation.longitude] as [number, number]] : []),
                                                                  ]}
                                                            />
                                                            {isFinite(restaurant.autoLocation.coordinates[1]) && isFinite(restaurant.autoLocation.coordinates[0]) && (
                                                            <Marker
                                                                  position={[
                                                                        restaurant.autoLocation.coordinates[1],
                                                                        restaurant.autoLocation.coordinates[0],
                                                                  ]}
                                                                  icon={restaurantIcon}
                                                            >
                                                                  <Popup>
                                                                        <div className="text-sm">
                                                                              <p className="font-semibold text-primary">{restaurant.name}</p>
                                                                              <p className="text-gray-500 text-xs mt-0.5">{restaurant.autoLocation.formattedAddress}</p>
                                                                        </div>
                                                                  </Popup>
                                                            </Marker>
                                                            )}
                                                            {deliveryLocation && isFinite(deliveryLocation.latitude) && isFinite(deliveryLocation.longitude) && (
                                                                  <>
                                                                        <Marker
                                                                              position={[deliveryLocation.latitude, deliveryLocation.longitude]}
                                                                              icon={customerIcon}
                                                                        >
                                                                              <Popup>
                                                                                    <div className="text-sm">
                                                                                          <p className="font-semibold text-blue-600">Delivery Address</p>
                                                                                          <p className="text-gray-500 text-xs mt-0.5">{deliveryLocation.formattedAddress}</p>
                                                                                    </div>
                                                                              </Popup>
                                                                        </Marker>
                                                                        <Polyline
                                                                              positions={[
                                                                                    [deliveryLocation.latitude, deliveryLocation.longitude],
                                                                                    [restaurant.autoLocation.coordinates[1], restaurant.autoLocation.coordinates[0]],
                                                                              ]}
                                                                              pathOptions={{ color: "#C22630", weight: 2, dashArray: "6 6" }}
                                                                        />
                                                                  </>
                                                            )}
                                                      </MapContainer>
                                                      )}
                                                </div>
                                                <div className="flex items-center gap-4 px-4 py-2.5 bg-gray-50 text-xs text-gray-500">
                                                      <span className="flex items-center gap-1.5">
                                                            <span className="w-3 h-3 rounded-full bg-primary inline-block" />
                                                            Restaurant
                                                      </span>
                                                      {deliveryLocation && (
                                                            <span className="flex items-center gap-1.5">
                                                                  <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                                                                  Delivery Address
                                                            </span>
                                                      )}
                                                      {deliveryLocation && (
                                                            <span className="flex items-center gap-1.5">
                                                                  <span className="w-4 border-t-2 border-dashed border-primary inline-block" />
                                                                  Route
                                                            </span>
                                                      )}
                                                </div>
                                          </div>
                                    )}
                              </div>
                              <div className="bg-white rounded-2xl shadow-sm border border-border divide-y divide-border">
                                    {cart.map((cartItem) => {
                                          const item = cartItem.itemId as import("../types/types").IMenuItem;
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
                                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                <path d="M10 11v6" />
                                                <path d="M14 11v6" />
                                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                          </svg>
                                          Clear Cart
                                    </button>
                              )}
                        </div>
                        <div className="lg:w-80 xl:w-96">
                              <div className="bg-white rounded-2xl shadow-sm border border-border p-5 sticky top-24 space-y-4">
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
                                    </div>

                                    {deliveryFee > 0 && (
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
