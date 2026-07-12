import { useEffect, useRef, useState } from "react";
import type { IRestaurant } from "../../types/types";
import { updateRestaurantStatus, updateRestaurant } from "../../utils/restaurant.api";
import toast from "react-hot-toast";
import { BiMapPin } from "react-icons/bi";
import { Edit, SaveAll, ImagePlus, MapPin } from "lucide-react";
import { useAppData } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import { storage } from "../../utils/secureStorage";
import { compressImage } from "../../utils/compressImage";
import EditLocationModal from "./EditLocationModal";

interface props {
      restaurant: IRestaurant;
      isSeller: boolean;
      onUpdate: (restaurant: IRestaurant) => void;
      fetchMyRestaurant: () => Promise<void>
};

const RestaurantProfile = ({ restaurant, isSeller, onUpdate, fetchMyRestaurant }: props) => {

      const [editMode, setEditMode] = useState(false);
      const [showLocationModal, setShowLocationModal] = useState(false);
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
                  const data = await updateRestaurantStatus(!isOpen);
                  setIsOpen(data.data.isOpen);
                  toast.success(data.message || "Status updated");
                  fetchMyRestaurant();
            } catch (err: any) {
                  console.error(err);
                  toast.error(err.message || "Failed to update status");
            }
      };

      const saveChanges = async () => {
            try {
                  setLoading(true);
                  const data = await updateRestaurant({
                        name: name,
                        description: description,
                        image: imageFile ? await compressImage(imageFile) : undefined
                  });
                  onUpdate(data.data);
                  toast.success(data.message || "Profile updated");
                  setImageFile(null);
                  setImagePreview(null);
                  fetchMyRestaurant();
            } catch (err: any) {
                  console.error(err);
                  toast.error(err.message || "Failed to update profile");
            } finally {
                  setLoading(false);
                  setEditMode(false);
            }
      };

      const { setIsAuth, setUser } = useAppData();
      const navigate = useNavigate();

      const logoutHandler = () => {
            updateRestaurantStatus(false).catch((err) => console.error("Failed to close restaurant", err));
            storage.removeToken();
            setIsAuth(false);
            setUser(null);
            navigate("/login");
            toast.success("Logout Successfull");
      }

      return (
            <div className="w-full bg-white rounded-b-2xl shadow-md overflow-hidden">
                  <div className="relative">
                        <div className={`h-64 bg-linear-to-r from-primary/20 to-orange-100 overflow-hidden ${!restaurant.isOpen && "grayscale brightness-75 opacity-80"}`}>
                              {(imagePreview || restaurant.image) && (
                                    <img src={imagePreview ?? restaurant.image} alt={restaurant.name} className="w-full h-full object-cover object-center" />
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
                                    <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
                                          <BiMapPin size={16} className="text-primary shrink-0" />
                                          <span className="font-medium text-gray-800">{restaurant?.location?.address || restaurant?.autoLocation?.formattedAddress || "Location unavailable"}</span>
                                    </div>
                                    <div className="mt-1 text-xs text-gray-400 pl-5 space-y-0.5">
                                          <p>Coordinates: {restaurant?.location?.latitude || restaurant?.autoLocation?.coordinates[1]}, {restaurant?.location?.longitude || restaurant?.autoLocation?.coordinates[0]}</p>
                                          {restaurant?.location?.deliveryRadius && (
                                                <p>Delivery Radius: {(restaurant.location.deliveryRadius / 1000).toFixed(1)} km</p>
                                          )}
                                    </div>

                                    {/* Verification & Pending Status Badges */}
                                    <div className="mt-2.5 flex flex-wrap items-center gap-2 pl-5">
                                          {restaurant.isVerified ? (
                                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-green-100 text-green-700 border border-green-200">
                                                      Verified Restaurant
                                                </span>
                                          ) : (
                                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-yellow-100 text-yellow-700 border border-yellow-200">
                                                      Pending Admin Verification
                                                </span>
                                          )}

                                          {restaurant.locationReviewStatus === "PENDING" && (
                                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-red-100 text-red-700 border border-red-200 animate-pulse">
                                                      Location Review Pending
                                                </span>
                                          )}
                                    </div>

                                    {/* Proposed Pending Location details */}
                                    {restaurant.locationReviewStatus === "PENDING" && restaurant.pendingLocation && (
                                          <div className="mt-3 p-3 bg-red-50/50 rounded-xl border border-red-100/50 pl-5 text-xs text-red-800 space-y-1 max-w-md">
                                                <p className="font-semibold text-red-700">Proposed Location (Under Review):</p>
                                                <p>{restaurant.pendingLocation.address}</p>
                                                <p className="text-[11px] text-gray-500">Coordinates: {restaurant.pendingLocation.latitude}, {restaurant.pendingLocation.longitude} | Radius: {(restaurant.pendingLocation.deliveryRadius / 1000).toFixed(1)} km</p>
                                                <p className="text-[11px] text-red-600 italic mt-0.5">A location update is already pending review. Editing is locked.</p>
                                          </div>
                                    )}

                                    {/* Edit Location Button */}
                                    {isSeller && (
                                          <div className="mt-3 pl-5">
                                                <button
                                                      type="button"
                                                      onClick={() => setShowLocationModal(true)}
                                                      disabled={restaurant.locationReviewStatus === "PENDING"}
                                                      className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 rounded-lg shadow-xs hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                                                >
                                                      <MapPin size={13} className="text-primary" />
                                                      Edit Location
                                                </button>
                                          </div>
                                    )}
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

                  {showLocationModal && (
                        <EditLocationModal
                              isOpen={showLocationModal}
                              onClose={() => setShowLocationModal(false)}
                              restaurant={restaurant}
                              onLocationUpdated={(updatedRest) => {
                                    onUpdate(updatedRest);
                                    fetchMyRestaurant();
                              }}
                        />
                  )}
            </div>
      );
};

export default RestaurantProfile;
