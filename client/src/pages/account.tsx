import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { useAppData } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { BiMapPin, BiPackage } from "react-icons/bi";
import { LogOut, Pencil, Check, X, Loader2, ImagePlus } from "lucide-react";
import { useMobile } from "../components/common/useMobile";
import { storage } from "../utils/secureStorage";
import { updateProfile } from "../utils/auth.api";
import { cloudinaryBaseUrl, internalKey } from "../components/common/constant";
import { compressImage } from "../utils/imageCompressor";

const Account = () => {
      const { user, setUser, setIsAuth } = useAppData();
      const navigate = useNavigate();
      const isMobile = useMobile();

      const [editing, setEditing] = useState(false);
      const [name, setName] = useState(user?.name ?? "");
      const [previewImage, setPreviewImage] = useState<string | null>(null);
      const [imageFile, setImageFile] = useState<File | null>(null);
      const [saving, setSaving] = useState(false);
      const fileInputRef = useRef<HTMLInputElement>(null);

      const logoutHandler = () => {
            storage.removeToken();
            setUser(null);
            setIsAuth(false);
            navigate("/login");
            toast.success("Logout Successfull");
      };

      const handleEditStart = () => {
            setName(user?.name ?? "");
            setPreviewImage(null);
            setImageFile(null);
            setEditing(true);
      };

      const handleCancel = () => {
            setEditing(false);
            setPreviewImage(null);
            setImageFile(null);
      };

      const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0] ?? null;
            if (!file) return;
            setImageFile(file);
            try {
                  const compressed = await compressImage(file, 800, 0.7);
                  setPreviewImage(compressed);
            } catch (err) {
                  console.error("Failed to compress image", err);
                  toast.error("Failed to process image");
            }
      };

      const handleSave = async () => {
            const token = storage.getToken();
            if (!token) return;

            const trimmedName = name.trim();
            if (trimmedName.length < 2 || trimmedName.length > 50) {
                  toast.error("Name must be between 2 and 50 characters.");
                  return;
            }

            setSaving(true);
            try {
                  let imageUrl: string | undefined;

                  if (imageFile && previewImage) {
                        const uploadRes = await fetch(`${cloudinaryBaseUrl}/images`, {
                              method: "POST",
                              headers: {
                                    "Content-Type": "application/json",
                                    "x-internal-key": internalKey,
                              },
                              body: JSON.stringify({ image: previewImage }),
                        });
                        const uploadData = await uploadRes.json();
                        if (!uploadRes.ok || !uploadData.url) {
                              throw new Error(uploadData.message || "Image upload failed");
                        }
                        imageUrl = uploadData.url;
                  }

                  const payload: { name?: string; image?: string } = {};
                  if (trimmedName !== user?.name) payload.name = trimmedName;
                  if (imageUrl) payload.image = imageUrl;

                  if (Object.keys(payload).length === 0) {
                        setEditing(false);
                        return;
                  }

                  const res = await updateProfile(payload, token);
                  if (res.data?.token) storage.setToken(res.data.token);
                  const updatedUser = res.data?.user;
                  if (updatedUser) setUser((prev) => prev ? { ...prev, ...updatedUser } : prev);
                  toast.success("Profile updated successfully");
                  setEditing(false);
                  setPreviewImage(null);
                  setImageFile(null);
            } catch (err: unknown) {
                  toast.error(err instanceof Error ? err.message : "Failed to update profile");
            } finally {
                  setSaving(false);
            }
      };

      const displayImage = previewImage ?? user?.image;
      const nameInitial = (user?.name ?? "U").charAt(0).toUpperCase();

      return (
            <div className="w-full h-full min-h-screen bg-white py-6 px-4">
                  <div className={`w-full bg-slate-200 rounded-lg text-gray-700 shadow-sm ${isMobile ? "max-w-full" : "container max-w-lg mx-auto"}`}>

                        <div className="flex items-center gap-4 border-b-2 border-gray-500 p-5">
                              <div className="relative shrink-0">
                                    {displayImage ? (
                                          <img
                                                src={displayImage}
                                                alt="Profile"
                                                className={`rounded-full object-cover ${isMobile ? "w-16 h-16" : "w-20 h-20"}`}
                                                referrerPolicy="no-referrer"
                                          />
                                    ) : (
                                          <div className={`rounded-full bg-primary text-white flex items-center justify-center font-bold ${isMobile ? "w-16 h-16 text-2xl" : "w-20 h-20 text-3xl"}`}>
                                                {nameInitial}
                                          </div>
                                    )}
                                    {editing && (
                                          <>
                                                <button
                                                      onClick={() => fileInputRef.current?.click()}
                                                      className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1 shadow"
                                                >
                                                      <ImagePlus size={14} />
                                                </button>
                                                <input
                                                      ref={fileInputRef}
                                                      type="file"
                                                      accept="image/*"
                                                      className="hidden"
                                                      onChange={handleImageChange}
                                                />
                                          </>
                                    )}
                              </div>

                              <div className="flex flex-col gap-1 min-w-0 flex-1">
                                    {editing ? (
                                          <input
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className={`font-bold bg-white border border-gray-300 rounded px-2 py-1 outline-none focus:border-primary ${isMobile ? "text-base" : "text-lg"}`}
                                                autoFocus
                                          />
                                    ) : (
                                          <h1 className={`font-bold break-all ${isMobile ? "text-base" : "text-lg"}`}>{user?.name}</h1>
                                    )}
                                    <p className="text-sm text-gray-600 break-all">{user?.email}</p>
                              </div>

                              <div className="flex gap-2 shrink-0">
                                    {editing ? (
                                          <>
                                                <button
                                                      onClick={handleSave}
                                                      disabled={saving}
                                                      className="p-1.5 rounded-full bg-green-500 text-white disabled:opacity-60"
                                                >
                                                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                                </button>
                                                <button
                                                      onClick={handleCancel}
                                                      disabled={saving}
                                                      className="p-1.5 rounded-full bg-gray-400 text-white disabled:opacity-60"
                                                >
                                                      <X size={16} />
                                                </button>
                                          </>
                                    ) : (
                                          <button
                                                onClick={handleEditStart}
                                                className="p-1.5 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-700 transition"
                                          >
                                                <Pencil size={16} />
                                          </button>
                                    )}
                              </div>
                        </div>

                        <div className="divide-y">
                              <div
                                    onClick={() => navigate("/orders")}
                                    className="flex items-center gap-4 p-5 cursor-pointer hover:bg-white transition ease-linear"
                              >
                                    <BiPackage size={isMobile ? 20 : 24} className="text-primary" />
                                    <span className="font-medium">My Orders</span>
                              </div>
                              <div
                                    onClick={() => navigate("/address")}
                                    className="flex items-center gap-4 p-5 cursor-pointer hover:bg-white transition ease-linear"
                              >
                                    <BiMapPin size={isMobile ? 20 : 24} className="text-primary" />
                                    <span className="font-medium">My Addresses</span>
                              </div>
                              <div
                                    onClick={logoutHandler}
                                    className="flex items-center gap-4 p-5 cursor-pointer hover:bg-white transition ease-linear rounded-b-lg"
                              >
                                    <LogOut size={isMobile ? 20 : 24} className="text-primary" />
                                    <span className="font-medium">Logout</span>
                              </div>
                        </div>
                  </div>
            </div>
      );
};

export default Account;
