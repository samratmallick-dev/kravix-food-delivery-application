import "leaflet/dist/leaflet.css";
import {
      MapContainer,
      TileLayer,
      Marker,
      useMapEvents,
      useMap,
} from "react-leaflet";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import L from "leaflet";
import { LuLocateFixed } from "react-icons/lu";
import { BiLoader, BiMapPin, BiSearch } from "react-icons/bi";
import { X } from "lucide-react";
import type { IRestaurant } from "../../types/types";
import { updateRestaurantLocation } from "../../utils/restaurant.api";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const LocationPicker = ({ setLocation }: { setLocation: (lat: number, lng: number) => void }) => {
      useMapEvents({
            click(e) {
                  setLocation(e.latlng.lat, e.latlng.lng);
            },
      });
      return null;
};

const MapFlyTo = ({ lat, lng }: { lat: number; lng: number }) => {
      const map = useMap();
      useEffect(() => {
            map.flyTo([lat, lng], 16, { animate: true });
      }, [lat, lng]);
      return null;
};

const LocateMeButton = ({ onLocate }: { onLocate: (lat: number, lng: number) => void }) => {
      const map = useMap();
      const locateUser = () => {
            if (!navigator.geolocation) {
                  toast.error("Geolocation not supported");
                  return;
            }
            navigator.geolocation.getCurrentPosition(
                  (pos) => {
                        const { latitude, longitude } = pos.coords;
                        map.flyTo([latitude, longitude], 16, { animate: true });
                        onLocate(latitude, longitude);
                  },
                  () => toast.error("Location permission denied")
            );
      };
      return (
            <button
                  type="button"
                  onClick={locateUser}
                  className="absolute right-3 top-3 z-[1000] flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow hover:bg-gray-100 cursor-pointer"
            >
                  <LuLocateFixed size={16} />
                  Use current location
            </button>
      );
};

interface EditLocationModalProps {
      isOpen: boolean;
      onClose: () => void;
      restaurant: IRestaurant;
      onLocationUpdated: (updatedRest: IRestaurant) => void;
}

