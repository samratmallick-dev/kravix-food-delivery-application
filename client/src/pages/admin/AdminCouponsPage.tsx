import { useEffect, useState } from "react";
import { getAllCoupons, createCoupon, updateCoupon, deleteCoupon, getCouponAnalytics } from "@/services/api/admin.services";
import {
      Ticket,
      Plus,
      Trash2,
      Eye,
      X,
      Search,
} from "lucide-react";
import toast from "react-hot-toast";


interface Coupon {
      _id: string;
      code: string;
      discountType: "percentage" | "flat" | "free_delivery";
      discountValue: number;
      maxDiscountAmount: number;
      minOrderAmount: number;
      expiryDate: string;
      usageLimit: number;
      perUserLimit: number;
      usedCount: number;
      isActive: boolean;
      couponType: "global" | "restaurant";
      restaurantId: string | null;
      createdAt: string;
}

interface CouponUsageRecord {
      _id: string;
      userId: string;
      orderId: string;
      discountApplied: number;
      usedAt: string;
}

interface CouponAnalytics {
      coupon: Coupon;
      totalRedemptions: number;
      totalDiscountAmount: number;
      usages: CouponUsageRecord[];
}

const AdminCoupons = () => {
      const [coupons, setCoupons] = useState<Coupon[]>([]);
      const [loading, setLoading] = useState(true);
      const [searchQuery, setSearchQuery] = useState("");

      // Dialog States
      const [isCreateOpen, setIsCreateOpen] = useState(false);
      const [selectedCouponAnalytics, setSelectedCouponAnalytics] = useState<CouponAnalytics | null>(null);

      // Create Form States
      const [code, setCode] = useState("");
      const [discountType, setDiscountType] = useState<"percentage" | "flat" | "free_delivery">("percentage");
      const [discountValue, setDiscountValue] = useState<number>(10);
      const [maxDiscountAmount, setMaxDiscountAmount] = useState<number>(0);
      const [minOrderAmount, setMinOrderAmount] = useState<number>(0);
      const [expiryDate, setExpiryDate] = useState("");
      const [usageLimit, setUsageLimit] = useState<number>(0);
      const [perUserLimit, setPerUserLimit] = useState<number>(1);
      const [couponTypeForm, setCouponTypeForm] = useState<"global" | "restaurant">("global");
      const [restaurantId, setRestaurantId] = useState("");

      const fetchCoupons = async () => {
            setLoading(true);
            try {
                  const res = await getAllCoupons();
                  if (res && res.success) {
                        setCoupons(res.data);
                  }
            } catch (error: any) {
                  console.error("Failed to load coupons:", error);
                  toast.error(error.message || "Failed to load coupons");
            } finally {
                  setLoading(false);
            }
      };

      useEffect(() => {
            fetchCoupons();
      }, []);

      const handleCreateCoupon = async (e: React.FormEvent) => {
            e.preventDefault();
            if (!code || !expiryDate) {
                  toast.error("Please fill in code and expiry date");
                  return;
            }

            try {
                  const payload = {
                        code,
                        discountType,
                        discountValue,
                        maxDiscountAmount,
                        minOrderAmount,
                        expiryDate,
                        usageLimit,
                        perUserLimit,
                        couponType: couponTypeForm,
                        restaurantId: couponTypeForm === "restaurant" ? restaurantId : undefined
                  };
                  const res = await createCoupon(payload);

                  if (res && res.success) {
                        toast.success("Coupon created successfully! 🎉");
                        setIsCreateOpen(false);
                        // Reset Form
                        setCode("");
                        setDiscountType("percentage");
                        setDiscountValue(10);
                        setMaxDiscountAmount(0);
                        setMinOrderAmount(0);
                        setExpiryDate("");
                        setUsageLimit(0);
                        setPerUserLimit(1);
                        setCouponTypeForm("global");
                        setRestaurantId("");
                        fetchCoupons();
                  }
            } catch (error: any) {
                  console.error("Error creating coupon:", error);
                  toast.error(error.message || "Error creating coupon");
            }
      };

      const handleToggleActive = async (id: string, currentStatus: boolean) => {
            try {
                   const res = await updateCoupon(id, { isActive: !currentStatus } as any);

                  if (res && res.success) {
                        toast.success(`Coupon ${!currentStatus ? "activated" : "deactivated"}!`);
                        setCoupons(prev => prev.map(c => c._id === id ? { ...c, isActive: !currentStatus } : c));
                  }
            } catch (error: any) {
                  console.error("Error toggling coupon:", error);
                  toast.error("Failed to update coupon status");
            }
      };

      const handleDeleteCoupon = async (id: string) => {
            if (!window.confirm("Are you sure you want to delete this coupon?")) return;
            try {
                  const res = await deleteCoupon(id);

                  if (res && res.success) {
                        toast.success("Coupon deleted successfully");
                        setCoupons(prev => prev.filter(c => c._id !== id));
                        if (selectedCouponAnalytics?.coupon._id === id) {
                              setSelectedCouponAnalytics(null);
                        }
                  }
            } catch (error: any) {
                  console.error("Error deleting coupon:", error);
                  toast.error("Failed to delete coupon");
            }
      };

      const fetchCouponAnalytics = async (id: string) => {
            setSelectedCouponAnalytics(null);
            try {
                  const res = await getCouponAnalytics(id);
                  if (res && res.success) {
                         setSelectedCouponAnalytics(res.data as any);
                  }
            } catch (error: any) {
                  console.error("Failed to load coupon analytics:", error);
                  toast.error("Could not fetch redemption details");
            }
      };

      const filteredCoupons = coupons.filter(c =>
            c.code.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return (
            <div className="p-4 sm:p-6 space-y-6 flex flex-col lg:flex-row gap-6 items-start">
                  {/* Left Column: Coupon Table & Main Actions */}
                  <div className="flex-1 w-full bg-white rounded-2xl border border-border p-4 sm:p-5 shadow-xs space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div>
                                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                                          <Ticket className="text-primary" size={24} />
                                          Promotional Coupons
                                    </h1>
                                    <p className="text-xs sm:text-sm text-gray-500">
                                          Manage system-wide discounts and restaurant specific coupon rules.
                                    </p>
                              </div>
                              <button
                                    onClick={() => setIsCreateOpen(true)}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold shadow-xs hover:bg-primary/90 transition cursor-pointer"
                              >
                                    <Plus size={16} />
                                    Create Coupon
                              </button>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                              <input
                                    type="text"
                                    placeholder="Search by code (e.g. KRAVIX50)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-gray-50 text-sm focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary transition outline-hidden"
                              />
                        </div>

                        {/* Coupons Table */}
                        <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                          <tr className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider border-b border-border">
                                                <th className="p-4">Coupon Info</th>
                                                <th className="p-4">Type</th>
                                                <th className="p-4 text-center">Value</th>
                                                <th className="p-4 text-center">Limits</th>
                                                <th className="p-4 text-center">Status</th>
                                                <th className="p-4 text-right">Actions</th>
                                          </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border text-gray-700">
                                          {loading ? (
                                                Array.from({ length: 4 }).map((_, i) => (
                                                      <tr key={i} className="animate-pulse">
                                                            <td className="p-4"><div className="h-4 bg-gray-100 rounded-sm w-32" /></td>
                                                            <td className="p-4"><div className="h-4 bg-gray-100 rounded-sm w-16" /></td>
                                                            <td className="p-4"><div className="h-4 bg-gray-100 rounded-sm w-12 mx-auto" /></td>
                                                            <td className="p-4"><div className="h-4 bg-gray-100 rounded-sm w-20 mx-auto" /></td>
                                                            <td className="p-4"><div className="h-4 bg-gray-100 rounded-sm w-16 mx-auto" /></td>
                                                            <td className="p-4"><div className="h-4 bg-gray-100 rounded-sm w-24 ml-auto" /></td>
                                                      </tr>
                                                ))
                                          ) : filteredCoupons.length > 0 ? (
                                                filteredCoupons.map((coupon) => (
                                                      <tr key={coupon._id} className="hover:bg-gray-50/80 transition">
                                                            <td className="p-4">
                                                                  <div className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                                                                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md font-mono uppercase tracking-wider text-xs">
                                                                              {coupon.code}
                                                                        </span>
                                                                  </div>
                                                                  <p className="text-[10px] text-gray-400 mt-1">
                                                                        Expires: {new Date(coupon.expiryDate).toLocaleDateString()}
                                                                  </p>
                                                            </td>
                                                            <td className="p-4">
                                                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium text-[10px] uppercase tracking-wider ${
                                                                        coupon.couponType === "global"
                                                                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                                                                              : "bg-teal-50 text-teal-700 border border-teal-200"
                                                                  }`}>
                                                                        {coupon.couponType}
                                                                  </span>
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                  {coupon.discountType === "percentage" ? (
                                                                        <>
                                                                              <span className="font-semibold text-gray-800">{coupon.discountValue}% Off</span>
                                                                              {coupon.maxDiscountAmount > 0 && (
                                                                                    <p className="text-[9px] text-orange-500 mt-0.5">Max ₹{coupon.maxDiscountAmount}</p>
                                                                              )}
                                                                        </>
                                                                  ) : coupon.discountType === "flat" ? (
                                                                        <span className="font-semibold text-gray-800">₹{coupon.discountValue} Off</span>
                                                                  ) : (
                                                                        <span className="font-semibold text-green-600">Free Delivery</span>
                                                                  )}
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                  <p className="font-medium text-gray-900">
                                                                        {coupon.usedCount} / {coupon.usageLimit || "∞"}
                                                                  </p>
                                                                  <p className="text-[9px] text-gray-400">Min Order: ₹{coupon.minOrderAmount}</p>
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                  <button
                                                                        onClick={() => handleToggleActive(coupon._id, coupon.isActive)}
                                                                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-hidden ${
                                                                              coupon.isActive ? "bg-green-500" : "bg-gray-200"
                                                                        }`}
                                                                  >
                                                                        <span
                                                                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                                                                    coupon.isActive ? "translate-x-4" : "translate-x-0"
                                                                              }`}
                                                                        />
                                                                  </button>
                             </td>
                                                            <td className="p-4 text-right">
                                                                  <div className="flex items-center justify-end gap-1.5">
                                                                        <button
                                                                              onClick={() => fetchCouponAnalytics(coupon._id)}
                                                                              className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition cursor-pointer"
                                                                              title="View Analytics"
                                                                        >
                                                                              <Eye size={15} />
                                                                        </button>
                                                                        <button
                                                                              onClick={() => handleDeleteCoupon(coupon._id)}
                                                                              className="p-1.5 text-gray-550 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                                                              title="Delete Coupon"
                                                                        >
                                                                              <Trash2 size={15} />
                                                                        </button>
                                                                  </div>
                                                            </td>
                                                      </tr>
                                                ))
                                          ) : (
                                                <tr>
                                                      <td colSpan={6} className="p-8 text-center text-gray-400">
                                                            No coupons match your search criteria.
                                                      </td>
                                                </tr>
                                          )}
                                    </tbody>
                              </table>
                        </div>
                  </div>

                  {/* Right Column: Drawer/Panel for Coupon Analytics */}
                  {selectedCouponAnalytics && (
                        <div className="w-full lg:w-80 bg-white rounded-2xl border border-border p-4 sm:p-5 shadow-sm space-y-4 shrink-0 transition animate-in slide-in-from-right duration-250">
                              <div className="flex items-center justify-between border-b border-border pb-3">
                                    <div>
                                          <h3 className="font-bold text-gray-900 text-sm">Coupon Analytics</h3>
                                          <p className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider">
                                                {selectedCouponAnalytics.coupon.code}
                                          </p>
                                    </div>
                                    <button
                                          onClick={() => setSelectedCouponAnalytics(null)}
                                          className="text-gray-450 hover:text-gray-800 p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
                                    >
                                          <X size={16} />
                                    </button>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gray-50 rounded-xl p-3 border border-border">
                                          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">Total Redemptions</p>
                                          <p className="text-lg font-black text-gray-950 mt-1">{selectedCouponAnalytics.totalRedemptions}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3 border border-border">
                                          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">Discount Saved</p>
                                          <p className="text-lg font-black text-green-600 mt-1">₹{selectedCouponAnalytics.totalDiscountAmount}</p>
                                    </div>
                              </div>

                              {/* Recent Redemptions */}
                              <div className="space-y-3.5 pt-2">
                                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Recent Redemptions</h4>
                                    {selectedCouponAnalytics.usages.length > 0 ? (
                                          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                                                {selectedCouponAnalytics.usages.map((usage) => (
                                                      <div key={usage._id} className="text-xs p-2.5 rounded-xl border border-gray-150 bg-gray-50/50 flex flex-col gap-1">
                                                            <div className="flex justify-between items-center">
                                                                  <span className="font-mono text-[10px] text-gray-400 truncate max-w-28">User: {usage.userId}</span>
                                                                  <span className="font-bold text-green-700">-₹{usage.discountApplied}</span>
                                                            </div>
                                                            <p className="text-[9px] text-gray-400 leading-none">
                                                                  {new Date(usage.usedAt).toLocaleString()}
                                                            </p>
                                                      </div>
                                                ))}
                                          </div>
                                    ) : (
                                          <p className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-xl">No redemptions found yet</p>
                                    )}
                              </div>
                        </div>
                  )}

                  {/* Create Modal Dialog */}
                  {isCreateOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
                              <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-border relative overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                                    {/* Modal Header */}
                                    <div className="p-4 border-b border-border bg-gray-50 flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                                      <Ticket size={16} />
                                                </div>
                                                <h3 className="font-bold text-gray-900 text-base">Create New Coupon</h3>
                                          </div>
                                          <button
                                                onClick={() => setIsCreateOpen(false)}
                                                className="text-gray-450 hover:text-gray-800 p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
                                          >
                                                <X size={18} />
                                          </button>
                                    </div>

                                    {/* Modal Body / Form */}
                                    <form onSubmit={handleCreateCoupon} className="p-4 space-y-4 overflow-y-auto flex-1 text-sm text-gray-700">
                                          <div className="grid grid-cols-2 gap-3">
                                                <div className="col-span-2">
                                                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Coupon Code</label>
                                                      <input
                                                            type="text"
                                                            required
                                                            placeholder="e.g. SUPER50"
                                                            value={code}
                                                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                                                            className="w-full px-3.5 py-2 rounded-xl border border-border bg-gray-50 focus:bg-white text-sm focus:ring-1 focus:ring-primary outline-hidden"
                                                      />
                                                </div>

                                                <div>
                                                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Discount Type</label>
                                                      <select
                                                            value={discountType}
                                                            onChange={(e) => setDiscountType(e.target.value as any)}
                                                            className="w-full px-3.5 py-2 rounded-xl border border-border bg-gray-50 text-sm focus:ring-1 focus:ring-primary outline-hidden cursor-pointer"
                                                      >
                                                            <option value="percentage">Percentage (%)</option>
                                                            <option value="flat">Flat Cash (₹)</option>
                                                            <option value="free_delivery">Free Delivery</option>
                                                      </select>
                                                </div>

                                                <div>
                                                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Discount Value</label>
                                                      <input
                                                            type="number"
                                                            required
                                                            disabled={discountType === "free_delivery"}
                                                            value={discountType === "free_delivery" ? "" : discountValue}
                                                            onChange={(e) => setDiscountValue(Number(e.target.value))}
                                                            className="w-full px-3.5 py-2 rounded-xl border border-border bg-gray-50 focus:bg-white text-sm focus:ring-1 focus:ring-primary outline-hidden disabled:bg-gray-200 disabled:cursor-not-allowed"
                                                      />
                                                </div>

                                                <div>
                                                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Max Discount (₹)</label>
                                                      <input
                                                            type="number"
                                                            value={maxDiscountAmount}
                                                            onChange={(e) => setMaxDiscountAmount(Number(e.target.value))}
                                                            placeholder="0 for unlimited"
                                                            disabled={discountType !== "percentage"}
                                                            className="w-full px-3.5 py-2 rounded-xl border border-border bg-gray-50 focus:bg-white text-sm focus:ring-1 focus:ring-primary outline-hidden disabled:bg-gray-200 disabled:cursor-not-allowed"
                                                      />
                                                      {discountType === "percentage" && (
                                                            <p className="text-[10px] text-gray-400 mt-1">Cap the rupee discount. 0 = no cap (full {discountValue}% applied).</p>
                                                      )}
                                                </div>

                                                <div>
                                                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Min Order (₹)</label>
                                                      <input
                                                            type="number"
                                                            value={minOrderAmount}
                                                            onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                                                            className="w-full px-3.5 py-2 rounded-xl border border-border bg-gray-50 focus:bg-white text-sm focus:ring-1 focus:ring-primary outline-hidden"
                                                      />
                                                </div>

                                                <div>
                                                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Expiry Date</label>
                                                      <input
                                                            type="date"
                                                            required
                                                            value={expiryDate}
                                                            onChange={(e) => setExpiryDate(e.target.value)}
                                                            className="w-full px-3.5 py-2 rounded-xl border border-border bg-gray-50 text-sm focus:ring-1 focus:ring-primary outline-hidden cursor-pointer"
                                                      />
                                                </div>

                                                <div>
                                                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Usage Limit</label>
                                                      <input
                                                            type="number"
                                                            value={usageLimit}
                                                            onChange={(e) => setUsageLimit(Number(e.target.value))}
                                                            placeholder="0 for unlimited"
                                                            className="w-full px-3.5 py-2 rounded-xl border border-border bg-gray-50 focus:bg-white text-sm focus:ring-1 focus:ring-primary outline-hidden"
                                                      />
                                                </div>

                                                <div>
                                                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Per User Limit</label>
                                                      <input
                                                            type="number"
                                                            value={perUserLimit}
                                                            onChange={(e) => setPerUserLimit(Number(e.target.value))}
                                                            className="w-full px-3.5 py-2 rounded-xl border border-border bg-gray-50 focus:bg-white text-sm focus:ring-1 focus:ring-primary outline-hidden"
                                                      />
                                                </div>

                                                <div>
                                                      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Coupon Scope</label>
                                                      <select
                                                            value={couponTypeForm}
                                                            onChange={(e) => setCouponTypeForm(e.target.value as any)}
                                                            className="w-full px-3.5 py-2 rounded-xl border border-border bg-gray-50 text-sm focus:ring-1 focus:ring-primary outline-hidden cursor-pointer"
                                                      >
                                                            <option value="global">Global (System-wide)</option>
                                                            <option value="restaurant">Restaurant Specific</option>
                                                      </select>
                                                </div>

                                                {couponTypeForm === "restaurant" && (
                                                      <div className="col-span-2">
                                                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Restaurant ID</label>
                                                            <input
                                                                  type="text"
                                                                  required
                                                                  placeholder="Enter target restaurant _id"
                                                                  value={restaurantId}
                                                                  onChange={(e) => setRestaurantId(e.target.value)}
                                                                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-gray-50 focus:bg-white text-sm focus:ring-1 focus:ring-primary outline-hidden"
                                                            />
                                                      </div>
                                                )}
                                          </div>

                                          {/* Form Actions */}
                                          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border mt-5">
                                                <button
                                                      type="button"
                                                      onClick={() => setIsCreateOpen(false)}
                                                      className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
                                                >
                                                      Cancel
                                                </button>
                                                <button
                                                      type="submit"
                                                      className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-primary/95 cursor-pointer"
                                                >
                                                      Save Coupon
                                                </button>
                                          </div>
                                    </form>
                              </div>
                        </div>
                  )}
            </div>
      );
};

export default AdminCoupons;
