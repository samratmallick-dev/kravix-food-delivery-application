import { useEffect, useRef, useState } from "react";
import { useAppData } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import type { IOrder, IRider } from "../types/types";
import toast from "react-hot-toast";
import { fetchMyRiderProfile, fetchCurrentOrder as apiFetchCurrentOrder, fetchDeliveryHistory as apiFetchDeliveryHistory, updateRiderProfile, toggleRiderAvailability, updateOrderStatusByRider, generateDeliveryOtp, addRiderProfile, acceptOrder } from "../utils/rider.api";
import {
      ImagePlus, Loader2, Phone, MapPin, CreditCard, FileText,
      Bike, VolumeX, History, LogOut, TrendingUp, Pencil, X
} from "lucide-react";
import { RIDER_ORDER_TRANSITIONS } from "../utils/orderFlow";
import audio from "../assets/rider_order_alert.mp3";
import IncomingOrderCard from "../components/rider/IncomingOrderCard";
import CurrentOrderCard from "../components/rider/CurrentOrderCard";
import DeliveryHistoryCard from "../components/rider/DeliveryHistoryCard";
import RiderOrderMap from "../components/rider/riderOrderMap";
import EarningsDashboard from "../components/rider/EarningsDashboard";
import { storage } from "../utils/secureStorage";

type Tab = "orders" | "earnings";