const EditLocationModal = ({ isOpen, onClose, restaurant, onLocationUpdated }: EditLocationModalProps) => {
      const initialLat = restaurant.location?.latitude || restaurant.autoLocation?.coordinates[1] || 28.6139;
      const initialLng = restaurant.location?.longitude || restaurant.autoLocation?.coordinates[0] || 77.209;
      const initialAddress = restaurant.location?.address || restaurant.autoLocation?.formattedAddress || "";
      const initialCity = restaurant.location?.city || "";
      const initialState = restaurant.location?.state || "";
      const initialCountry = restaurant.location?.country || "";
      const initialPincode = restaurant.location?.pincode || "";
      const initialLandmark = restaurant.location?.landmark || "";
      const initialRadius = restaurant.location?.deliveryRadius || 5000;

      const [address, setAddress] = useState(initialAddress);
      const [city, setCity] = useState(initialCity);
      const [state, setState] = useState(initialState);
      const [country, setCountry] = useState(initialCountry);
      const [pincode, setPincode] = useState(initialPincode);
      const [landmark, setLandmark] = useState(initialLandmark);
      const [deliveryRadius, setDeliveryRadius] = useState<number>(initialRadius);
      const [latitude, setLatitude] = useState<number>(initialLat);
      const [longitude, setLongitude] = useState<number>(initialLng);

      const [searchQuery, setSearchQuery] = useState("");
      const [searchResults, setSearchResults] = useState<any[]>([]);
      const [searching, setSearching] = useState(false);
      const [saving, setSaving] = useState(false);
      const [showConfirmClose, setShowConfirmClose] = useState(false);

      const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

      const fetchFormattedAddress = async (lat: number, lng: number) => {
            try {
                  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                  const data = await res.json();
                  if (data) {
                        setAddress(data.display_name || "");
                        const addr = data.address || {};
                        setCity(addr.city || addr.town || addr.village || addr.suburb || "");
                        setState(addr.state || "");
                        setCountry(addr.country || "");
                        setPincode(addr.postcode || "");
                  }
            } catch {
                  toast.error("Failed to fetch address details");
            }
      };

      const setLocation = (lat: number, lng: number) => {
            setLatitude(lat);
            setLongitude(lng);
            fetchFormattedAddress(lat, lng);
      };

      const handleSearch = (query: string) => {
            setSearchQuery(query);
            setSearchResults([]);
            if (!query.trim()) return;
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
            searchTimeout.current = setTimeout(async () => {
                  setSearching(true);
                  try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
                        const data = await res.json();
                        setSearchResults(data);
                  } catch {
                        toast.error("Search failed");
                  } finally {
                        setSearching(false);
                  }
            }, 500);
      };

      const selectSearchResult = (result: any) => {
            setLocation(parseFloat(result.lat), parseFloat(result.lon));
            setSearchQuery(result.display_name);
            setSearchResults([]);
      };

      const hasChanges = () => {
            return (
                  latitude !== initialLat ||
                  longitude !== initialLng ||
                  address !== initialAddress ||
                  city !== initialCity ||
                  state !== initialState ||
                  country !== initialCountry ||
                  pincode !== initialPincode ||
                  landmark !== initialLandmark ||
                  deliveryRadius !== initialRadius
            );
      };

      const handleCloseAttempt = () => {
            if (hasChanges()) {
                  setShowConfirmClose(true);
            } else {
                  onClose();
            }
      };

      const handleSave = async () => {
            if (!address.trim()) {
                  toast.error("Address is required");
                  return;
            }
            if (!city.trim() || !state.trim() || !country.trim() || !pincode.trim()) {
                  toast.error("City, State, Country, and Pincode are required");
                  return;
            }
            if (deliveryRadius < 500 || deliveryRadius > 15000) {
                  toast.error("Delivery radius must be between 500m and 15km");
                  return;
            }

            try {
                  setSaving(true);
                  const response = await updateRestaurantLocation({
                        address,
                        city,
                        state,
                        country,
                        pincode,
                        landmark: landmark || null,
                        latitude,
                        longitude,
                        deliveryRadius,
                        placeId: restaurant.location?.placeId || null
                  });

                  if (response.success) {
                        toast.success(response.message || "Location saved successfully");
                        onLocationUpdated(response.data.restaurant);
                        onClose();
                  } else {
                        toast.error(response.message || "Failed to update location");
                  }
            } catch (err: any) {
                  toast.error(err.message || "An error occurred");
            } finally {
                  setSaving(false);
            }
      };

      if (!isOpen) return null;

      return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
                  <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 relative overflow-hidden flex flex-col max-h-[90vh]">
                        
                        {/* Header */}
                        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                    <BiMapPin size={20} className="text-primary" />
                                    <h3 className="font-bold text-gray-900 text-base">Edit Restaurant Location</h3>
                              </div>
                              <button
                                    onClick={handleCloseAttempt}
                                    className="text-gray-400 hover:text-gray-800 p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
                              >
                                    <X size={18} />
                              </button>
                        </div>

                        {/* Body */}
                        <div className="p-4 overflow-y-auto flex-1 space-y-4">
                              
                              {/* Search */}
                              <div className="relative">
                                    <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 focus-within:border-primary transition">
                                          <BiSearch size={16} className="text-gray-400 shrink-0" />
                                          <input
                                                type="text"
                                                placeholder="Search location address..."
                                                value={searchQuery}
                                                onChange={(e) => handleSearch(e.target.value)}
                                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                                          />
                                          {searching && <BiLoader size={14} className="animate-spin text-gray-400" />}
                                    </div>
                                    {searchResults.length > 0 && (
                                          <ul className="absolute z-[2000] mt-1 w-full rounded-lg border bg-white shadow-lg max-h-40 overflow-y-auto">
                                                {searchResults.map((r) => (
                                                      <li
                                                            key={r.place_id}
                                                            onClick={() => selectSearchResult(r)}
                                                            className="flex items-start gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                                                      >
                                                            <BiMapPin size={14} className="text-primary mt-0.5 shrink-0" />
                                                            <span className="line-clamp-2">{r.display_name}</span>
                                                      </li>
                                                ))}
                                          </ul>
                                    )}
                              </div>

                              {/* Map Container */}
                              <div className="relative h-60 w-full z-0 rounded-xl overflow-hidden border">
                                    <MapContainer
                                          center={[latitude, longitude]}
                                          zoom={14}
                                          className="h-full w-full"
                                          style={{ height: "100%", width: "100%" }}
                                    >
                                          <TileLayer
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                          />
                                          <LocationPicker setLocation={setLocation} />
                                          <LocateMeButton onLocate={setLocation} />
                                          <MapFlyTo lat={latitude} lng={longitude} />
                                          <Marker position={[latitude, longitude]} />
                                    </MapContainer>
                              </div>

                              {/* Inputs */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="col-span-1 sm:col-span-2">
                                          <label className="text-xs font-semibold text-gray-600 uppercase">Street Address</label>
                                          <input
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                className="w-full text-sm border rounded-lg px-3 py-2 mt-1 focus:outline-primary"
                                          />
                                    </div>
                                    <div>
                                          <label className="text-xs font-semibold text-gray-600 uppercase">City</label>
                                          <input
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                className="w-full text-sm border rounded-lg px-3 py-2 mt-1 focus:outline-primary"
                                          />
                                    </div>
                                    <div>
                                          <label className="text-xs font-semibold text-gray-600 uppercase">State</label>
                                          <input
                                                value={state}
                                                onChange={(e) => setState(e.target.value)}
                                                className="w-full text-sm border rounded-lg px-3 py-2 mt-1 focus:outline-primary"
                                          />
                                    </div>
                                    <div>
                                          <label className="text-xs font-semibold text-gray-600 uppercase">Country</label>
                                          <input
                                                value={country}
                                                onChange={(e) => setCountry(e.target.value)}
                                                className="w-full text-sm border rounded-lg px-3 py-2 mt-1 focus:outline-primary"
                                          />
                                    </div>
                                    <div>
                                          <label className="text-xs font-semibold text-gray-600 uppercase">Pincode</label>
                                          <input
                                                value={pincode}
                                                onChange={(e) => setPincode(e.target.value)}
                                                className="w-full text-sm border rounded-lg px-3 py-2 mt-1 focus:outline-primary"
                                          />
                                    </div>
                                    <div className="col-span-1 sm:col-span-2">
                                          <label className="text-xs font-semibold text-gray-600 uppercase">Landmark (Optional)</label>
                                          <input
                                                value={landmark}
                                                onChange={(e) => setLandmark(e.target.value)}
                                                className="w-full text-sm border rounded-lg px-3 py-2 mt-1 focus:outline-primary"
                                          />
                                    </div>
                              </div>

                              {/* Delivery Radius */}
                              <div className="space-y-1">
                                    <div className="flex justify-between text-xs font-semibold text-gray-600 uppercase">
                                          <span>Delivery Radius</span>
                                          <span className="text-primary font-bold">{(deliveryRadius / 1000).toFixed(1)} km</span>
                                    </div>
                                    <input
                                          type="range"
                                          min={500}
                                          max={15000}
                                          step={500}
                                          value={deliveryRadius}
                                          onChange={(e) => setDeliveryRadius(parseInt(e.target.value))}
                                          className="w-full accent-primary mt-1"
                                    />
                              </div>

                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t bg-gray-50 flex items-center justify-end gap-2">
                              <button
                                    onClick={handleCloseAttempt}
                                    className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-100 cursor-pointer transition"
                              >
                                    Cancel
                              </button>
                              <button
                                    onClick={handleSave}
                                    disabled={saving || !hasChanges()}
                                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition flex items-center gap-1.5"
                              >
                                    {saving && <BiLoader className="animate-spin" />}
                                    Save Location
                              </button>
                        </div>

                  </div>

                  {/* Confirm Close Alert Modal */}
                  {showConfirmClose && (
                        <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/50 p-4">
                              <div className="bg-white p-5 rounded-xl shadow-lg border max-w-sm w-full text-center space-y-4">
                                    <h4 className="font-bold text-gray-900">Unsaved Changes</h4>
                                    <p className="text-sm text-gray-500">You have modified location details. Discard these edits?</p>
                                    <div className="flex justify-center gap-2">
                                          <button
                                                onClick={() => setShowConfirmClose(false)}
                                                className="px-3.5 py-1.5 border rounded-lg text-sm hover:bg-gray-50 cursor-pointer"
                                          >
                                                Keep Editing
                                          </button>
                                          <button
                                                onClick={() => {
                                                      setShowConfirmClose(false);
                                                      onClose();
                                                }}
                                                className="px-3.5 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 cursor-pointer"
                                          >
                                                Discard
                                          </button>
                                    </div>
                              </div>
                        </div>
                  )}

            </div>
      );
};

export default EditLocationModal;
