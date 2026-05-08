import axios from "axios";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { menuBaseUrl } from "../common/constant";
import { ImagePlus } from "lucide-react";
import { VscLoading } from "react-icons/vsc";

const AddMenuItems = (
      { onItemAdded }: { onItemAdded: () => void }
) => {

      const [name, setName] = useState("");
      const [description, setDescription] = useState("");
      const [price, setPrice] = useState("");
      const [image, setImage] = useState<File | null>(null);
      const [loading, setLoading] = useState(false);
      const [preview, setPreview] = useState<string | null>(null);

      const resetForm = () => {
            setName("");
            setDescription("");
            setPrice("");
            setPreview(null);
            setImage(null);
      };
      const handleSubmit = async () => {
            if ([name, price, image].some((field) => !field)) {
                  toast.error("Please fill the all required fields");
                  return;
            }

            const formData = new FormData();

            formData.append("name", name);
            formData.append("description", description);
            formData.append("price", price);
            formData.append("file", image!);

            try {
                  setLoading(true);
                  const response = await axios.post(`${menuBaseUrl}`, formData, {
                        headers: {
                              "Content-Type": "multipart/form-data",
                              Authorization: `Bearer ${localStorage.getItem("token")}`
                        }, withCredentials: true
                  });

                  if (response.data.success) {
                        toast.success(response.data.message);
                        resetForm();
                        onItemAdded();
                  } else {
                        toast.error(response.data.message || "Failed to add menu item");
                  }
            } catch (error: any) {
                  console.log(error);
                  toast.error(error.response?.data?.message || "An error occurred while adding menu item");
            } finally {
                  setLoading(false);
            }
      };

      const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0] || null;
            setImage(file);
            setPreview(file ? URL.createObjectURL(file) : null);
      };

      return (
            <div className="max-w-lg mx-auto">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Add Menu Item</h2>

                  <div className="space-y-5">
                         <label className="block cursor-pointer group">
                                    <div className={`relative w-full h-44 rounded-xl border-2 border-dashed transition-colors duration-200 overflow-hidden flex items-center justify-center ${
                                          preview ? "border-primary" : "border-gray-300 hover:border-primary"
                                    }`}>
                                          {preview ? (
                                                <img src={preview} alt="preview" className="w-full h-full object-contain" />
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
                        <div className="space-y-1.5">
                              <label className="text-sm font-medium text-gray-700">Item Name <span className="text-red-500">*</span></label>
                              <input
                                    type="text"
                                    placeholder="e.g. Chicken Burger"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition"
                              />
                        </div>
                        <div className="space-y-1.5">
                              <label className="text-sm font-medium text-gray-700">Description</label>
                              <textarea
                                    placeholder="Short description of the item..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition resize-none"
                              />
                        </div>
                        <div className="space-y-1.5">
                              <label className="text-sm font-medium text-gray-700">Price (₹) <span className="text-red-500">*</span></label>
                              <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₹</span>
                                    <input
                                          type="number"
                                          placeholder="0.00"
                                          value={price}
                                          onChange={(e) => setPrice(e.target.value)}
                                          min={0}
                                          className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition"
                                    />
                              </div>
                        </div>
                        <button
                              onClick={handleSubmit}
                              disabled={loading}
                              className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                              {loading ? (
                                    <>
                                          <VscLoading size={18} className="animate-spin" />
                                          Adding Item...
                                    </>
                              ) : "Add to Menu"}
                        </button>
                  </div>
            </div>
      );
}

export default AddMenuItems;
