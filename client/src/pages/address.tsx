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
import { BiLoader, BiPlus, BiTrash, BiMapPin, BiPhone, BiSearch } from "react-icons/bi";
import { addressBaseUrl } from "../components/common/constant";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
      iconRetinaUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

});
interface Address {
      _id: string;
      formatedAddress: string;
      mobile: number;
}

const LocationPicker = ({
      setLocation,
}: {
      setLocation: (lat: number, lng: number) => void;
}) => {
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

const LocateMeButton = ({
      onLocate,
}: {
      onLocate: (lat: number, lng: number) => void;
}) => {
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
                  onClick={locateUser}
                  className="absolute right-3 top-3 z-1000 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow hover:bg-gray-100"
            >
                  <LuLocateFixed size={16} />
                  Use current location
            </button>
      );
};
const AddAddressPage = () => {
      const [addresses, setAddresses] = useState<Address[]>([]);
      const [loading, setLoading] = useState(true);
      const [adding, setAdding] = useState(false);
      const [deletingId, setDeletingId] = useState<string | null>(null);
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
                  const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
                  );
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
      const fetchAddresses = async () => {
            try {
                  const { data } = await
                        axios.get(`${addressBaseUrl}`, {
                              headers: {
                                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                              },
                        });
                  setAddresses(data.data || []);
            } catch(error: any) {
                  toast.error(error.response?.data?.message || "Failed");
                  console.log(error);                  
            } finally {
                  setLoading(false);
            }
      };
      useEffect(() => {
            fetchAddresses();
            navigator.geolocation?.getCurrentPosition(
                  (pos) => setLocation(pos.coords.latitude, pos.coords.longitude),
                  () => {}
            );
      }, []);

      const handleSearch = (query: string) => {
            setSearchQuery(query);
            setSearchResults([]);
            if (!query.trim()) return;
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
            searchTimeout.current = setTimeout(async () => {
                  setSearching(true);
                  try {
                        const res = await fetch(
                              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
                        );
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
            if (!mobile) {
                  toast.error("Please enter your mobile number");
                  return;
            }
            try {
                  setAdding(true);
                  const { data } = await axios.post(
                        `${addressBaseUrl}`,
                        {
                              formattedAddress,
                              mobile,
                              latitude,
                              longitude,
                        },
                        {
                              headers: {
                                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                              },
                        }
                  );
                  toast.success(data.message);
                  setMobile("");
                  setFormattedAddress("");

                  setLatitude(null);
                  setLongitude(null);
                  fetchAddresses();
            } catch (error: any) {
                  console.log(error);
                  toast.error(error.response?.data?.message || "Failed");
            } finally {
                  setAdding(false);
            }
      };
      const deleteAddress = async (id: string) => {
            if (!window.confirm("Delete this address?")) return;
            try {
                  setDeletingId(id);
                  const { data } = await axios.delete(`${addressBaseUrl}/${id}`, {
                        headers: {
                              Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                  });
                  toast.success(data.message);
                  fetchAddresses();
            } catch (error: any) {
                  console.log(error);
                  toast.error(error.response.data.message || "Failed to delete your address");
            } finally {
                  setDeletingId(null);
            }
      };
      return (
            <div className="min-h-screen bg-gray-50 px-4 py-6">
                  <div className="mx-auto max-w-2xl space-y-5">
                        <div className="flex items-center gap-2">
                              <BiMapPin size={24} className="text-[#E23744]" />
                              <h1 className="text-2xl font-bold text-gray-800">Your Address</h1>
                        </div>

                        <div className="rounded-xl bg-white shadow-sm border overflow-hidden">
                              <div className="p-4 border-b space-y-3">
                                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pin your location</p>
                                    <p className="text-xs text-gray-400 -mt-2">Click on the map or use current location</p>
                                    <div className="relative">
                                          <div className="flex items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2 focus-within:border-[#E23744] focus-within:bg-white transition">
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
                                                <ul className="absolute z-1000 mt-1 w-full rounded-lg border bg-white shadow-lg max-h-48 overflow-y-auto">
                                                      {searchResults.map((r) => (
                                                            <li
                                                                  key={r.place_id}
                                                                  onClick={() => selectSearchResult(r)}
                                                                  className="flex items-start gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                                                            >
                                                                  <BiMapPin size={14} className="text-[#E23744] mt-0.5 shrink-0" />
                                                                  <span className="line-clamp-2">{r.display_name}</span>
                                                            </li>
                                                      ))}
                                                </ul>
                                          )}
                                    </div>
                              </div>
                              <div className="relative h-72 w-full">
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
                                    <div className="flex items-start gap-2 bg-green-50 border-t border-green-100 px-4 py-3">
                                          <BiMapPin size={16} className="text-green-600 mt-0.5 shrink-0" />
                                          <p className="text-sm text-green-800">{formattedAddress}</p>
                                    </div>
                              )}
                        </div>

                        <div className="rounded-xl bg-white shadow-sm border p-4 space-y-3">
                              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Contact</p>
                              <div className="flex items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2 focus-within:border-[#E23744] focus-within:bg-white transition">
                                    <BiPhone size={18} className="text-gray-400 shrink-0" />
                                    <input
                                          type="tel"
                                          placeholder="Mobile number"
                                          value={mobile}
                                          maxLength={10}
                                          onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                          className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                                    />
                              </div>
                              <button
                                    disabled={adding}
                                    onClick={addAddress}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E23744] px-4 py-3 text-sm font-semibold text-white hover:bg-[#d32f3a] disabled:opacity-50 transition"
                              >
                                    {adding ? <BiLoader className="animate-spin" size={18} /> : <BiPlus size={18} />}
                                    Save Address
                              </button>
                        </div>

                        <div className="space-y-3">
                              <h2 className="text-base font-semibold text-gray-700">Saved Addresses</h2>
                              {loading ? (
                                    <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                                          <BiLoader className="animate-spin" size={16} />
                                          Loading addresses...
                                    </div>
                              ) : addresses.length === 0 ? (
                                    <div className="rounded-xl border border-dashed bg-white p-6 text-center">
                                          <BiMapPin size={28} className="mx-auto text-gray-300 mb-2" />
                                          <p className="text-sm text-gray-400">No saved addresses yet</p>
                                    </div>
                              ) : (
                                    addresses.map((addr) => (
                                          <div
                                                key={addr._id}
                                                className="flex items-start justify-between rounded-xl border bg-white p-4 shadow-sm"
                                          >
                                                <div className="flex items-start gap-3">
                                                      <div className="mt-0.5 rounded-full bg-red-50 p-1.5">
                                                            <BiMapPin size={16} className="text-[#E23744]" />
                                                      </div>
                                                      <div>
                                                            <p className="text-sm font-medium text-gray-800 leading-snug">{addr.formatedAddress}</p>
                                                            <div className="flex items-center gap-1 mt-1">
                                                                  <BiPhone size={12} className="text-gray-400" />
                                                                  <p className="text-xs text-gray-500">{addr.mobile}</p>
                                                            </div>
                                                      </div>
                                                </div>
                                                <button
                                                      onClick={() => deleteAddress(addr._id)}
                                                      disabled={deletingId === addr._id}
                                                      className="ml-2 rounded-lg p-2 text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition"
                                                >
                                                      {deletingId === addr._id ? (
                                                            <BiLoader size={16} className="animate-spin" />
                                                      ) : (
                                                            <BiTrash size={16} />
                                                      )}
                                                </button>
                                          </div>
                                    ))
                              )}
                        </div>
                  </div>
            </div>
      );
};

export default AddAddressPage;