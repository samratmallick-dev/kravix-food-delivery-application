import { useEffect, useRef, useState } from "react";
import type { IRestaurant } from "../../types/types";
import axios from "axios";
import { restaurantBaseUrl } from "../common/constant";
import toast from "react-hot-toast";
import { BiMapPin } from "react-icons/bi";
import { Edit, SaveAll, ImagePlus } from "lucide-react";
import { useAppData } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import { storage } from "../../utils/secureStorage";

interface props {
      restaurant: IRestaurant;
      isSeller: boolean;
      onUpdate: (restaurant: IRestaurant) => void;
      fetchMyRestaurant: () => Promise<void>
};

const RestaurantProfile = ({ restaurant, isSeller, onUpdate, fetchMyRestaurant }: props) => {

      const [editMode, setEditMode] = useState(false);
      const [name, setName] = useState(restaurant.name);
      const [description, setDescription] = useState(restaurant.description);
      const [isOpen, setIsOpen] = useState(restaurant.isOpen);
      const [loading, setLoading] = useState(false);
      const [imageFile, setImageFile] = useState<File | null>(null);
      const [imagePreview, setImagePreview] = useState<string | null>(null);
      const fileInputRef = useRef<HTMLInputElement>(null);

      useEffect(() => {
            setIsOpen(restaurant.isOpen);
      }, [restaurant.isOpen]);

      const toggleOpenStatus = async () => {
            try {
                  const { data } = await axios.patch(`${restaurantBaseUrl}/me/status`, { status: !isOpen },
                        {
                              headers: {
                                    Authorization: `Bearer ${storage.getToken()}`
                              },
                              withCredentials: true
                        }
                  );
                  toast.success(data.message);
                  setIsOpen(data.data.isOpen);
                  fetchMyRestaurant();
            } catch (error: any) {
                  console.log(error);
                  toast.error(error instanceof Error ? error.message : error.response.data.message);
            }
      };

      const saveChanges = async () => {
            try {
                  setLoading(true);
                  const formData = new FormData();
                  formData.append("name", name);
                  formData.append("description", description);
                  if (imageFile) formData.append("file", imageFile);
                  const { data } = await axios.patch(`${restaurantBaseUrl}/me`, formData, {
                        headers: {
                              Authorization: `Bearer ${storage.getToken()}`,
                              "Content-Type": "multipart/form-data",
                        },
                        withCredentials: true
                  });
                  onUpdate(data.data);
                  toast.success(data.message);
                  setImageFile(null);
                  setImagePreview(null);
                  fetchMyRestaurant();
            } catch (error: any) {
                  console.log(error);
                  toast.error(error instanceof Error ? error.message : (error.response.data.message || "Failed to update restaurant"));
            } finally {
                  setLoading(false);
                  setEditMode(false);
            }
      };

      const { setIsAuth, setUser } = useAppData();
      const navigate = useNavigate();

      const logoutHandler = () => {
            const token = storage.getToken();
            axios.patch(`${restaurantBaseUrl}/me/status`, { status: false }, {
                  headers: { Authorization: `Bearer ${token}` },
                  withCredentials: true
            }).catch(() => {});
            storage.removeToken();
            setIsAuth(false);
            setUser(null);
            navigate("/login");
            toast.success("Logout Successfull");
      }

      return (
            <div className="w-full bg-white rounded-b-2xl shadow-md overflow-hidden">
                  <div className="relative">
                        <div className={`h-56 bg-linear-to-r from-primary/20 to-orange-100 overflow-hidden ${!restaurant.isOpen && "grayscale brightness-75 opacity-80"}`}>
                              {(imagePreview || restaurant.image) && (
                                    <img src={imagePreview ?? restaurant.image} alt={restaurant.name} className="w-full h-full object-fill object-center" />
                              )}
                        </div>
                        {editMode && (
                              <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition cursor-pointer"
                              >
                                    <div className="flex flex-col items-center gap-1 text-white">
                                          <ImagePlus size={28} />
                                          <span className="text-xs font-medium">Change Image</span>
                                    </div>
                              </button>
                        )}
                        <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                    const file = e.target.files?.[0] ?? null;
                                    setImageFile(file);
                                    setImagePreview(file ? URL.createObjectURL(file) : null);
                              }}
                        />
                        <span className={`absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full shadow ${
                              isOpen ? "bg-green-500 text-white" : "bg-red-500 text-white"
                        }`}>
                              {isOpen ? "● OPEN" : "● CLOSED"}
                        </span>
                  </div>

                  <div className="p-5 sm:p-6 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                    {editMode ? (
                                          <input
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full text-lg font-bold border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
                                          />
                                    ) : (
                                          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">{restaurant.name}</h2>
                                    )}
                                    <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                                          <BiMapPin size={16} className="text-primary shrink-0" />
                                          <span className="truncate">{restaurant?.autoLocation?.formattedAddress || "Location unavailable"}</span>
                                    </div>
                              </div>
                              {isSeller && (
                                    <button
                                          onClick={() => setEditMode(!editMode)}
                                          className={`p-2 rounded-lg border transition ${
                                                editMode ? "border-primary text-primary bg-primary/10" : "border-gray-200 text-gray-500 hover:text-primary hover:border-primary"
                                          }`}
                                    >
                                          <Edit size={16} />
                                    </button>
                              )}
                        </div>

                        {editMode ? (
                              <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
                                    placeholder="Add your restaurant description"
                              />
                        ) : (
                              <p className="text-gray-600 text-sm leading-relaxed">{restaurant.description || "No description added"}</p>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
                              <p className="text-xs text-gray-400">
                                    Since {new Date(restaurant.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                              </p>
                              <div className="flex items-center gap-2">
                                    {editMode && (
                                          <button
                                                className="flex items-center gap-1.5 rounded-lg bg-primary text-white px-4 py-1.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-60 cursor-pointer transition"
                                                onClick={saveChanges}
                                                disabled={loading}
                                          >
                                                <SaveAll size={15} /> {loading ? "Saving..." : "Save"}
                                          </button>
                                    )}
                                    {isSeller && (
                                          <button
                                                onClick={toggleOpenStatus}
                                                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition ${
                                                      isOpen ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" : "bg-green-50 text-green-600 border border-green-200 hover:bg-green-100"
                                                }`}
                                          >
                                                {isOpen ? "Close Restaurant" : "Open Restaurant"}
                                          </button>
                                    )}
                                    {(isSeller)  && (
                                          <button
                                                onClick={logoutHandler}
                                                className="px-4 py-1.5 text-sm font-medium rounded-lg transition bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                                          >
                                                Logout
                                          </button>
                                    )}
                              </div>
                        </div>
                  </div>
            </div>
      );
};

export default RestaurantProfile;
