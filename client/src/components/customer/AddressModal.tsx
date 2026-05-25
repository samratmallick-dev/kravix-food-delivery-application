import "leaflet/dist/leaflet.css";
import {
      MapContainer,
      TileLayer,
      Marker,
      useMapEvents,
      useMap,
} from "react-leaflet";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import L from "leaflet";
import { LuLocateFixed } from "react-icons/lu";
import { BiLoader, BiPlus, BiMapPin, BiPhone, BiSearch } from "react-icons/bi";
import { X } from "lucide-react";
import { addressBaseUrl } from "../common/constant";
import { storage } from "../../utils/secureStorage";

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
                  className="absolute right-3 top-3 z-[1000] flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow hover:bg-gray-100"
            >
                  <LuLocateFixed size={16} />
                  Use current location
            </button>
      );
};

interface AddressModalProps {
      isOpen: boolean;
      onClose: () => void;
      onAddressAdded: (address: any) => void;
}

const AddressModal = ({ isOpen, onClose, onAddressAdded }: AddressModalProps) => {
      const [adding, setAdding] = useState(false);
      const [mobile, setMobile] = useState("");
      const [formattedAddress, setFormattedAddress] = useState("");
      const [latitude, setLatitude] = useState<number | null>(null);
      const [longitude, setLongitude] = useState<number | null>(null);
      const [searchQuery, setSearchQuery] = useState("");
      const [searchResults, setSearchResults] = useState<any[]>([]);
      const [searching, setSearching] = useState(false);
      const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

      const fetchFormattedAddress = async (lat: number, lng: number) => {
            try {
                  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                  const data = await res.json();
                  setFormattedAddress(data.display_name || "");
            } catch {
                  toast.error("Failed to fetch address");
            }
      };

      const setLocation = (lat: number, lng: number) => {
            setLatitude(lat);
            setLongitude(lng);
            fetchFormattedAddress(lat, lng);
      };

      useEffect(() => {
            if (isOpen) {
                  navigator.geolocation?.getCurrentPosition(
                        (pos) => setLocation(pos.coords.latitude, pos.coords.longitude),
                        () => {}
                  );
            }
      }, [isOpen]);

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

      const addAddress = async () => {
            if (latitude === null || longitude === null || !formattedAddress) {
                  toast.error("Please select a location on the map");
                  return;
            }
            if (!mobile || mobile.length !== 10) {
                  toast.error("Please enter a valid 10-digit mobile number");
                  return;
            }
            try {
                  setAdding(true);
                  const token = storage.getToken();
                  const { data } = await axios.post(
                        addressBaseUrl,
                        {
                              formattedAddress,
                              mobile: Number(mobile),
                              latitude,
                              longitude,
                        },
                        {
                              headers: {
                                    Authorization: `Bearer ${token}`,
                              }
                        }
                  );
                  toast.success(data.message || "Address added successfully");
                  setMobile("");
                  setFormattedAddress("");
                  setLatitude(null);
                  setLongitude(null);
                  setSearchQuery("");
                  onAddressAdded(data.data);
            } catch (error: any) {
                  toast.error(error.response?.data?.message || "Failed to save address");
            } finally {
                  setAdding(false);
            }
      };

      if (!isOpen) return null;

      return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
                  <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-border relative overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                    <BiMapPin size={20} className="text-[#E23744]" />
                                    <h3 className="font-bold text-gray-900 text-base">Add New Address</h3>
                              </div>
                              <button
                                    onClick={onClose}
                                    className="text-gray-450 hover:text-gray-800 p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
                              >
                                    <X size={18} />
                              </button>
                        </div>

                        <div className="p-4 overflow-y-auto flex-1 space-y-4">
                              <div className="rounded-xl border overflow-hidden">
                                    <div className="p-3 border-b space-y-2 bg-gray-50/50">
                                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Pin your location</p>
                                          <div className="relative">
                                                <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 focus-within:border-[#E23744] transition">
                                                      <BiSearch size={16} className="text-gray-400 shrink-0" />
                                                      <input
                                                            type="text"
                                                            placeholder="Search location..."
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
                                                                        <BiMapPin size={14} className="text-[#E23744] mt-0.5 shrink-0" />
                                                                        <span className="line-clamp-2">{r.display_name}</span>
                                                                  </li>
                                                            ))}
                                                      </ul>
                                                )}
                                          </div>
                                    </div>
                                    <div className="relative h-60 w-full z-0">
                                          <MapContainer
                                                center={[latitude || 28.6139, longitude || 77.209]}
                                                zoom={13}
                                                className="h-full w-full"
                                                style={{ height: "100%", width: "100%" }}
                                          >
                                                <TileLayer
                                                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                                />
                                                <LocationPicker setLocation={setLocation} />
                                                <LocateMeButton onLocate={setLocation} />
                                                {latitude && longitude && (
                                                      <>
                                                            <MapFlyTo lat={latitude} lng={longitude} />
                                                            <Marker position={[latitude, longitude]} />
                                                      </>
                                                )}
                                          </MapContainer>
                                    </div>
                                    {formattedAddress && (
                                          <div className="flex items-start gap-2 bg-green-50 border-t border-green-100 px-3 py-2.5">
                                                <BiMapPin size={16} className="text-green-600 mt-0.5 shrink-0" />
                                                <p className="text-xs text-green-800 leading-snug">{formattedAddress}</p>
                                          </div>
                                    )}
                              </div>

                              <div className="space-y-3">
                                    <div className="space-y-1">
                                          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Contact Mobile Number</label>
                                          <div className="flex items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2 focus-within:border-[#E23744] focus-within:bg-white transition">
                                                <BiPhone size={18} className="text-gray-400 shrink-0" />
                                                <input
                                                      type="tel"
                                                      placeholder="Enter 10-digit mobile number"
                                                      value={mobile}
                                                      maxLength={10}
                                                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                                                />
                                          </div>
                                    </div>
                              </div>
                        </div>

                        <div className="p-4 border-t bg-gray-50 flex items-center justify-end gap-3">
                              <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                              >
                                    Cancel
                              </button>
                              <button
                                    type="button"
                                    disabled={adding}
                                    onClick={addAddress}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-[#E23744] px-5 py-2 text-xs font-semibold text-white hover:bg-[#d32f3a] disabled:opacity-50 transition cursor-pointer"
                              >
                                    {adding ? <BiLoader className="animate-spin" size={14} /> : <BiPlus size={14} />}
                                    Save Address
                              </button>
                        </div>
                  </div>
            </div>
      );
};

export default AddressModal;
