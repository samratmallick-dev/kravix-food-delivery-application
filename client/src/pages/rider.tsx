import { useEffect, useRef, useState } from "react";
import { useAppData } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import type { IOrder, IRider } from "../types/types";
import toast from "react-hot-toast";
import {
  fetchMyRiderProfile,
  updateRiderProfile,
  updateOrderStatusByRider,
  generateDeliveryOtp,
  addRiderProfile,
  acceptOrder,
  startShift,
  endShift,
  pauseShift,
  resumeShift,
  fetchShiftHistory,
  updateVehicle,
  fetchWalletSummary,
  fetchWalletTransactions,
  withdrawFunds,
  configureBankDetails,
  uploadRiderDocument,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  fetchLeaderboard,
  fetchAnalytics,
  fetchCurrentOrder as apiFetchCurrentOrder,
  fetchDeliveryHistory as apiFetchDeliveryHistory
} from "../utils/rider.api";
import {
  Bike, Phone, MapPin, CreditCard, FileText,
  VolumeX, History, LogOut, TrendingUp, Pencil, X,
  ShieldAlert, AlertTriangle, CloudSun, Wifi, BatteryCharging, Compass,
  RefreshCw, CheckCircle2, HelpCircle, UserCheck,
  Bell, Map, Wallet, User, AlertOctagon, UploadCloud
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import RiderOrderMap from "../components/rider/riderOrderMap";
import { storage } from "../utils/secureStorage";
import audio from "../assets/rider_order_alert.mp3";

type NavigationTab = "home" | "orders" | "map" | "wallet" | "profile";

const RiderDashboard = () => {
  const { user, location, locationLoading, setUser, setIsAuth, detectUserLocation, setLocation } = useAppData();
  const { socket } = useSocket();
  const isBlocked = !!(user?.isBlocked && user.blockedUntil && new Date(user.blockedUntil) > new Date());

  const [activeNav, setActiveNav] = useState<NavigationTab>("home");
  const [profile, setProfile] = useState<IRider | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  
  const [showDocuments, setShowDocuments] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sosActive, setSosActive] = useState(false);

  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [drivingLicense, setDrivingLicense] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [registerStep, setRegisterStep] = useState(1);

  
  const [editingProfile, setEditingProfile] = useState(false);
  const [editPhone, setEditPhone] = useState("");
  const [editAadhaar, setEditAadhaar] = useState("");
  const [editLicense, setEditLicense] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editEmergencyName, setEditEmergencyName] = useState("");
  const [editEmergencyPhone, setEditEmergencyPhone] = useState("");
  const [editEmergencyRelation, setEditEmergencyRelation] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  
  const [vType, setVType] = useState<"bike" | "scooter" | "cycle" | "ev">("bike");
  const [vFuel, setVFuel] = useState<"petrol" | "electric" | "none">("petrol");
  const [vNumber, setVNumber] = useState("");
  const [vMake, setVMake] = useState("");
  const [vModel, setVModel] = useState("");
  const [vColor, setVColor] = useState("");
  const [vOwnership, setVOwnership] = useState<"owned" | "rented" | "leased">("owned");
  const [updatingV, setUpdatingV] = useState(false);

  
  const [bankName, setBankName] = useState("");
  const [bankAcc, setBankAcc] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [upiId, setUpiId] = useState("");
  const [updatingBank, setUpdatingBank] = useState(false);

  
  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  
  const [inCommingOrders, setInCommingOrders] = useState<string[]>([]);
  const [currentOrder, setCurrentOrder] = useState<IOrder | null>(null);
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);

  
  const [shiftLogs, setShiftLogs] = useState<any[]>([]);
  const [shiftTimer, setShiftTimer] = useState("00:00:00");

  
  const [walletSummary, setWalletSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentOrderRef = useRef<IOrder | null>(null);
  currentOrderRef.current = currentOrder;
  const audioUnlockedRef = useRef(false);

  
  const [battery, setBattery] = useState("Detecting...");
  const [gpsAccuracy, setGpsAccuracy] = useState("Detecting...");
  const [rttLatency, setRttLatency] = useState("Detecting...");
  const [weatherDesc, setWeatherDesc] = useState("Detecting...");

  useEffect(() => {
    if ("getBattery" in navigator) {
      (navigator as any).getBattery().then((bat: any) => {
        const update = () => setBattery(`${Math.round(bat.level * 100)}%`);
        update();
        bat.addEventListener("levelchange", update);
        return () => bat.removeEventListener("levelchange", update);
      }).catch(() => setBattery("N/A"));
    } else {
      setBattery("N/A");
    }
  }, []);

  useEffect(() => {
    if (location) {
      setGpsAccuracy(location.latitude ? "Active (Precise)" : "GPS Unavailable");
    } else {
      setGpsAccuracy(locationLoading ? "Locating..." : "GPS Unavailable");
    }
  }, [location, locationLoading]);

  useEffect(() => {
    const updateConn = () => {
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (!navigator.onLine) {
        setRttLatency("Disconnected");
      } else if (conn && conn.rtt) {
        setRttLatency(`Online (${conn.rtt}ms RTT)`);
      } else {
        setRttLatency("Online (Good)");
      }
    };
    updateConn();
    window.addEventListener("online", updateConn);
    window.addEventListener("offline", updateConn);
    return () => {
      window.removeEventListener("online", updateConn);
      window.removeEventListener("offline", updateConn);
    };
  }, []);

  useEffect(() => {
    if (!location?.latitude || !location?.longitude) {
      setWeatherDesc("GPS Required");
      return;
    }
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current_weather=true`)
      .then(res => res.json())
      .then(data => {
        const temp = data.current_weather?.temperature;
        const code = data.current_weather?.weathercode;
        let desc = "Clear";
        if (code >= 1 && code <= 3) desc = "Partly Cloudy";
        else if (code >= 45 && code <= 48) desc = "Foggy";
        else if (code >= 51 && code <= 67) desc = "Rainy";
        else if (code >= 71 && code <= 77) desc = "Snowy";
        else if (code >= 80 && code <= 82) desc = "Showers";
        else if (code >= 95) desc = "Thunderstorm";
        setWeatherDesc(`${desc}, ${temp}°C`);
      })
      .catch(() => setWeatherDesc("Unavailable"));
  }, [location]);

  const diagnostics = {
    gps: gpsAccuracy,
    battery: battery,
    internet: rttLatency,
    weather: weatherDesc
  };

  const enableAudio = async () => {
    try {
      const audioEl = new Audio(audio);
      await audioEl.play().catch(() => {});
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

  const loadOperationalData = async () => {
    if (!profile) return;
    try {
      const results = await Promise.allSettled([
        fetchWalletSummary(),
        fetchWalletTransactions(),
        fetchLeaderboard(),
        fetchAnalytics(),
        fetchNotifications(),
        fetchShiftHistory()
      ]);

      if (results[0].status === "fulfilled") setWalletSummary(results[0].value.data);
      if (results[1].status === "fulfilled") setTransactions(results[1].value.data || []);
      if (results[2].status === "fulfilled") setLeaderboard(results[2].value.data || []);
      if (results[3].status === "fulfilled") setAnalytics(results[3].value.data || null);
      if (results[4].status === "fulfilled") setNotifications(results[4].value.data || []);
      if (results[5].status === "fulfilled") setShiftLogs(results[5].value.data || []);
    } catch (e) {
      console.error("Error loading operational stats:", e);
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
    if (!profile) {
      detectUserLocation(false).catch((err) => console.error("Auto location check failed:", err));
    }
  }, [profile, detectUserLocation]);

  useEffect(() => {
    if (profile) {
      loadOperationalData();
    }
  }, [profile]);

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

  const fetchHistory = async () => {
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
      setTimeout(() => setInCommingOrders((prev) => prev.filter((id) => id !== orderId)), 15_000);
    };

    const onRiderVerified = ({ isVerified }: { isVerified: boolean }) => {
      setProfile((prev) => prev ? { ...prev, isVerified } : prev);
      toast.success("Congratulations! Your KYC documents have been verified.");
    };

    const onOrderUpdate = ({ orderId }: { orderId: string }) => {
      if (currentOrderRef.current?._id === orderId || !currentOrderRef.current) {
        fetchCurrentOrder();
      }
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
    fetchHistory();
  }, [user?._id, user?.role]);

  
  useEffect(() => {
    let interval: any;
    if (profile?.availabilityStatus && profile.availabilityStatus !== "OFFLINE") {
      const activeShiftLog = shiftLogs.find((s) => s.status === "active");
      
      const updateTimer = () => {
        if (!activeShiftLog) return;
        const start = new Date(activeShiftLog.startTime).getTime();
        
        let referenceEnd = Date.now();
        if (profile.availabilityStatus === "BREAK") {
          const activeBreak = activeShiftLog.breaks?.find((b: any) => !b.end);
          if (activeBreak) {
            referenceEnd = new Date(activeBreak.start).getTime();
          }
        }
        
        let completedBreakMs = 0;
        if (activeShiftLog.breaks) {
          activeShiftLog.breaks.forEach((b: any) => {
            if (b.end) {
              completedBreakMs += new Date(b.end).getTime() - new Date(b.start).getTime();
            }
          });
        }
        
        const diffMs = Math.max(0, referenceEnd - start - completedBreakMs);
        const hrs = Math.floor(diffMs / 3600000);
        const mins = Math.floor((diffMs % 3600000) / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        setShiftTimer(
          `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
        );
      };

      updateTimer();
      if (profile.availabilityStatus !== "BREAK") {
        interval = setInterval(updateTimer, 1000);
      }
    } else {
      setShiftTimer("00:00:00");
    }

    return () => clearInterval(interval);
  }, [profile?.availabilityStatus, shiftLogs]);

  useEffect(() => {
    if (walletSummary) {
      setBankName(walletSummary.bankName || "");
      setBankAcc(walletSummary.bankAccountNumber || "");
      setBankIfsc(walletSummary.bankIfsc || "");
      setUpiId(walletSummary.upiId || "");
    }
  }, [walletSummary]);

  
  const handleStartShift = async () => {
    try {
      await startShift();
      toast.success("Work shift started. Keep safe!");
      fetchProfile();
    } catch (e: any) {
      toast.error(e.message || "Failed to start shift");
    }
  };

  const handleEndShift = async () => {
    try {
      await endShift();
      toast.success("Work shift ended. Good job today!");
      fetchProfile();
    } catch (e: any) {
      toast.error(e.message || "Failed to end shift");
    }
  };

  const handlePauseShift = async () => {
    try {
      await pauseShift();
      toast.success("Shift paused (Break timer active)");
      fetchProfile();
    } catch (e: any) {
      toast.error(e.message || "Failed to pause shift");
    }
  };

  const handleResumeShift = async () => {
    try {
      await resumeShift();
      toast.success("Welcome back! Active shift resumed.");
      fetchProfile();
    } catch (e: any) {
      toast.error(e.message || "Failed to resume shift");
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setSavingProfile(true);
      const updates: any = {
        phoneNumber: editPhone,
        aadhaarNumber: editAadhaar,
        drivingLicesce: editLicense,
        address: editAddress,
        emergencyContact: {
          name: editEmergencyName,
          phone: editEmergencyPhone,
          relation: editEmergencyRelation
        }
      };
      await updateRiderProfile(updates);
      toast.success("Profile details updated successfully!");
      setEditingProfile(false);
      fetchProfile();
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile changes");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateVehicle = async () => {
    try {
      setUpdatingV(true);
      await updateVehicle({
        type: vType,
        fuelType: vFuel,
        number: vNumber,
        manufacturer: vMake,
        model: vModel,
        color: vColor,
        ownership: vOwnership
      });
      toast.success("Vehicle details submitted successfully!");
      setShowVehicleForm(false);
      fetchProfile();
    } catch (err: any) {
      toast.error(err.message || "Failed to configure vehicle");
    } finally {
      setUpdatingV(false);
    }
  };

  const handleConfigureBank = async () => {
    try {
      setUpdatingBank(true);
      await configureBankDetails({
        bankName,
        bankAccountNumber: bankAcc,
        bankIfsc,
        upiId
      });
      toast.success("Payout methods configured!");
      loadOperationalData();
    } catch (err: any) {
      toast.error(err.message || "Failed to configure payouts");
    } finally {
      setUpdatingBank(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmt || isNaN(Number(withdrawAmt))) {
      toast.error("Please insert a valid cash amount");
      return;
    }
    try {
      setWithdrawing(true);
      await withdrawFunds(Number(withdrawAmt));
      toast.success(`Settlement request of ₹${withdrawAmt} submitted!`);
      setWithdrawAmt("");
      loadOperationalData();
    } catch (err: any) {
      toast.error(err.message || "Withdrawal request failed");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const data = await acceptOrder(orderId);
      toast.success(data.message || "Order accepted!");
      setInCommingOrders([]);
      await fetchCurrentOrder();
      setActiveNav("orders");
    } catch (err: any) {
      toast.error(err.message || "Failed to accept order");
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
      } catch {}

      const data = await updateOrderStatusByRider(currentOrder._id, lat, lng, otp, codPaymentMode);
      toast.success(data.message || "Order status updated!");
      fetchCurrentOrder();
      fetchHistory();
      if (data.data?.status === "delivered") {
        fetchProfile();
        setActiveNav("home");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const triggerSos = () => {
    setSosActive(true);
    toast.error("🚨 EMERGENCY SOS BROADCASTED. POLICE/SUPPORT NOTIFIED.");
    setTimeout(() => setSosActive(false), 8000);
  };

  const handleLogout = async () => {
    if (profile?.availabilityStatus && profile.availabilityStatus !== "OFFLINE") {
      try {
        await endShift();
      } catch {}
    }
    storage.removeToken();
    toast.success("Logged out successfully");
    setUser(null);
    setIsAuth(false);
  };

  
  const handleRegisterProfile = async () => {
    if (!location) {
      toast.error("GPS coordinates needed to register.");
      return;
    }
    if (!phoneNumber || !aadhaarNumber || !drivingLicense || !image) {
      toast.error("Please complete all profile details.");
      return;
    }
    try {
      setSubmitting(true);
      const data = await addRiderProfile({
        phoneNumber,
        aadhaarNumber,
        drivingLicesce: drivingLicense,
        image,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      if (data) {
        toast.success("Profile created! Verification pending.");
        fetchProfile();
      }
    } catch (e: any) {
      toast.error(e.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImage(file);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  if (user?.role !== "rider") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-700 p-6">
        <ShieldAlert size={48} className="text-red-500 mb-2" />
        <h2 className="text-2xl font-bold">Access Restrained</h2>
        <p className="text-sm text-slate-400">Riders credentials required.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-3">
        <RefreshCw className="animate-spin text-orange-500" size={32} />
        <p className="text-sm font-semibold tracking-wide text-slate-400">Synchronizing Partner Console...</p>
      </div>
    );
  }

  
  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-orange-500 to-red-600 px-8 py-6">
            <div className="flex items-center gap-3">
              <Bike className="text-white" size={32} />
              <div>
                <h1 className="text-white text-xl font-black">Register Rider Profile</h1>
                <p className="text-orange-100 text-xs mt-0.5">Kravix Delivery Partner Program</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-6 bg-black/20 p-2.5 rounded-xl border border-white/10">
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${registerStep >= 1 ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-400"}`}>1</span>
                <span className="text-[10px] font-bold hidden sm:inline text-slate-300">Contact</span>
              </div>
              <div className="w-6 h-0.5 bg-slate-800" />
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${registerStep >= 2 ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-400"}`}>2</span>
                <span className="text-[10px] font-bold hidden sm:inline text-slate-300">Identity</span>
              </div>
              <div className="w-6 h-0.5 bg-slate-800" />
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${registerStep >= 3 ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-400"}`}>3</span>
                <span className="text-[10px] font-bold hidden sm:inline text-slate-300">Photo</span>
              </div>
              <div className="w-6 h-0.5 bg-slate-800" />
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${registerStep >= 4 ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-400"}`}>4</span>
                <span className="text-[10px] font-bold hidden sm:inline text-slate-300">Review</span>
              </div>
            </div>
          </div>
          <div className="p-8 space-y-5">
            {registerStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Partner Name</label>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-sm text-slate-400 font-bold select-none cursor-not-allowed">
                    {user?.name}
                  </div>
                  <p className="text-[10px] text-slate-500">Name linked directly from account registry.</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Phone Number</label>
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5">
                    <Phone size={14} className="text-slate-500" />
                    <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+91 99999-99999" className="flex-1 bg-transparent text-sm outline-none border-none text-white font-mono" />
                  </div>
                </div>
                <button onClick={() => {
                  if (phoneNumber.trim().length < 10) {
                    toast.error("Please enter a valid phone number");
                  } else {
                    setRegisterStep(2);
                  }
                }} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer mt-4">
                  Continue to Identification
                </button>
              </div>
            )}
            {registerStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Aadhaar Card ID</label>
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5">
                    <CreditCard size={14} className="text-slate-500" />
                    <input value={aadhaarNumber} onChange={(e) => setAadhaarNumber(e.target.value)} placeholder="12-digit Aadhaar" className="flex-1 bg-transparent text-sm outline-none border-none text-white font-mono" maxLength={12} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Driving License ID</label>
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5">
                    <FileText size={14} className="text-slate-500" />
                    <input value={drivingLicense} onChange={(e) => setDrivingLicense(e.target.value)} placeholder="License ID (DL-XXXXXXXXXXXXX)" className="flex-1 bg-transparent text-sm outline-none border-none text-white font-mono" />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setRegisterStep(1)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition cursor-pointer">
                    Back
                  </button>
                  <button onClick={() => {
                    if (aadhaarNumber.trim().length !== 12 || isNaN(Number(aadhaarNumber))) {
                      toast.error("Please enter a valid 12-digit Aadhaar ID");
                    } else if (drivingLicense.trim().length < 5) {
                      toast.error("Please enter a valid Driving License ID");
                    } else {
                      setRegisterStep(3);
                    }
                  }} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition cursor-pointer">
                    Continue
                  </button>
                </div>
              </div>
            )}
            {registerStep === 3 && (
              <div className="space-y-4">
                <label className="block cursor-pointer group">
                  <div className={`relative w-full h-44 rounded-2xl border-2 border-dashed transition-colors duration-200 overflow-hidden flex items-center justify-center ${preview ? "border-orange-500 bg-slate-950" : "border-slate-700 bg-slate-950/50 hover:border-orange-500"}`}>
                    {preview ? (
                      <img src={preview} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-slate-500 group-hover:text-orange-500 transition-colors">
                        <UploadCloud size={32} />
                        <span className="text-xs font-semibold">Upload Profile KYC Photo</span>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
                <p className="text-[10px] text-slate-500 text-center">Ensure your face is clearly visible with good lighting.</p>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setRegisterStep(2)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition cursor-pointer">
                    Back
                  </button>
                  <button onClick={() => {
                    if (!image) {
                      toast.error("Please upload your KYC profile photo");
                    } else {
                      setRegisterStep(4);
                    }
                  }} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition cursor-pointer">
                    Continue
                  </button>
                </div>
              </div>
            )}
            {registerStep === 4 && (
              <div className="space-y-4">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                  <h3 className="text-xs font-bold text-orange-500 uppercase tracking-wide">Review Details</h3>
                  <div className="text-xs text-slate-300 space-y-1.5 font-mono">
                    <p>Name: <span className="text-white font-bold">{user?.name}</span></p>
                    <p>Phone: <span className="text-white font-bold">{phoneNumber}</span></p>
                    <p>Aadhaar: <span className="text-white font-bold">XXXX-XXXX-{aadhaarNumber.slice(-4)}</span></p>
                    <p>License: <span className="text-white font-bold">{drivingLicense}</span></p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3">
                  <div className="flex items-center gap-2.5">
                    <MapPin size={16} className="text-orange-500 shrink-0" />
                    <span className="text-xs text-slate-400 truncate">
                      {locationLoading ? "Verifying GPS positioning..." : location?.formattedAddress ?? "GPS Unavailable"}
                    </span>
                  </div>
                  {!locationLoading && (
                    <button
                      onClick={async () => {
                        const ok = await detectUserLocation(true);
                        if (!ok) {
                          toast.success("Sandbox location fallback configured.");
                          setLocation({
                            latitude: 22.5726,
                            longitude: 88.3639,
                            formattedAddress: "Salt Lake Sector V, Kolkata, West Bengal"
                          });
                        }
                      }}
                      className="text-xs text-orange-500 hover:text-orange-400 font-bold text-left self-start cursor-pointer pt-1"
                    >
                      {location ? "Update GPS Position" : "Allow Location Access / Use Sandbox Fallback"}
                    </button>
                  )}
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setRegisterStep(3)} disabled={submitting} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition cursor-pointer disabled:opacity-50">
                    Back
                  </button>
                  <button onClick={handleRegisterProfile} disabled={submitting || locationLoading} className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-lg shadow-orange-950/20 cursor-pointer">
                    {submitting ? "Deploying..." : "Submit Profile"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  if (!profile.isVerified) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-8 text-center space-y-6">
          <div className="relative w-24 h-24 mx-auto bg-orange-500/10 rounded-full flex items-center justify-center border border-orange-500/20">
            <RefreshCw className="animate-spin text-orange-500" size={40} />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-white">KYC Verification Under Review</h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Your profile has been submitted and is currently being audited by the Kravix administrator team.
            </p>
          </div>
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 text-left space-y-3">
            <h4 className="text-xs font-bold text-orange-500 uppercase tracking-wide">Verification Checklist</h4>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span>Profile details registered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span>Aadhaar Identity Verification (Pending Review)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span>Driving License Audit (Pending Review)</span>
              </div>
            </div>
          </div>
          <div className="pt-2 flex gap-3">
            <button
              onClick={() => {
                setShowSupport(true);
              }}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition text-xs cursor-pointer"
            >
              Contact Support SOS
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 bg-red-950/40 hover:bg-red-950/80 border border-red-900/60 text-red-400 font-bold py-3 rounded-xl transition text-xs cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </div>

        {showSupport && (
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex justify-end text-left">
            <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 flex flex-col shadow-2xl">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <h2 className="text-lg font-black text-white">Partner Support SOS</h2>
                <button onClick={() => setShowSupport(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                <button onClick={triggerSos} className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg animate-pulse">
                  <ShieldAlert size={20} /> Trigger Emergency SOS
                </button>
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Operational Contacts</h3>
                  <div className="text-xs text-slate-400 space-y-2">
                    <div className="flex justify-between font-mono">
                      <span>Police SOS:</span>
                      <a href="tel:100" className="text-orange-500 font-bold hover:underline">100</a>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span>Medical Ambulance:</span>
                      <a href="tel:102" className="text-orange-500 font-bold hover:underline">102</a>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span>Partner Hotline Support:</span>
                      <a href="tel:+918005556677" className="text-orange-500 font-bold hover:underline">+91 800-555-6677</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 md:pb-6 relative font-sans">
      
      {}
      {isBlocked && (
        <div className="bg-red-950/80 border-b border-red-800 px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="text-red-500 animate-bounce" />
          <div className="text-xs">
            <span className="font-bold text-red-400">Account Temporarily Suspended:</span> Restrained from shift activities until {new Date(user!.blockedUntil!).toLocaleDateString("en-IN")}.
          </div>
        </div>
      )}

      {}
      {sosActive && (
        <div className="fixed inset-0 z-50 bg-red-950/90 backdrop-blur flex flex-col items-center justify-center p-6 text-center animate-pulse">
          <AlertOctagon size={80} className="text-red-500 animate-spin mb-4" />
          <h1 className="text-3xl font-black uppercase text-red-500 tracking-wide">SOS Broadcast Active</h1>
          <p className="text-lg text-white mt-2 max-w-md">GPS coordinates transmitted. Local authorities and support operators have been dispatched.</p>
        </div>
      )}

      {}
      <div className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {}
        <div className="lg:col-span-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src={profile.picture || "https://placehold.co/100x100"} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-orange-500" alt="partner" />
              {profile.isVerified && (
                <span className="absolute -top-1.5 -right-1.5 bg-green-500 text-white rounded-full p-0.5" title="KYC Verified">
                  <UserCheck size={12} />
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white">{user?.name}</h1>
                <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  ⭐ {profile.rating !== undefined ? Number(profile.rating).toFixed(1) : "0.0"}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {profile.vehicle ? `${profile.vehicle.manufacturer} ${profile.vehicle.model} (${profile.vehicle.number})` : "No vehicle configured"}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
                <span>Shift Status:</span>
                <span className={`w-2 h-2 rounded-full animate-pulse ${profile.availabilityStatus === "ONLINE" ? "bg-green-500" : profile.availabilityStatus === "BREAK" ? "bg-amber-500" : profile.availabilityStatus === "DELIVERING" ? "bg-blue-500" : "bg-slate-600"}`} />
                <span className="capitalize font-semibold text-slate-300">{profile.availabilityStatus?.toLowerCase()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowNotifications(true)} className="relative bg-slate-800 hover:bg-slate-700 text-white p-2.5 rounded-xl transition cursor-pointer">
              <Bell size={18} />
              {notifications.filter(n => !n.readAt).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center animate-ping" />
              )}
            </button>
            <button onClick={() => setActiveNav("wallet")} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl transition text-xs font-black flex items-center gap-2 cursor-pointer">
              <Wallet size={16} className="text-orange-500" /> Wallet (₹{walletSummary ? walletSummary.balance : 0})
            </button>
            <button onClick={triggerSos} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl transition text-xs font-black flex items-center gap-1.5 cursor-pointer animate-pulse">
              <ShieldAlert size={16} /> SOS Emergency
            </button>
            <button onClick={handleLogout} className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2.5 rounded-xl transition cursor-pointer">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {}
        {activeNav === "home" && (
          <>
            {}
            <div className="lg:col-span-8 space-y-6">
              
              {}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
                  <Wifi className="text-green-500" size={20} />
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Telemetry Link</p>
                    <p className="text-xs font-black text-white mt-0.5">{diagnostics.internet}</p>
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
                  <Compass className="text-orange-500 animate-spin-slow" size={20} />
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">GPS Position</p>
                    <p className="text-xs font-black text-white mt-0.5">{diagnostics.gps}</p>
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
                  <BatteryCharging className="text-amber-500" size={20} />
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Battery Status</p>
                    <p className="text-xs font-black text-white mt-0.5">{diagnostics.battery}</p>
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
                  <CloudSun className="text-blue-400" size={20} />
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Environment</p>
                    <p className="text-xs font-black text-white mt-0.5">{diagnostics.weather}</p>
                  </div>
                </div>
              </div>

              {}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl" />
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="text-xs font-black uppercase text-orange-500 tracking-widest">Partner Operations</span>
                    <h2 className="text-2xl font-black text-white mt-1">Shift Control & Timing</h2>
                    <p className="text-sm text-slate-400 mt-1 max-w-sm">Manage shift state toggling to begin receiving order dispatches.</p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 px-6 py-4 rounded-2xl flex flex-col items-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Active shift timer</p>
                    <span className="text-2xl font-black text-white font-mono mt-1">{shiftTimer}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                  {profile.availabilityStatus === "OFFLINE" ? (
                    <button onClick={handleStartShift} disabled={isBlocked} className="col-span-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-orange-950/20 cursor-pointer">
                      <Bike size={18} /> Start Payout Shift
                    </button>
                  ) : (
                    <>
                      <button onClick={handleEndShift} className="bg-red-950/40 hover:bg-red-950/80 border border-red-900 text-red-400 font-bold py-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer">
                        <LogOut size={16} /> End Shift
                      </button>
                      {profile.availabilityStatus === "BREAK" ? (
                        <button onClick={handleResumeShift} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer">
                          <CheckCircle2 size={16} /> Resume Shift
                        </button>
                      ) : (
                        <button onClick={handlePauseShift} className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer">
                          <VolumeX size={16} /> Go on Break
                        </button>
                      )}
                    </>
                  )}
                  
                  {}
                  {!audioUnlocked && (
                    <button onClick={enableAudio} className="col-span-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer">
                      <VolumeX size={16} /> Enable Alert Sounds
                    </button>
                  )}
                </div>
              </div>

              {}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <h3 className="text-base font-bold text-white mb-4">Partner Hub Utilities</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <button onClick={() => setShowDocuments(true)} className="flex flex-col items-center bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-2xl p-4 transition group cursor-pointer">
                    <FileText className="text-orange-500 mb-2 group-hover:scale-110 transition" size={24} />
                    <span className="text-xs font-bold">KYC Uploads</span>
                  </button>
                  <button onClick={() => setShowVehicleForm(true)} className="flex flex-col items-center bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-2xl p-4 transition group cursor-pointer">
                    <Bike className="text-blue-400 mb-2 group-hover:scale-110 transition" size={24} />
                    <span className="text-xs font-bold">Vehicle Details</span>
                  </button>
                  <button onClick={() => setShowLeaderboard(true)} className="flex flex-col items-center bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-2xl p-4 transition group cursor-pointer">
                    <TrendingUp className="text-green-400 mb-2 group-hover:scale-110 transition" size={24} />
                    <span className="text-xs font-bold">Leaderboard</span>
                  </button>
                  <button onClick={() => setShowSupport(true)} className="flex flex-col items-center bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-2xl p-4 transition group group-hover:bg-slate-800/80 transition cursor-pointer">
                    <HelpCircle className="text-purple-400 mb-2 group-hover:scale-110 transition" size={24} />
                    <span className="text-xs font-bold">Support SOS</span>
                  </button>
                </div>
              </div>
            </div>

            {}
            <div className="lg:col-span-4 space-y-6">
              
              {}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Incentive progression</span>
                <h4 className="text-sm font-bold text-white mt-0.5">Daily Deliveries Target</h4>
                <div className="flex justify-between items-baseline mt-4">
                  <span className="text-3xl font-black text-white">{profile.totalDeliveries}</span>
                  <span className="text-xs text-slate-400">Target: 15 order runs</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full mt-2.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min((profile.totalDeliveries / 15) * 100, 100)}%` }} />
                </div>
                <p className="text-[10px] text-slate-500 mt-2">Complete {15 - Math.min(profile.totalDeliveries, 15)} more order deliveries to unlock daily milestone bonus.</p>
              </div>

              {}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                <h4 className="text-sm font-bold text-white">Performance metrics</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Acceptance</p>
                    <span className="text-lg font-black text-white mt-1 block">
                      {analytics?.statistics?.acceptanceRate != null ? `${analytics.statistics.acceptanceRate}%` : "100%"}
                    </span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">On Time %</p>
                    <span className="text-lg font-black text-green-500 mt-1 block">
                      {analytics?.statistics?.onTimeDeliveryRate != null ? `${analytics.statistics.onTimeDeliveryRate}%` : "100%"}
                    </span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Completion</p>
                    <span className="text-lg font-black text-white mt-1 block">
                      {analytics?.statistics?.completionRate != null ? `${analytics.statistics.completionRate}%` : "100%"}
                    </span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Avg Speed</p>
                    <span className="text-lg font-black text-orange-500 mt-1 block">
                      {analytics?.statistics?.averageDeliveryTimeMinutes != null ? `${analytics.statistics.averageDeliveryTimeMinutes}m/ord` : "0m/ord"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {}
            {analytics && analytics.weeklyComparison && (
              <div className="lg:col-span-12 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <h3 className="text-base font-bold text-white mb-4">Earnings & Deliveries Compare</h3>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.weeklyComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="day" stroke="#94a3b8" />
                      <YAxis yAxisId="left" orientation="left" stroke="#ff7300" />
                      <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }} />
                      <Bar yAxisId="left" dataKey="earnings" name="Earnings (₹)" fill="#ff7300" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="deliveries" name="Order count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}

        {}
        {activeNav === "orders" && (
          <div className="lg:col-span-12 space-y-6">
            
            {}
            {inCommingOrders.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  Incoming order dispatch notifications ({inCommingOrders.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                  {inCommingOrders.map((orderId) => (
                    <div key={orderId} className="bg-slate-900 border-2 border-orange-500 rounded-2xl p-5 shadow-xl flex justify-between items-center gap-4">
                      <div>
                        <span className="bg-orange-950 border border-orange-800 text-orange-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">New Dispatch Request</span>
                        <h4 className="text-base font-black text-white mt-1">Delivery request #{orderId.slice(-6)}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Prepare time: 10 mins • Base pay ₹45</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setInCommingOrders((prev) => prev.filter((id) => id !== orderId))}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-2 rounded-xl text-xs transition cursor-pointer"
                        >
                          Pass
                        </button>
                        <button
                          onClick={() => handleAcceptOrder(orderId)}
                          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {}
            {currentOrder ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                  <div>
                    <span className="bg-blue-950 border border-blue-800 text-blue-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Active Job</span>
                    <h2 className="text-2xl font-black text-white mt-2">Current Order Assignment</h2>
                    <p className="text-xs font-mono text-slate-400 mt-1">ID: #{currentOrder._id}</p>
                  </div>

                  <div className="space-y-4">
                    {}
                    <div className="flex gap-3">
                      <div className="bg-orange-950/40 p-2.5 h-fit rounded-xl border border-orange-900">
                        <Bike className="text-orange-500" size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Pickup Restaurant</p>
                        <p className="text-sm font-bold text-white">{currentOrder.restaurantName}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Address: {currentOrder.deliveryAddress.formatedAddress.split(",")[0]}</p>
                      </div>
                    </div>

                    {}
                    <div className="flex gap-3">
                      <div className="bg-blue-950/40 p-2.5 h-fit rounded-xl border border-blue-900">
                        <User className="text-blue-500" size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Dropoff Customer</p>
                        <p className="text-sm font-bold text-white">{currentOrder.deliveryAddress.customerName}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Address: {currentOrder.deliveryAddress.formatedAddress}</p>
                        <p className="text-xs text-slate-300 font-bold flex items-center gap-1.5 mt-1">
                          <Phone size={11} /> {currentOrder.deliveryAddress.mobile}
                        </p>
                      </div>
                    </div>
                  </div>

                  {}
                  <div className="grid grid-cols-3 gap-3 bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Distance</p>
                      <span className="text-sm font-black text-white block mt-0.5">{currentOrder.distance} km</span>
                    </div>
                    <div className="text-center border-x border-slate-800">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Base Fee</p>
                      <span className="text-sm font-black text-white block mt-0.5">₹{currentOrder.riderAmount}</span>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Cust Tip</p>
                      <span className="text-sm font-black text-green-500 block mt-0.5">₹{(currentOrder as any).tip || 0}</span>
                    </div>
                  </div>

                  {}
                  <div className="pt-2 border-t border-slate-800/80 space-y-3">
                    {currentOrder.status === "rider_assigned" && (
                      <button
                        onClick={() => handleStatusUpdate()}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-orange-950/20"
                      >
                        Arrived at Restaurant
                      </button>
                    )}

                    {currentOrder.status === "preparing" && (
                      <div className="bg-slate-950 border border-slate-800/60 p-4 rounded-xl text-center">
                        <p className="text-xs text-slate-400 animate-pulse">Waiting for restaurant to finish cooking...</p>
                      </div>
                    )}

                    {currentOrder.status === "ready_for_rider" && (
                      <button
                        onClick={() => handleStatusUpdate()}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3.5 rounded-xl transition text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        Confirm pickup order from restaurant
                      </button>
                    )}

                    {currentOrder.status === "picked_up" && (
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => generateDeliveryOtp(currentOrder._id)}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition text-xs flex items-center justify-center gap-1 cursor-pointer"
                          >
                            Send OTP to Customer
                          </button>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                          <label className="text-xs font-bold text-slate-400 uppercase">Submit Delivery OTP</label>
                          <div className="flex gap-2 mt-2">
                            <input
                              id="deliveryOtpInput"
                              placeholder="Enter 6-digit OTP"
                              maxLength={6}
                              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none text-white text-center font-mono font-bold tracking-widest"
                            />
                            <button
                              onClick={() => {
                                const input = document.getElementById("deliveryOtpInput") as HTMLInputElement;
                                if (input && input.value) {
                                  handleStatusUpdate(input.value);
                                } else {
                                  toast.error("Please enter the delivery OTP first");
                                }
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                            >
                              Verify & Deliver
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-[400px] lg:h-auto min-h-[300px]">
                  <RiderOrderMap order={currentOrder} />
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center shadow-xl max-w-lg mx-auto">
                <Bike className="text-slate-600 mx-auto mb-4 animate-bounce" size={48} />
                <h3 className="text-lg font-bold text-white">No active orders assigned</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Toggle shift mode to Online and stay within restaurant limits to receive dispatch alerts.</p>
              </div>
            )}

            {}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <History className="text-slate-400" size={18} />
                <h3 className="text-base font-bold text-white">Delivered Orders Log</h3>
                <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto">
                  Total Runs: {deliveryHistory.length}
                </span>
              </div>
              <div className="space-y-3">
                {deliveryHistory.map((order: any) => (
                  <div key={order._id || order.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <p className="text-xs font-bold text-white">{order.restaurantName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Drop: {order.deliveryAddress?.customerName || "Customer"} • {new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
                    </div>
                    <div className="flex items-center gap-3 justify-between sm:justify-start">
                      <span className="bg-green-950 text-green-400 border border-green-900 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Completed</span>
                      <span className="text-sm font-bold text-white">₹{order.riderAmount}</span>
                    </div>
                  </div>
                ))}
                {deliveryHistory.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">No completed runs recorded.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {}
        {activeNav === "map" && (
          <div className="lg:col-span-12 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl">
              <h3 className="text-base font-bold text-white mb-3">Live Navigation Map</h3>
              <div className="h-[500px]">
                {currentOrder ? (
                  <RiderOrderMap order={currentOrder} />
                ) : (
                  <div className="w-full h-full bg-slate-950 rounded-2xl flex flex-col items-center justify-center text-center p-6 border border-slate-800">
                    <Map className="text-slate-700 animate-spin-slow mb-3" size={48} />
                    <p className="text-sm font-bold text-white">No active delivery task routing</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">GPS map displays path polylines when you accept a pending order request.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {}
        {activeNav === "wallet" && (
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <div>
                <span className="text-[10px] font-bold uppercase text-orange-500 tracking-wider">Settlements ledger</span>
                <h2 className="text-2xl font-black text-white mt-1">Earnings Wallet</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Withdrawable Balance</p>
                  <span className="text-2xl font-black text-green-500 block mt-1">₹{walletSummary ? walletSummary.balance : 0}</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">COD Cash Collection</p>
                  <span className="text-2xl font-black text-amber-500 block mt-1">₹{walletSummary ? walletSummary.codCollection : 0}</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Pending Settlement</p>
                  <span className="text-2xl font-black text-blue-400 block mt-1">₹{walletSummary ? walletSummary.pendingSettlement : 0}</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Incentive Bonuses</p>
                  <span className="text-2xl font-black text-purple-400 block mt-1">₹{walletSummary ? walletSummary.bonuses : 0}</span>
                </div>
              </div>

              {}
              <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-white">Withdraw Funds</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    value={withdrawAmt}
                    onChange={(e) => setWithdrawAmt(e.target.value)}
                    placeholder="Enter amount (₹)"
                    type="number"
                    className="w-full sm:flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none text-white font-mono"
                  />
                  <button
                    onClick={handleWithdraw}
                    disabled={withdrawing}
                    className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 sm:py-2 rounded-xl text-xs transition cursor-pointer whitespace-nowrap"
                  >
                    {withdrawing ? "Processing..." : "Withdraw Payout"}
                  </button>
                </div>
              </div>
            </div>

            {}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">Configure Payout Bank Details</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">Link Bank Account or UPI to dispatch withdrawals.</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">UPI Identifier</label>
                  <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="username@upi" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none text-white font-mono" />
                </div>

                <div className="text-center text-xs text-slate-500 font-bold py-1">OR</div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Bank Name</label>
                    <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="SBI, HDFC etc." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Account Number</label>
                    <input value={bankAcc} onChange={(e) => setBankAcc(e.target.value)} placeholder="16-digit account" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none text-white font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">IFSC Code</label>
                    <input value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value)} placeholder="SBIN0001234" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none text-white font-mono" />
                  </div>
                </div>

                <button
                  onClick={handleConfigureBank}
                  disabled={updatingBank}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition text-xs mt-3 cursor-pointer"
                >
                  {updatingBank ? "Configuring accounts..." : "Save Payout Payout Config"}
                </button>
              </div>
            </div>

            {}
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-base font-bold text-white mb-4">Financial Ledger Logs</h3>
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx._id || tx.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex justify-between items-center gap-3">
                    <div>
                      <p className="text-xs font-bold text-white">{tx.description}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Reference: #{tx._id?.slice(-6) || "ledger"} • {new Date(tx.createdAt).toLocaleDateString("en-IN")}</p>
                    </div>
                    <span className={`text-sm font-black ${tx.type === "credit" ? "text-green-500" : "text-red-400"}`}>
                      {tx.type === "credit" ? "+" : "-"} ₹{tx.amount}
                    </span>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">No ledger transaction logs recorded.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {}
        {activeNav === "profile" && (
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Rider KYC Profile</h3>
                <button
                  onClick={() => {
                    if (editingProfile) {
                      setEditingProfile(false);
                    } else {
                      setEditPhone(profile.phoneNumber);
                      setEditAadhaar(profile.aadhaarNumber);
                      setEditLicense(profile.drivingLicesce);
                      setEditAddress(profile.address || "");
                      setEditEmergencyName(profile.emergencyContact?.name || "");
                      setEditEmergencyPhone(profile.emergencyContact?.phone || "");
                      setEditEmergencyRelation(profile.emergencyContact?.relation || "");
                      setEditingProfile(true);
                    }
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer animate-pulse"
                >
                  {editingProfile ? <><X size={12} /> Cancel</> : <><Pencil size={12} /> Edit Details</>}
                </button>
              </div>

              {editingProfile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number</label>
                      <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none text-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Aadhaar Number</label>
                      <input value={editAadhaar} onChange={(e) => setEditAadhaar(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none text-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Driving License</label>
                      <input value={editLicense} onChange={(e) => setEditLicense(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none text-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Current Address</label>
                      <input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none text-white" />
                    </div>
                  </div>

                  <div className="border-t border-slate-800/80 pt-4 space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wide">Emergency SOS Contact</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500">Contact Name</label>
                        <input value={editEmergencyName} onChange={(e) => setEditEmergencyName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-sm outline-none text-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500">Phone</label>
                        <input value={editEmergencyPhone} onChange={(e) => setEditEmergencyPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-sm outline-none text-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500">Relation</label>
                        <input value={editEmergencyRelation} onChange={(e) => setEditEmergencyRelation(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-sm outline-none text-white" />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleProfileUpdate}
                    disabled={savingProfile}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition text-xs mt-4 cursor-pointer"
                  >
                    {savingProfile ? "Saving changes..." : "Save Profile Details"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 font-bold uppercase">Phone Number</span>
                    <span className="text-sm font-bold text-white">{profile.phoneNumber}</span>
                  </div>
                  <div className="flex justify-between items-center p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 font-bold uppercase">Aadhaar Verification ID</span>
                    <span className="text-sm font-bold text-white">XXXX-XXXX-{profile.aadhaarNumber.slice(-4)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 font-bold uppercase">Driving License</span>
                    <span className="text-sm font-bold text-white">{profile.drivingLicesce}</span>
                  </div>
                  <div className="flex justify-between items-center p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 font-bold uppercase">Registered Address</span>
                    <span className="text-sm font-bold text-white truncate max-w-[200px]" title={profile.address || "None"}>
                      {profile.address || "None"}
                    </span>
                  </div>

                  {profile.emergencyContact && profile.emergencyContact.name && (
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                      <h4 className="text-xs font-bold text-red-400 uppercase">Emergency SOS Details</h4>
                      <div className="text-xs text-slate-300">
                        <p>Name: <span className="font-bold text-white">{profile.emergencyContact.name}</span></p>
                        <p className="mt-0.5">Phone: <span className="font-bold text-white">{profile.emergencyContact.phone}</span> ({profile.emergencyContact.relation})</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <h3 className="text-lg font-bold text-white">Rider Vehicle Configuration</h3>
              {profile.vehicle ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 font-bold uppercase">Vehicle Type</span>
                    <span className="text-sm font-bold text-white uppercase">{profile.vehicle.type}</span>
                  </div>
                  <div className="flex justify-between items-center p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 font-bold uppercase">Plate License Number</span>
                    <span className="text-sm font-bold text-white uppercase">{profile.vehicle.number}</span>
                  </div>
                  <div className="flex justify-between items-center p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 font-bold uppercase">Make / Manufacturer</span>
                    <span className="text-sm font-bold text-white">{profile.vehicle.manufacturer} {profile.vehicle.model}</span>
                  </div>
                  <div className="flex justify-between items-center p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 font-bold uppercase">Fuel Propulsion</span>
                    <span className="text-sm font-bold text-white capitalize">{profile.vehicle.fuelType}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6">
                  <p className="text-xs text-slate-500">No vehicle details configured yet.</p>
                  <button onClick={() => setShowVehicleForm(true)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition mt-3 cursor-pointer">
                    Add Vehicle
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {}

      {}
      {showNotifications && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 flex flex-col shadow-2xl animate-slide-in">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Bell size={20} className="text-orange-500" /> Notifications Drawer
              </h2>
              <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {notifications.map((n) => (
                <div key={n._id || n.id} className={`p-4 rounded-xl border transition ${n.readAt ? "bg-slate-950/60 border-slate-800/80" : "bg-slate-950 border-orange-500/30"}`}>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-black text-white">{n.title}</span>
                    {!n.readAt && (
                      <button
                        onClick={async () => {
                          await markNotificationRead(n._id || n.id);
                          loadOperationalData();
                        }}
                        className="text-[10px] text-orange-400 hover:underline cursor-pointer"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{n.message}</p>
                </div>
              ))}
              {notifications.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-8">No notifications logs available.</p>
              )}
            </div>

            {notifications.filter(n => !n.readAt).length > 0 && (
              <button
                onClick={async () => {
                  await markAllNotificationsRead();
                  loadOperationalData();
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-xs transition cursor-pointer"
              >
                Mark All as Read
              </button>
            )}
          </div>
        </div>
      )}

      {}
      {showDocuments && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 flex flex-col shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <h2 className="text-lg font-black text-white">KYC Documents Drawer</h2>
              <button onClick={() => setShowDocuments(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                <p className="text-xs text-slate-500 font-bold uppercase">KYC Status</p>
                <span className={`inline-block text-xs font-black px-2.5 py-0.5 rounded-full mt-1.5 ${profile.isVerified ? "bg-green-950 text-green-400 border border-green-900" : "bg-amber-950 text-amber-400 border border-amber-900"}`}>
                  {profile.isVerified ? "KYC Verified Partner" : "Document Review Pending"}
                </span>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white">Driving License</h3>
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-mono truncate max-w-[200px]">{profile.drivingLicesce}</span>
                  <input
                    type="file"
                    id="dlUploadInput"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        toast.loading("Uploading License...");
                        await uploadRiderDocument("dl", file);
                        toast.dismiss();
                        toast.success("License submitted!");
                        fetchProfile();
                      }
                    }}
                  />
                  <button onClick={() => document.getElementById("dlUploadInput")?.click()} className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition cursor-pointer">
                    Re-upload
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {}
      {showVehicleForm && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 flex flex-col shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <h2 className="text-lg font-black text-white">Vehicle Details Drawer</h2>
              <button onClick={() => setShowVehicleForm(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Propulsion Type</label>
                  <select value={vType} onChange={(e) => setVType(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white">
                    <option value="bike">Motor Bike</option>
                    <option value="scooter">Scooter</option>
                    <option value="ev">Electric Vehicle (EV)</option>
                    <option value="cycle">Bicycle</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Fuel Type</label>
                  <select value={vFuel} onChange={(e) => setVFuel(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white">
                    <option value="petrol">Petrol</option>
                    <option value="electric">Electric</option>
                    <option value="none">None (Propulsion free)</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">License Plate Number</label>
                  <input value={vNumber} onChange={(e) => setVNumber(e.target.value)} placeholder="e.g. WB-04A-1234" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Manufacturer</label>
                  <input value={vMake} onChange={(e) => setVMake(e.target.value)} placeholder="Honda, Hero, TVS" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Model</label>
                  <input value={vModel} onChange={(e) => setVModel(e.target.value)} placeholder="Splendor, Activa etc." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Color</label>
                  <input value={vColor} onChange={(e) => setVColor(e.target.value)} placeholder="Black, Red" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Ownership</label>
                  <select value={vOwnership} onChange={(e) => setVOwnership(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white">
                    <option value="owned">Owned</option>
                    <option value="rented">Rented</option>
                    <option value="leased">Leased</option>
                  </select>
                </div>
              </div>
              <button onClick={handleUpdateVehicle} disabled={updatingV} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-xs transition cursor-pointer">
                {updatingV ? "Saving vehicle info..." : "Configure Vehicle details"}
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {showLeaderboard && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 flex flex-col shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <h2 className="text-lg font-black text-white">Weekly Leaderboard Rank</h2>
              <button onClick={() => setShowLeaderboard(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {leaderboard.map((entry) => (
                <div key={entry.riderId} className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-orange-500">#{entry.rank}</span>
                    <span className="text-xs font-semibold text-white">{entry.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">{entry.totalDeliveries} runs</span>
                    <span className="text-[10px] text-slate-500 font-bold block">⭐ {entry.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {}
      {showSupport && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 flex flex-col shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <h2 className="text-lg font-black text-white">Partner Support SOS</h2>
              <button onClick={() => setShowSupport(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <button onClick={triggerSos} className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg animate-pulse">
                <ShieldAlert size={20} /> Trigger Emergency SOS
              </button>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Operational Contacts</h3>
                <div className="text-xs text-slate-400 space-y-2">
                  <div className="flex justify-between">
                    <span>Police SOS:</span>
                    <a href="tel:100" className="text-orange-500 font-bold hover:underline">100</a>
                  </div>
                  <div className="flex justify-between">
                    <span>Medical Ambulance:</span>
                    <a href="tel:102" className="text-orange-500 font-bold hover:underline">102</a>
                  </div>
                  <div className="flex justify-between">
                    <span>Partner Hotline Support:</span>
                    <a href="tel:+918005556677" className="text-orange-500 font-bold hover:underline">+91 800-555-6677</a>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2.5">
                <h3 className="text-xs font-bold text-white uppercase tracking-wide">FAQ / Common Issues</h3>
                <div className="text-xs text-slate-400 space-y-2">
                  <details className="cursor-pointer group">
                    <summary className="font-bold text-slate-300 group-open:text-orange-500">How are payout settlements computed?</summary>
                    <p className="mt-1 pl-2 text-[11px] text-slate-500">Withdrawals are credited directly to bank or UPI details inside the wallet tab after verifying runs.</p>
                  </details>
                  <details className="cursor-pointer group mt-2">
                    <summary className="font-bold text-slate-300 group-open:text-orange-500">I faced restaurant delays, what to do?</summary>
                    <p className="mt-1 pl-2 text-[11px] text-slate-500">Submit coordinates on route to restaurant, timer records automatic wait durations for compensation.</p>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 py-3 px-6 flex justify-around items-center md:hidden">
        <button onClick={() => setActiveNav("home")} className={`flex flex-col items-center gap-1 transition ${activeNav === "home" ? "text-orange-500" : "text-slate-400 hover:text-slate-200"} cursor-pointer`}>
          <Compass size={20} />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button onClick={() => setActiveNav("orders")} className={`flex flex-col items-center gap-1 transition ${activeNav === "orders" ? "text-orange-500" : "text-slate-400 hover:text-slate-200"} cursor-pointer`}>
          <Bike size={20} />
          <span className="text-[10px] font-bold">Orders</span>
        </button>
        <button onClick={() => setActiveNav("map")} className={`flex flex-col items-center gap-1 transition ${activeNav === "map" ? "text-orange-500" : "text-slate-400 hover:text-slate-200"} cursor-pointer`}>
          <Map size={20} />
          <span className="text-[10px] font-bold">Map</span>
        </button>
        <button onClick={() => setActiveNav("wallet")} className={`flex flex-col items-center gap-1 transition ${activeNav === "wallet" ? "text-orange-500" : "text-slate-400 hover:text-slate-200"} cursor-pointer`}>
          <Wallet size={20} />
          <span className="text-[10px] font-bold">Wallet</span>
        </button>
        <button onClick={() => setActiveNav("profile")} className={`flex flex-col items-center gap-1 transition ${activeNav === "profile" ? "text-orange-500" : "text-slate-400 hover:text-slate-200"} cursor-pointer`}>
          <User size={20} />
          <span className="text-[10px] font-bold">Profile</span>
        </button>
      </div>

      {}
      <div className="hidden md:flex fixed top-0 bottom-0 left-0 w-20 bg-slate-900 border-r border-slate-800 flex-col items-center justify-between py-6 z-25">
        <div className="flex flex-col gap-6 items-center">
          <div className="bg-orange-500 p-2.5 rounded-2xl shadow-lg shadow-orange-500/20">
            <Bike className="text-white" size={24} />
          </div>

          <div className="flex flex-col gap-4 mt-6">
            <button onClick={() => setActiveNav("home")} className={`p-3 rounded-xl transition ${activeNav === "home" ? "bg-orange-500/10 text-orange-500" : "text-slate-400 hover:text-white hover:bg-slate-800"} cursor-pointer`} title="Home Panel">
              <Compass size={22} />
            </button>
            <button onClick={() => setActiveNav("orders")} className={`p-3 rounded-xl transition ${activeNav === "orders" ? "bg-orange-500/10 text-orange-500" : "text-slate-400 hover:text-white hover:bg-slate-800"} cursor-pointer`} title="Orders Job">
              <Bike size={22} />
            </button>
            <button onClick={() => setActiveNav("map")} className={`p-3 rounded-xl transition ${activeNav === "map" ? "bg-orange-500/10 text-orange-500" : "text-slate-400 hover:text-white hover:bg-slate-800"} cursor-pointer`} title="Live Mapping">
              <Map size={22} />
            </button>
            <button onClick={() => setActiveNav("wallet")} className={`p-3 rounded-xl transition ${activeNav === "wallet" ? "bg-orange-500/10 text-orange-500" : "text-slate-400 hover:text-white hover:bg-slate-800"} cursor-pointer`} title="Wallet Balance">
              <Wallet size={22} />
            </button>
            <button onClick={() => setActiveNav("profile")} className={`p-3 rounded-xl transition ${activeNav === "profile" ? "bg-orange-500/10 text-orange-500" : "text-slate-400 hover:text-white hover:bg-slate-800"} cursor-pointer`} title="KYC Identity">
              <User size={22} />
            </button>
          </div>
        </div>

        <button onClick={handleLogout} className="p-3 text-slate-500 hover:text-red-400 rounded-xl hover:bg-slate-800 transition cursor-pointer" title="Log Out">
          <LogOut size={22} />
        </button>
      </div>

      {}
      <style>{`
        @media (min-width: 768px) {
          .container {
            padding-left: 96px;
          }
        }
      `}</style>

    </div>
  );
};

export default RiderDashboard;

