import { useEffect, useState } from "react";
import { useAppData } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import type { IRider } from "../types/types";
import axios from "axios";
import { riderBaseUrl } from "../components/common/constant";
import toast from "react-hot-toast";
import { ImagePlus, Loader2, Phone, MapPin, CreditCard, FileText, Bike } from "lucide-react";

const RiderDashboard = () => {
      const { user, location, locationLoading } = useAppData();
      const { socket } = useSocket();

      const [profile, setProfile] = useState<IRider | null>(null);
      const [loading, setLoading] = useState(true);
      const [toggling, setToggling] = useState(false);
      const [phoneNumber, setPhoneNumber] = useState("");
      const [aadhaarNumber, setAadhaarNumber] = useState("");
      const [drivingLicesce, setDrivingLicesce] = useState("");
      const [image, setImage] = useState<File | null>(null);
      const [preview, setPreview] = useState<string | null>(null);
      const [submitting, setSubmitting] = useState(false);

      const fetchProfile = async () => {
            try {
                  const { data } = await axios.get(`${riderBaseUrl}/fetch-profile`, {
                        headers: {
                              Authorization: `Bearer ${localStorage.getItem("token")}`
                        },
                        withCredentials: true
                  });

                  setProfile(data.data || null);
            } catch (error) {
                  console.log(error);
                  setProfile(null);
            } finally {
                  setLoading(false);
            }
      };

      useEffect(() => {
            if (user?.role === "rider") {
                  fetchProfile();
            }
      }, [user]);

      const toggleAvailability = () => {
            if (!navigator.geolocation) {
                  toast.error("Geolocation is not supported by your browser.");
                  return;
            }

            setToggling(true);

            navigator.geolocation.getCurrentPosition(
                  async (position) => {
                        try {
                              const { data } = await axios.patch(`${riderBaseUrl}/toggle-profile`, {
                                    isAvailable: !profile?.isAvailable,
                                    latitude: position.coords.latitude,
                                    longitude: position.coords.longitude,
                              }, {
                                    headers: {
                                          Authorization: `Bearer ${localStorage.getItem("token")}`
                                    },
                                    withCredentials: true
                              });
                              toast.success(data.message);
                              fetchProfile();
                        } catch (error: any) {
                              toast.error(error.response?.data?.message || "Failed to update availability.");
                        } finally {
                              setToggling(false);
                        }
                  },
                  () => {
                        toast.error("Unable to retrieve your location.");
                        setToggling(false);
                  }
            );
      };

      if (user?.role !== "rider") {
            return <div className="flex items-center justify-center min-h-[60vh] text-gray-700 text-2xl font-bold break-all">You are not authorized to view this page.</div>;
      }

      if (loading) {
            return <div className="flex items-center justify-center min-h-[60vh] text-gray-700 text-2xl font-bold">Loading rider details...</div>;
      }

      const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0] ?? null;
            setImage(file);
            setPreview(file ? URL.createObjectURL(file) : null);
      };

      const handleSubmit = async () => {
            if (!location) {
                  toast.error("Location data is required.");
                  return;
            }
            if (!phoneNumber || !aadhaarNumber || !drivingLicesce || !image) {
                  toast.error("Please fill in all required fields.");
                  return;
            }
            const formData = new FormData();
            formData.append("phoneNumber", phoneNumber);
            formData.append("aadhaarNumber", aadhaarNumber);
            formData.append("drivingLicesce", drivingLicesce);
            formData.append("file", image);
            formData.append("latitude", String(location.latitude));
            formData.append("longitude", String(location.longitude));
            try {
                  setSubmitting(true);
                  const { data } = await axios.post(`${riderBaseUrl}/add-profile`, formData, {
                        headers: {
                              Authorization: `Bearer ${localStorage.getItem("token")}`
                        },
                        withCredentials: true
                  });
                  if (data.success) {
                        toast.success(data.message || "Rider profile created successfully.");
                        fetchProfile();
                  } else {
                        toast.error(data.message || "Failed to create profile.");
                  }
            } catch (error: any) {
                  toast.error(error.response?.data?.message || "An error occurred.");
            } finally {
                  setSubmitting(false);
            }
      };

      if (!profile) return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
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
                                    <div className={`relative w-full h-44 rounded-xl border-2 border-dashed transition-colors duration-200 overflow-hidden flex items-center justify-center ${preview ? "border-primary" : "border-gray-300 hover:border-primary"
                                          }`}>
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
                                          <input
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                                placeholder="+91-9999999999"
                                                className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
                                          />
                                    </div>
                              </div>

                              <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Aadhaar Number <span className="text-primary">*</span></label>
                                    <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2.5 focus-within:border-primary transition-colors">
                                          <CreditCard size={16} className="text-gray-400 shrink-0" />
                                          <input
                                                value={aadhaarNumber}
                                                onChange={(e) => setAadhaarNumber(e.target.value)}
                                                placeholder="XXXX-XXXX-XXXX"
                                                className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
                                          />
                                    </div>
                              </div>

                              <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Driving License <span className="text-primary">*</span></label>
                                    <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2.5 focus-within:border-primary transition-colors">
                                          <FileText size={16} className="text-gray-400 shrink-0" />
                                          <input
                                                value={drivingLicesce}
                                                onChange={(e) => setDrivingLicesce(e.target.value)}
                                                placeholder="e.g. WB-0420110012345"
                                                className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
                                          />
                                    </div>
                              </div>

                              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                                    <MapPin size={16} className="text-primary shrink-0" />
                                    <span className="text-sm text-gray-600 truncate">
                                          {locationLoading
                                                ? "Detecting location..."
                                                : location?.formattedAddress ?? "Location not available"}
                                    </span>
                              </div>

                              <button
                                    onClick={handleSubmit}
                                    disabled={submitting || locationLoading}
                                    className="w-full bg-primary hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer"
                              >
                                    {submitting ? (
                                          <><Loader2 size={18} className="animate-spin" /> Creating Profile...</>
                                    ) : (
                                          <><Bike size={18} /> Add Rider Profile</>
                                    )}
                              </button>

                        </div>
                  </div>
            </div>
      )

      return (
            <div>RiderDashboard</div>
      );
}

export default RiderDashboard;