const RiderDashboard = () => {
      const { user, location, locationLoading, setUser, setIsAuth } = useAppData();
      const { socket } = useSocket();
      const isBlocked = !!(user?.isBlocked && user.blockedUntil && new Date(user.blockedUntil) > new Date());

      const [profile, setProfile] = useState<IRider | null>(null);
      const [loading, setLoading] = useState(true);
      const [toggling, setToggling] = useState(false);
      const [phoneNumber, setPhoneNumber] = useState("");
      const [aadhaarNumber, setAadhaarNumber] = useState("");
      const [drivingLicesce, setDrivingLicesce] = useState("");
      const [image, setImage] = useState<File | null>(null);
      const [preview, setPreview] = useState<string | null>(null);
      const [submitting, setSubmitting] = useState(false);
      const [activeTab, setActiveTab] = useState<Tab>("orders");

      const [editingProfile, setEditingProfile] = useState(false);
      const [editPhone, setEditPhone] = useState("");
      const [editAadhaar, setEditAadhaar] = useState("");
      const [editLicense, setEditLicense] = useState("");
      const [editImageFile, setEditImageFile] = useState<File | null>(null);
      const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
      const [savingProfile, setSavingProfile] = useState(false);
      const editFileInputRef = useRef<HTMLInputElement>(null);

      const [inCommingOrders, setInCommingOrders] = useState<string[]>([]);
      const [currentOrder, setCurrentOrder] = useState<IOrder | null>(null);
      const [deliveryHistory, setDeliveryHistory] = useState<IOrder[]>([]);

      const [audioUnlocked, setAudioUnlocked] = useState(false);
      const audioRef = useRef<HTMLAudioElement | null>(null);
      const currentOrderRef = useRef<IOrder | null>(null);
      currentOrderRef.current = currentOrder;
      const audioUnlockedRef = useRef(false);

      const enableAudio = async () => {
            try {
                  const audioEl = new Audio(audio);
                  await audioEl.play();
                  audioEl.pause();
                  audioEl.currentTime = 0;
                  audioRef.current = audioEl;
                  audioUnlockedRef.current = true;
                  setAudioUnlocked(true);
                  toast.success("Sound notifications enabled.");
            } catch {
                  toast.error("Failed to enable sound notifications.");
            }
      };

      const fetchProfile = async () => {
            try {
                  const data = await fetchMyRiderProfile();
                  setProfile(data.data || null);
            } catch {
                  setProfile(null);
            } finally {
                  setLoading(false);
            }
      };

      useEffect(() => {
            if (!user?._id || user.role !== "rider") {
                  setLoading(false);
                  return;
            }
            fetchProfile();
      }, [user?._id, user?.role]);

      useEffect(() => {
            if (socket && user?._id) socket.emit("join:rider", user._id);
      }, [socket, user?._id]);

      const fetchCurrentOrder = async () => {
            try {
                  const data = await apiFetchCurrentOrder();
                  setCurrentOrder(data.data || null);
            } catch (error: any) {
                  setCurrentOrder(null);
            }
      };

      const fetchDeliveryHistory = async () => {
            try {
                  const data = await apiFetchDeliveryHistory();
                  setDeliveryHistory(data.data?.orders || []);
            } catch {
                  setDeliveryHistory([]);
            }
      };

      useEffect(() => {
            if (!socket) return;

            const onOrderAvailable = ({ orderId }: { orderId: string }) => {
                  setInCommingOrders((prev) => prev.includes(orderId) ? prev : [...prev, orderId]);
                  if (audioUnlockedRef.current && audioRef.current) {
                        audioRef.current.currentTime = 0;
                        audioRef.current.play().catch((err) => console.log("Audio play failed:", err));
                  }
                  setTimeout(() => setInCommingOrders((prev) => prev.filter((id) => id !== orderId)), 10_000);
            };

            const onRiderVerified = ({ isVerified }: { isVerified: boolean }) => {
                  setProfile((prev) => prev ? { ...prev, isVerified } : prev);
            };

            const onOrderUpdate = ({ orderId }: { orderId: string }) => {
                  if (currentOrderRef.current?._id === orderId || !currentOrderRef.current) fetchCurrentOrder();
            };

            socket.on("order:available", onOrderAvailable);
            socket.on("rider:verified", onRiderVerified);
            socket.on("order:update", onOrderUpdate);

            return () => {
                  socket.off("order:available", onOrderAvailable);
                  socket.off("rider:verified", onRiderVerified);
                  socket.off("order:update", onOrderUpdate);
            };
      }, [socket]);

      useEffect(() => {
            if (!user?._id || user.role !== "rider") return;
            fetchCurrentOrder();
            fetchDeliveryHistory();
      }, [user?._id, user?.role]);

      const handleProfileUpdate = async () => {
            try {
                  const payload: any = {};
                  if (editPhone) payload.phoneNumber = editPhone;
                  if (editAadhaar) payload.aadhaarNumber = editAadhaar;
                  if (editLicense) payload.drivingLicesce = editLicense;
                  if (editImageFile) payload.image = editImageFile;

                  const data = await updateRiderProfile(payload);
                  setProfile(data.data);
                  toast.success(data.message || "Profile updated!");
                  setEditingProfile(false);
                  setEditImageFile(null);
                  setEditImagePreview(null);
            } catch (err: any) {
                  toast.error((err as Error).message || "Failed to verify payout setup");
            } finally {
                  setSavingProfile(false);
            }
      };

      const handleLogout = async () => {
            if (profile?.isAvailable) {
                  try {
                        await toggleRiderAvailability({ isAvailable: false, latitude: location?.latitude ?? 0, longitude: location?.longitude ?? 0 });
                  } catch { }
            }
            storage.removeToken();
            toast.success("Logout Successfully");
            setUser(null);
            setIsAuth(false);
      };

      const toggleAvailability = async () => {
            if (!location) {
                  toast.error("Location data is not available. Please wait or enable location access.");
                  return;
            }
            setToggling(true);
            try {
                  const data = await toggleRiderAvailability({ isAvailable: !profile?.isAvailable, latitude: location.latitude, longitude: location.longitude });
                  toast.success(data.message || "Success");
                  setProfile((prev) => prev ? { ...prev, isAvailable: !prev.isAvailable } : prev);
            } catch (error: any) {
                  toast.error(error.message || "Failed to update availability.");
            } finally {
                  setToggling(false);
            }
      };

      const handleStatusUpdate = async (otp?: string, codPaymentMode?: string) => {
            if (!currentOrder) return;
            try {
                  let lat = location?.latitude;
                  let lng = location?.longitude;
                  try {
                        const fresh = await new Promise<GeolocationPosition>((resolve, reject) =>
                              navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 })
                        );
                        lat = fresh.coords.latitude;
                        lng = fresh.coords.longitude;
                  } catch { }

                  const data = await updateOrderStatusByRider(currentOrder._id, lat, lng, otp, codPaymentMode);
                  toast.success(data.message || "Status updated!");

                  const nextStatus = RIDER_ORDER_TRANSITIONS[currentOrder.status];
                  if (nextStatus === "delivered") {
                        setCurrentOrder(null);
                        setProfile((prev) => prev ? { ...prev, isAvailable: false } : prev);
                        fetchDeliveryHistory();
                  } else if (nextStatus) {
                        setCurrentOrder((prev) => prev ? { ...prev, status: nextStatus as IOrder["status"] } : prev);
                  } else {
                        fetchCurrentOrder();
                  }
            } catch (err: any) {
                  toast.error(err.message || "Failed to update status");
            }
      };

      const handleGenerateOtp = async () => {
            if (!currentOrder) return;
            try {
                  await generateDeliveryOtp(currentOrder._id);
                  toast.success("OTP sent to customer!");
            } catch (err: any) {
                  toast.error(err.message || "Failed to generate OTP");
                  throw err;
            }
      };

      if (user?.role !== "rider") {
            return (
                  <div className="flex items-center justify-center min-h-[60vh] text-gray-700 text-2xl font-bold break-all">
                        You are not authorized to view this page.
                  </div>
            );
      }

      if (loading) {
            return (
                  <div className="flex items-center justify-center min-h-[60vh] text-gray-700 text-2xl font-bold">
                        Loading rider details...
                  </div>
            );
      }

      const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0] ?? null;
            setImage(file);
            setPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return file ? URL.createObjectURL(file) : null; });
      };

      const handleSubmit = async () => {
            if (!location) { toast.error("Location data is required."); return; }
            if (!phoneNumber || !aadhaarNumber || !drivingLicesce || !image) { toast.error("Please fill in all required fields."); return; }
            try {
                  setSubmitting(true);
                  const data = await addRiderProfile({
                        phoneNumber,
                        aadhaarNumber,
                        drivingLicesce,
                        image,
                        latitude: location.latitude,
                        longitude: location.longitude,
                  });
                  if (data) { toast.success("Rider profile created successfully."); fetchProfile(); }
                  else toast.error("Failed to create profile.");
            } catch (error: any) {
                  toast.error(error.message || "An error occurred.");
            } finally {
                  setSubmitting(false);
            }
      };

      if (!profile) return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
                  <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div className="bg-primary px-8 py-6">
                              <div className="flex items-center gap-3">
                                    <Bike className="text-white" size={28} />
                                    <div>
                                          <h1 className="text-white text-xl font-bold">Add Rider Profile</h1>
                                          <p className="text-red-200 text-sm">Fill in your details to register as a rider</p>
                                    </div>
                              </div>
                        </div>
                        <div className="px-8 py-6 space-y-5">
                              <label className="block cursor-pointer group">
                                    <div className={`relative w-full h-44 rounded-xl border-2 border-dashed transition-colors duration-200 overflow-hidden flex items-center justify-center ${preview ? "border-primary" : "border-gray-300 hover:border-primary"}`}>
                                          {preview ? (
                                                <img src={preview} alt="preview" className="w-full h-full object-cover" />
                                          ) : (
                                                <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-primary transition-colors">
                                                      <ImagePlus size={36} />
                                                      <span className="text-sm font-medium">Click to upload profile photo</span>
                                                </div>
                                          )}
                                          {preview && (
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                      <span className="text-white text-sm font-medium">Change Image</span>
                                                </div>
                                          )}
                                    </div>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                              </label>
                              <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Phone Number <span className="text-primary">*</span></label>
                                    <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2.5 focus-within:border-primary transition-colors">
                                          <Phone size={16} className="text-gray-400 shrink-0" />
                                          <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+91-9999999999" className="flex-1 outline-none text-sm text-gray-700 bg-transparent" />
                                    </div>
                              </div>
                              <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Aadhaar Number <span className="text-primary">*</span></label>
                                    <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2.5 focus-within:border-primary transition-colors">
                                          <CreditCard size={16} className="text-gray-400 shrink-0" />
                                          <input value={aadhaarNumber} onChange={(e) => setAadhaarNumber(e.target.value)} placeholder="XXXX-XXXX-XXXX" className="flex-1 outline-none text-sm text-gray-700 bg-transparent" />
                                    </div>
                              </div>
                              <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Driving License <span className="text-primary">*</span></label>
                                    <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2.5 focus-within:border-primary transition-colors">
                                          <FileText size={16} className="text-gray-400 shrink-0" />
                                          <input value={drivingLicesce} onChange={(e) => setDrivingLicesce(e.target.value)} placeholder="e.g. WB-0420110012345" className="flex-1 outline-none text-sm text-gray-700 bg-transparent" />
                                    </div>
                              </div>
                              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                                    <MapPin size={16} className="text-primary shrink-0" />
                                    <span className="text-sm text-gray-600 truncate">
                                          {locationLoading ? "Detecting location..." : location?.formattedAddress ?? "Location not available"}
                                    </span>
                              </div>
                              <button
                                    onClick={handleSubmit}
                                    disabled={submitting || locationLoading}
                                    className="w-full bg-primary hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer"
                              >
                                    {submitting ? <><Loader2 size={18} className="animate-spin" /> Creating Profile...</> : <><Bike size={18} /> Add Rider Profile</>}
                              </button>
                        </div>
                  </div>
            </div>
      );

      return (
            <div className="container-app bg-background py-8 space-y-4">
                  {isBlocked && (
                        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                              <span className="text-red-500 text-xl">🚫</span>
                              <div>
                                    <p className="text-sm font-semibold text-red-700">Your account is temporarily blocked</p>
                                    <p className="text-xs text-red-500">You cannot go online or accept orders until {new Date(user!.blockedUntil!).toLocaleDateString("en-IN")}.</p>
                              </div>
                        </div>
                  )}

                  <div className="mx-auto max-w-md bg-white shadow-md rounded-2xl overflow-hidden">
                        <div className="bg-primary px-6 py-8 flex flex-col items-center gap-3 relative">
                              <button
                                    onClick={handleLogout}
                                    className="absolute top-4 right-4 flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition cursor-pointer"
                              >
                                    <LogOut size={14} /> Logout
                              </button>
                              <div className="relative">
                                    <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-white">
                                          <img src={editImagePreview ?? profile.picture} className="w-full h-full object-cover object-top" alt="rider" />
                                    </div>
                                    {editingProfile && (
                                          <button
                                                onClick={() => editFileInputRef.current?.click()}
                                                className="absolute bottom-0 right-0 bg-white text-primary rounded-full p-1.5 shadow"
                                          >
                                                <ImagePlus size={16} />
                                          </button>
                                    )}
                                    <input
                                          ref={editFileInputRef}
                                          type="file" accept="image/*" className="hidden"
                                          onChange={(e) => {
                                                const file = e.target.files?.[0] ?? null;
                                                setEditImageFile(file);
                                                setEditImagePreview(file ? URL.createObjectURL(file) : null);
                                          }}
                                    />
                              </div>
                              <div className="text-center">
                                    <h2 className="text-white text-xl font-bold">{user?.name}</h2>
                                    <span className={`inline-flex items-center gap-1.5 mt-1 px-3 py-0.5 rounded-full text-xs font-semibold ${profile.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
                                          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${profile.isAvailable ? "bg-green-500" : "bg-gray-400"}`} />
                                          {profile.isAvailable ? "Available" : "Unavailable"}
                                    </span>
                              </div>
                              <button
                                    onClick={() => {
                                          if (editingProfile) {
                                                setEditingProfile(false);
                                                setEditPhone("");
                                                setEditAadhaar("");
                                                setEditLicense("");
                                                setEditImageFile(null);
                                                setEditImagePreview(null);
                                          } else {
                                                setEditPhone(profile.phoneNumber);
                                                setEditAadhaar(profile.aadhaarNumber);
                                                setEditLicense(profile.drivingLicesce);
                                                setEditingProfile(true);
                                          }
                                    }}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition cursor-pointer"
                              >
                                    {editingProfile ? <><X size={14} /> Cancel</> : <><Pencil size={14} /> Edit Profile</>}
                              </button>
                        </div>

                        <div className="px-6 py-5 space-y-3">
                              {editingProfile && (
                                    <div className="space-y-3 pb-3 border-b border-gray-100">
                                          <div className="space-y-1">
                                                <label className="text-xs font-medium text-gray-500">Phone Number</label>
                                                <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 focus-within:border-primary">
                                                      <Phone size={14} className="text-gray-400 shrink-0" />
                                                      <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="flex-1 outline-none text-sm text-gray-700 bg-transparent" placeholder="+91-9999999999" />
                                                </div>
                                          </div>
                                          <div className="space-y-1">
                                                <label className="text-xs font-medium text-gray-500">Aadhaar Number</label>
                                                <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 focus-within:border-primary">
                                                      <CreditCard size={14} className="text-gray-400 shrink-0" />
                                                      <input value={editAadhaar} onChange={(e) => setEditAadhaar(e.target.value)} className="flex-1 outline-none text-sm text-gray-700 bg-transparent" placeholder="XXXX-XXXX-XXXX" />
                                                </div>
                                          </div>
                                          <div className="space-y-1">
                                                <label className="text-xs font-medium text-gray-500">Driving License</label>
                                                <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 focus-within:border-primary">
                                                      <FileText size={14} className="text-gray-400 shrink-0" />
                                                      <input value={editLicense} onChange={(e) => setEditLicense(e.target.value)} className="flex-1 outline-none text-sm text-gray-700 bg-transparent" placeholder="WB-0420110012345" />
                                                </div>
                                          </div>
                                          <button
                                                onClick={handleProfileUpdate}
                                                disabled={savingProfile}
                                                className="w-full bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-2 rounded-xl transition flex items-center justify-center gap-2"
                                          >
                                                {savingProfile ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : "Save Changes"}
                                          </button>
                                    </div>
                              )}
                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <Phone size={18} className="text-primary shrink-0" />
                                    <div>
                                          <p className="text-xs text-gray-400">Phone Number</p>
                                          <p className="text-sm font-medium text-gray-700">{profile.phoneNumber}</p>
                                    </div>
                              </div>
                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <CreditCard size={18} className="text-primary shrink-0" />
                                    <div>
                                          <p className="text-xs text-gray-400">Aadhaar Number</p>
                                          <p className="text-sm font-medium text-gray-700">XXXX-XXXX-{profile.aadhaarNumber.slice(-4)}</p>
                                    </div>
                              </div>
                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <FileText size={18} className="text-primary shrink-0" />
                                    <div>
                                          <p className="text-xs text-gray-400">Driving License</p>
                                          <p className="text-sm font-medium text-gray-700">{profile.drivingLicesce}</p>
                                    </div>
                              </div>
                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <Bike size={18} className="text-primary shrink-0" />
                                    <div>
                                          <p className="text-xs text-gray-400">Verification Status</p>
                                          <p className={`text-sm font-semibold ${profile.isVerified ? "text-green-600" : "text-yellow-600"}`}>
                                                {profile.isVerified ? "Verified" : "Pending Verification"}
                                          </p>
                                    </div>
                              </div>

                              {import.meta.env.DEV && location && (
                                    <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                                          <MapPin size={16} className="text-blue-500 shrink-0 mt-0.5" />
                                          <div>
                                                <p className="text-xs text-blue-700 font-semibold">Active Location (dev)</p>
                                                <p className="text-xs text-blue-600 mt-0.5">{location.formattedAddress}</p>
                                                <p className="text-[10px] text-blue-400 font-mono mt-0.5">{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</p>
                                          </div>
                                    </div>
                              )}

                              <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-300 rounded-xl px-4 py-3">
                                    <span className="text-yellow-500 text-lg leading-none mt-0.5">⚠️</span>
                                    <p className="text-xs text-yellow-800 font-medium">
                                          Please ensure that you are within the delivery radius of a restaurant before going online as a rider to receive orders.
                                    </p>
                              </div>

                              {profile.isVerified && (
                                    <button
                                          onClick={toggleAvailability}
                                          disabled={isBlocked || toggling || !location || !!currentOrder}
                                          className={`w-full py-3 rounded-xl font-semibold text-white transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 ${profile.isAvailable ? "bg-gray-500 hover:bg-gray-600" : "bg-primary hover:bg-red-700"}`}
                                    >
                                          {toggling ? <><Loader2 size={18} className="animate-spin" /> Updating...</> : profile.isAvailable ? <><Bike size={18} /> Go Offline</> : <><Bike size={18} /> Go Online</>}
                                    </button>
                              )}
                              {currentOrder && (
                                    <p className="text-xs text-center text-amber-600 font-medium">
                                          You cannot change availability while on an active delivery.
                                    </p>
                              )}
                        </div>
                  </div>

                  {!audioUnlocked && (
                        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
                              <div className="flex items-center gap-3">
                                    <VolumeX size={20} className="text-amber-500 shrink-0" />
                                    <div>
                                          <p className="text-sm font-semibold text-amber-800">Enable sound notifications</p>
                                          <p className="text-xs text-amber-600">Get notified when new orders arrive</p>
                                    </div>
                              </div>
                              <button onClick={enableAudio} className="text-xs font-semibold px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition">
                                    Enable
                              </button>
                        </div>
                  )}

                  {/* Tab navigation */}
                  {profile.isVerified && (
                        <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
                              <button
                                    onClick={() => setActiveTab("orders")}
                                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${activeTab === "orders" ? "bg-primary text-white" : "text-gray-500 hover:text-gray-700"}`}
                              >
                                    <span className="flex items-center justify-center gap-1.5"><Bike size={14} /> Orders</span>
                              </button>
                              <button
                                    onClick={() => setActiveTab("earnings")}
                                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${activeTab === "earnings" ? "bg-primary text-white" : "text-gray-500 hover:text-gray-700"}`}
                              >
                                    <span className="flex items-center justify-center gap-1.5"><TrendingUp size={14} /> Earnings</span>
                              </button>
                        </div>
                  )}

                  {activeTab === "earnings" && <EarningsDashboard />}

                  {activeTab === "orders" && (
                        <>
                              {inCommingOrders.length > 0 && (
                                    <div className="space-y-3">
                                          <h2 className="text-lg font-bold text-gray-700">Incoming Orders</h2>
                                          {inCommingOrders.map((orderId) => (
                                                <IncomingOrderCard
                                                      key={orderId}
                                                      orderId={orderId}
                                                      onExpire={() => setInCommingOrders((prev) => prev.filter((id) => id !== orderId))}
                                                      onAccept={isBlocked ? undefined : async () => {
                                                            try {
                                                                  const data = await acceptOrder(orderId);
                                                                  toast.success(data.message || "Order accepted!");
                                                                  setInCommingOrders([]);
                                                                  setProfile((prev) => prev ? { ...prev, isAvailable: false } : prev);
                                                                  await fetchCurrentOrder();
                                                            } catch (err: any) {
                                                                  toast.error(err.message || "Failed to accept order");
                                                            }
                                                      }}
                                                />
                                          ))}
                                    </div>
                              )}

                              {currentOrder && (
                                    <div className="space-y-3">
                                          <h2 className="text-lg font-bold text-gray-700">Current Order</h2>
                                          <CurrentOrderCard
                                                order={currentOrder}
                                                onStatusUpdate={handleStatusUpdate}
                                                onGenerateOtp={handleGenerateOtp}
                                          />
                                          <RiderOrderMap order={currentOrder} />
                                    </div>
                              )}

                              {deliveryHistory.length > 0 && (
                                    <div className="space-y-3">
                                          <div className="flex items-center gap-2">
                                                <History size={18} className="text-gray-500" />
                                                <h2 className="text-lg font-bold text-gray-700">Delivery History</h2>
                                                <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">Total : {deliveryHistory.length}</span>
                                          </div>
                                          {deliveryHistory.map((order) => (
                                                <DeliveryHistoryCard key={order._id} order={order} />
                                          ))}
                                    </div>
                              )}
                        </>
                  )}
            </div>
      );
};

export default RiderDashboard;
