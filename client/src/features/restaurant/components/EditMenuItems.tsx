import React, { useState } from "react";
import toast from "react-hot-toast";
import type { IMenuItem } from "@/types";
import { updateMenuItem } from "@/services/api/menu.services";
import { compressImageToFile as compressImage } from "@/utils";
import { ImagePlus, X } from "lucide-react";
import { VscLoading } from "react-icons/vsc";

interface EditMenuItemsProps {
      item: IMenuItem;
      onItemUpdated: () => void;
      onClose: () => void;
}

const EditMenuItems = ({ item, onItemUpdated, onClose }: EditMenuItemsProps) => {
      const [name, setName] = useState(item.name);
      const [description, setDescription] = useState(item.description || "");
      const [price, setPrice] = useState(item.price.toString());
      const [image, setImage] = useState<File | null>(null);
      const [isVeg, setIsVeg] = useState(item.isVeg !== false);
      const [category, setCategory] = useState(item.category || "Main Course");
      const [loading, setLoading] = useState(false);
      const [preview, setPreview] = useState<string | null>(item.imageUrl || null);

      const handleSubmit = async () => {
            if ([name, price, category].some((field) => !field || String(field).trim() === "")) {
                  toast.error("Please fill in all required fields");
                  return;
            }

            try {
                  setLoading(true);
                  const response = await updateMenuItem(item._id, {
                        name,
                        description,
                        price: Number(price),
                        image: image ? await compressImage(image) : undefined,
                        isVeg,
                        category
                  });

                  if (response.success) {
                        toast.success(response.message || "Item updated successfully");
                        onItemUpdated();
                        onClose();
                  } else {
                        toast.error(response.message || "Failed to update menu item");
                  }
            } catch (error: any) {
                  console.log(error);
                  toast.error(error.message || "An error occurred while updating menu item");
            } finally {
                  setLoading(false);
            }
      };

      const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0] || null;
            setImage(file);
            setPreview(file ? URL.createObjectURL(file) : item.imageUrl || null);
      };

      return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
                  <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-scale-up">
                        
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                              <h2 className="text-lg font-bold text-gray-800">Edit Menu Item</h2>
                              <button 
                                    onClick={onClose}
                                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                                    aria-label="Close edit form"
                              >
                                    <X size={18} />
                              </button>
                        </div>

                        {/* Scrollable Form */}
                        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
                              {/* Image Input */}
                              <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Item Image</label>
                                    <label className="block cursor-pointer group">
                                          <div className={`relative w-full h-40 rounded-2xl border-2 border-dashed transition-colors duration-200 overflow-hidden flex items-center justify-center ${
                                                preview ? "border-primary" : "border-gray-300 hover:border-primary"
                                          }`}>
                                                {preview ? (
                                                      <img src={preview} alt="preview" className="w-full h-full object-contain" />
                                                ) : (
                                                      <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-primary transition-colors">
                                                            <ImagePlus size={32} />
                                                            <span className="text-xs font-semibold">Click to upload restaurant image</span>
                                                      </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                      <span className="text-white text-xs font-bold">Change Image</span>
                                                </div>
                                          </div>
                                          <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                    </label>
                              </div>

                              {/* Name Input */}
                              <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Item Name <span className="text-red-500">*</span></label>
                                    <input
                                          type="text"
                                          placeholder="e.g. Chicken Burger"
                                          value={name}
                                          onChange={(e) => setName(e.target.value)}
                                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold transition"
                                    />
                              </div>

                              {/* Description Input */}
                              <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Description</label>
                                    <textarea
                                          placeholder="Short description of the item..."
                                          value={description}
                                          onChange={(e) => setDescription(e.target.value)}
                                          rows={2.5}
                                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold transition resize-none"
                                    />
                              </div>

                              {/* Price Input */}
                              <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Price (₹) <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₹</span>
                                          <input
                                                type="number"
                                                placeholder="0.00"
                                                value={price}
                                                onChange={(e) => setPrice(e.target.value)}
                                                min={0}
                                                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold transition"
                                          />
                                    </div>
                              </div>

                              {/* Diet Type and Category Inputs */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                          <label className="text-sm font-semibold text-gray-700">Food Type <span className="text-red-500">*</span></label>
                                          <div className="flex gap-2">
                                                <button
                                                      type="button"
                                                      onClick={() => setIsVeg(true)}
                                                      className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                                                            isVeg 
                                                            ? "border-green-600 bg-green-50 text-green-700 ring-2 ring-green-600/10" 
                                                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                                      }`}
                                                >
                                                      <span className="inline-block w-2 h-2 rounded-full bg-green-600 mr-1.5"></span>
                                                      Veg
                                                </button>
                                                <button
                                                      type="button"
                                                      onClick={() => setIsVeg(false)}
                                                      className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                                                            !isVeg 
                                                            ? "border-red-600 bg-red-50 text-red-700 ring-2 ring-red-600/10" 
                                                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                                      }`}
                                                >
                                                      <span className="inline-block w-2 h-2 rounded-full bg-red-600 mr-1.5"></span>
                                                      Non-Veg
                                                </button>
                                          </div>
                                    </div>
                                    <div className="space-y-1.5">
                                          <label className="text-sm font-semibold text-gray-700">Category <span className="text-red-500">*</span></label>
                                                <select
                                                      value={category}
                                                      onChange={(e) => setCategory(e.target.value)}
                                                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-bold transition bg-white cursor-pointer"
                                                >
                                                      <option value="Starter">Starter</option>
                                                      <option value="Main Course">Main Course</option>
                                                      <option value="Dessert">Dessert</option>
                                                      <option value="Beverage">Beverage</option>
                                                      <option value="Bread">Bread</option>
                                                      <option value="Side Dish">Side Dish</option>
                                                      <option value="Bengali">Bengali</option>
                                                      <option value="Indian">Indian</option>
                                                      <option value="Chinese">Chinese</option>
                                                      <option value="Biryani">Biryani</option>
                                                      <option value="Italian">Italian</option>
                                                      <option value="Pizza">Pizza</option>
                                                      <option value="Burger">Burger</option>
                                                </select>
                                    </div>
                              </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 px-6 py-4 bg-gray-55/40 border-t border-gray-100">
                              <button
                                    onClick={onClose}
                                    type="button"
                                    className="flex-1 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 font-bold text-xs text-gray-600 active:scale-[0.98] transition-all"
                              >
                                    Cancel
                              </button>
                              <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/95 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                              >
                                    {loading ? (
                                          <>
                                                <VscLoading size={16} className="animate-spin" />
                                                Updating...
                                          </>
                                    ) : "Save Changes"}
                              </button>
                        </div>
                  </div>
            </div>
      );
};

export default EditMenuItems;
