import { useEffect, useState } from "react";
import { getAllReviews, moderateReview } from "@/services/api/admin.services";
import {
      MessageSquare,
      Check,
      AlertTriangle,
      Trash2,
      User,
      Star,
      ShieldAlert,
      XCircle,
      Search
} from "lucide-react";
import toast from "react-hot-toast";


interface Review {
      _id: string;
      userId: string;
      userName: string;
      userImage: string;
      orderId: string;
      restaurantId: string;
      menuItemId: string | null;
      riderId: string | null;
      rating: number;
      comment: string;
      type: "restaurant" | "menu_item" | "rider";
      isReported: boolean;
      reportReason: string;
      status: "pending" | "approved" | "flagged";
      createdAt: string;
      updatedAt: string;
}

interface ConfirmDialog {
      reviewId: string;
      action: "approve" | "reject" | "delete";
}

const AdminReviews = () => {
      const [reviews, setReviews] = useState<Review[]>([]);
      const [loading, setLoading] = useState(true);
      const [filterReported, setFilterReported] = useState<boolean>(false);
      const [searchQuery, setSearchQuery] = useState("");
      const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);

      const fetchReviews = async () => {
            setLoading(true);
            try {
                  const res = await getAllReviews({ reportedOnly: filterReported.toString() });
                  if (res && res.success) {
                        setReviews(res.data);
                  }
            } catch (error: any) {
                  console.error("Failed to load reviews:", error);
                  toast.error(error.message || "Failed to fetch reviews");
            } finally {
                  setLoading(false);
            }
      };

      useEffect(() => {
            fetchReviews();
      }, [filterReported]);

      const handleModerateReview = async (id: string, action: "approve" | "reject" | "delete") => {
            try {
                  const res = await moderateReview(id, { action } as any);

                  if (res && res.success) {
                        toast.success(res.message || `Review moderated successfully!`);
                        if (action === "delete") {
                              setReviews(prev => prev.filter(r => r._id !== id));
                        } else {
                              setReviews(prev => prev.map(r => r._id === id ? {
                                    ...r,
                                    status: action === "approve" ? "approved" : "flagged",
                                    isReported: action === "approve" ? false : r.isReported,
                                    reportReason: action === "approve" ? "" : r.reportReason
                              } : r));
                        }
                  }
            } catch (error: any) {
                  console.error(`Error moderating review (${action}):`, error);
                  toast.error(error.message || `Failed to perform ${action} action`);
            }
      };

      const executeModeration = async () => {
            if (!confirmDialog) return;
            await handleModerateReview(confirmDialog.reviewId, confirmDialog.action);
            setConfirmDialog(null);
      };

      const renderStars = (rating: number) => {
            return (
                  <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                    key={i}
                                    size={14}
                                    className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-250"}
                              />
                        ))}
                  </div>
            );
      };

      const filteredReviews = reviews.filter(r =>
            r.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.orderId.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return (
            <div className="p-4 sm:p-6 space-y-6">
                  {/* Title & Filters */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    <MessageSquare className="text-primary" size={24} />
                                    Customer Reviews & Ratings
                              </h1>
                              <p className="text-xs sm:text-sm text-gray-500">
                                    Moderate restaurant, food item, and delivery rider reviews.
                              </p>
                        </div>
                        <div className="flex items-center gap-2">
                              <button
                                    onClick={() => setFilterReported(false)}
                                    className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                                          !filterReported
                                                ? "bg-primary text-white shadow-xs"
                                                : "bg-white border border-border text-gray-600 hover:text-gray-800"
                                    }`}
                              >
                                    All Reviews
                              </button>
                              <button
                                    onClick={() => setFilterReported(true)}
                                    className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                                          filterReported
                                                ? "bg-red-600 text-white shadow-xs"
                                                : "bg-white border border-border text-gray-600 hover:text-gray-850"
                                    }`}
                              >
                                    <ShieldAlert size={14} />
                                    Reported Only
                              </button>
                        </div>
                  </div>

                  {/* Search bar */}
                  <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                              type="text"
                              placeholder="Search reviews by reviewer, order ID, or comment text..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
                        />
                  </div>

                  {/* Reviews List */}
                  {loading ? (
                        <div className="space-y-4">
                              {[1, 2, 3].map((i) => (
                                    <div key={i} className="w-full h-32 bg-white rounded-2xl border border-border animate-pulse" />
                              ))}
                        </div>
                  ) : filteredReviews.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                              {filteredReviews.map((review) => (
                                    <div
                                          key={review._id}
                                          className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition flex flex-col md:flex-row gap-4 justify-between items-start md:items-center ${
                                                review.status === "flagged" ? "border-red-200 bg-red-50/20" : "border-border"
                                          }`}
                                    >
                                          {/* Review Detail Column */}
                                          <div className="flex-1 space-y-2">
                                                {/* User Info & Badges */}
                                                <div className="flex flex-wrap items-center gap-3">
                                                      <div className="flex items-center gap-2">
                                                            {review.userImage ? (
                                                                  <img
                                                                        src={review.userImage}
                                                                        alt={review.userName}
                                                                        className="w-8 h-8 rounded-full object-cover border border-border"
                                                                  />
                                                            ) : (
                                                                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-450 border border-border">
                                                                        <User size={14} />
                                                                  </div>
                                                            )}
                                                            <span className="font-bold text-gray-800 text-sm">{review.userName}</span>
                                                      </div>

                                                      <div className="border-l border-border h-4" />

                                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium text-[9px] uppercase tracking-wider ${
                                                            review.type === "restaurant"
                                                                  ? "bg-green-50 text-green-700 border border-green-200"
                                                                  : review.type === "menu_item"
                                                                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                                                                        : "bg-purple-50 text-purple-700 border border-purple-200"
                                                      }`}>
                                                            {review.type === "menu_item" ? "dish" : review.type}
                                                      </span>

                                                      {review.status === "flagged" && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
                                                                  <XCircle size={10} /> Flagged
                                                            </span>
                                                      )}
                                                </div>

                                                {/* Star rating & Date */}
                                                <div className="flex items-center gap-2.5">
                                                      {renderStars(review.rating)}
                                                      <span className="text-[10px] text-gray-400">
                                                            {new Date(review.createdAt).toLocaleDateString("en-IN", {
                                                                  day: "numeric",
                                                                  month: "short",
                                                                  year: "numeric"
                                                            })}
                                                      </span>
                                                </div>

                                                {/* Review Comment */}
                                                <p className="text-gray-700 text-sm leading-relaxed italic">
                                                      "{review.comment}"
                                                </p>

                                                {/* Order context IDs */}
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[9px] text-gray-450 pt-1">
                                                      <span>Order: {review.orderId}</span>
                                                      {review.type === "menu_item" && review.menuItemId && (
                                                            <span>Dish ID: {review.menuItemId}</span>
                                                      )}
                                                      {review.type === "rider" && review.riderId && (
                                                            <span>Rider ID: {review.riderId}</span>
                                                      )}
                                                      <span>Restaurant ID: {review.restaurantId}</span>
                                                </div>

                                                {/* Report Reason banner */}
                                                {review.isReported && (
                                                      <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-3.5 py-2 mt-2">
                                                            <AlertTriangle size={15} className="text-yellow-600 shrink-0 mt-0.5" />
                                                            <div>
                                                                  <p className="text-xs font-bold text-yellow-800">Reported Flag</p>
                                                                  <p className="text-[11px] text-yellow-600">Reason: {review.reportReason}</p>
                                                            </div>
                                                      </div>
                                                )}
                                          </div>

                                          {/* Moderation Actions Column */}
                                          <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 border-border pt-3 md:pt-0 shrink-0">
                                                {review.status !== "approved" && (
                                                      <button
                                                            onClick={() => setConfirmDialog({ reviewId: review._id, action: "approve" })}
                                                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                                                      >
                                                            <Check size={14} />
                                                            Approve
                                                      </button>
                                                )}
                                                {review.status !== "flagged" && (
                                                      <button
                                                            onClick={() => setConfirmDialog({ reviewId: review._id, action: "reject" })}
                                                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                                                      >
                                                            <AlertTriangle size={14} />
                                                            Flag
                                                      </button>
                                                )}
                                                <button
                                                      onClick={() => setConfirmDialog({ reviewId: review._id, action: "delete" })}
                                                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                                                >
                                                      <Trash2 size={14} />
                                                      Delete
                                                </button>
                                          </div>
                                    </div>
                              ))}
                        </div>
                  ) : (
                        <div className="text-center py-12 bg-white rounded-2xl border border-border">
                              <ShieldAlert className="text-gray-300 mx-auto mb-3" size={40} />
                              <p className="text-gray-500 font-medium">No reviews found matching the filters</p>
                        </div>
                  )}

                  {/* Confirm Dialog */}
                  {confirmDialog && (() => {
                        const isDelete = confirmDialog.action === "delete";
                        const isFlag = confirmDialog.action === "reject";
                        return (
                              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in zoom-in duration-200">
                                          <h3 className="text-lg font-bold text-gray-900">
                                                {isDelete ? "Delete Review?" : isFlag ? "Flag Review?" : "Approve Review?"}
                                          </h3>
                                          <p className="text-sm text-gray-600">
                                                {isDelete
                                                      ? "This will permanently delete this review and it cannot be undone."
                                                      : isFlag
                                                            ? "This will flag the review as spam and hide it from public view."
                                                            : "This will approve and restore the review to public view."
                                                }
                                          </p>
                                          <div className="flex items-center gap-3 pt-1">
                                                <button
                                                      onClick={() => setConfirmDialog(null)}
                                                      className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                                                >
                                                      Cancel
                                                </button>
                                                <button
                                                      onClick={executeModeration}
                                                      className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition cursor-pointer ${
                                                            isDelete
                                                                  ? "bg-red-600 hover:bg-red-700"
                                                                  : isFlag
                                                                        ? "bg-yellow-500 hover:bg-yellow-600"
                                                                        : "bg-green-600 hover:bg-green-700"
                                                      }`}
                                                >
                                                      {isDelete ? "Delete" : isFlag ? "Flag" : "Approve"}
                                                </button>
                                          </div>
                                    </div>
                              </div>
                        );
                  })()}
            </div>
      );
};

export default AdminReviews;
