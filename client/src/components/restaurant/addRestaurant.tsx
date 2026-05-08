import { useState } from "react";
import { useAppData } from "../../context/AppContext";
import toast from "react-hot-toast";
import axios from "axios";
import { restaurantBaseUrl } from "../common/constant";
import { ImagePlus, Loader2, MapPin, Phone, Store, FileText } from "lucide-react";

interface props {
      fetchMyRestaurant: () => Promise<void>;
};

const AddRestaurant = ({fetchMyRestaurant}: props) => {

      const [name, setName] = useState("");
      const [description, setDescription] = useState("");
      const [phone, setPhone] = useState("");
      const [image, setImage] = useState<File | null>(null);
      const [submitting, setSubmitting] = useState(false);

      const { location, locationLoading } = useAppData();

      const handlesubmitting = async () => {
            if (!location) {
                  toast.error("Location data is required to add a restaurant.");
                  return;
            }

            if([name, phone, image].some((field)=> !field || field === "")) {
                  toast.error("Please fill in all required fields.");
                  return;
            }

            const formData = new FormData();

            formData.append("name", name);
            formData.append("description", description);
            formData.append("phone", phone);
            if (image) formData.append("file", image);
            formData.append("latitude", String(location.latitude));
            formData.append("longitude", String(location.longitude));
            formData.append("formattedAddress", String(location.formattedAddress));

            try {
                  setSubmitting(true);
                  const token = localStorage.getItem("token");
                  const response = await axios.post(`${restaurantBaseUrl}`, formData, {
                        headers: {
                              "Content-Type": "multipart/form-data",
                              Authorization: `Bearer ${token}`
                        },
                        withCredentials: true
                  });
                  if (response.data.success) {
                        if (response.data.token) {
                              localStorage.setItem("token", response.data.token);
                        }
                        toast.success(response.data.message || "Restaurant added successfully.");
                        fetchMyRestaurant();
                  } else {
                        toast.error(response.data.message || "Failed to add restaurant.");
                  }
            } catch (error: any) {
                  const message = error.response?.data?.message;
                  console.log(message);
                  
                  toast.error(message || "An error occurred while adding the restaurant.");
            } finally {
                  setSubmitting(false);
            }
      }

      const [preview, setPreview] = useState<string | null>(null);

      const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0] ?? null;
            setImage(file);
            setPreview(file ? URL.createObjectURL(file) : null);
      };

      return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
                  <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg overflow-hidden">

                        <div className="bg-primary px-8 py-6">
                              <div className="flex items-center gap-3">
                                    <Store className="text-white" size={28} />
                                    <div>
                                          <h1 className="text-white text-xl font-bold">Add Restaurant</h1>
                                          <p className="text-red-200 text-sm">Fill in the details to list your restaurant</p>
                                    </div>
                              </div>
                        </div>

                        <div className="px-8 py-6 space-y-5">

                              <label className="block cursor-pointer group">
                                    <div className={`relative w-full h-44 rounded-xl border-2 border-dashed transition-colors duration-200 overflow-hidden flex items-center justify-center ${
                                          preview ? "border-primary" : "border-gray-300 hover:border-primary"
                                    }`}>
                                          {preview ? (
                                                <img src={preview} alt="preview" className="w-full h-full object-cover" />
                                          ) : (
                                                <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-primary transition-colors">
                                                      <ImagePlus size={36} />
                                                      <span className="text-sm font-medium">Click to upload restaurant image</span>
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
                                    <label className="text-sm font-medium text-gray-700">Restaurant Name <span className="text-primary">*</span></label>
                                    <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2.5 focus-within:border-primary transition-colors">
                                          <Store size={16} className="text-gray-400 shrink-0" />
                                          <input
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="e.g. Spice Garden"
                                                className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
                                          />
                                    </div>
                              </div>

                              <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Phone Number <span className="text-primary">*</span></label>
                                    <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2.5 focus-within:border-primary transition-colors">
                                          <Phone size={16} className="text-gray-400 shrink-0" />
                                          <input
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                placeholder="+91-9999999999"
                                                className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
                                          />
                                    </div>
                              </div>

                              <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Description</label>
                                    <div className="flex gap-2 border border-gray-300 rounded-lg px-3 py-2.5 focus-within:border-primary transition-colors">
                                          <FileText size={16} className="text-gray-400 shrink-0 mt-0.5" />
                                          <textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Brief description of your restaurant..."
                                                rows={3}
                                                className="flex-1 outline-none text-sm text-gray-700 bg-transparent resize-none"
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
                                    onClick={handlesubmitting}
                                    disabled={submitting || locationLoading}
                                    className="w-full bg-primary hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer"
                              >
                                    {submitting ? (
                                          <><Loader2 size={18} className="animate-spin" /> Adding Restaurant...</>
                                    ) : (
                                          <><Store size={18} /> Add Restaurant</>
                                    )}
                              </button>

                        </div>
                  </div>
            </div>
      );
};

export default AddRestaurant;
