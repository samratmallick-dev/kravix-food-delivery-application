import { useParams, useNavigate } from "react-router-dom";
import type { IMenuItem, IRestaurant } from "../types/types";
import { useEffect, useState } from "react";
import { fetchSingleRestaurant } from "../utils/restaurant.api";
import { getAllMenuItems } from "../utils/menu.api";
import { getRestaurantReviews, reportReview } from "../utils/review.api";
import RestaurantProfile from "../components/restaurant/restaurantProfile";
import Menuitems from "../components/restaurant/menuitems";
import { useAppData } from "../context/AppContext";
import { ShoppingCart, Star, MessageSquare, AlertTriangle } from "lucide-react";
import { useMobile } from "../components/common/useMobile";
import { useSocket } from "../context/SocketContext";
import AppSkeleton from "../components/common/AppSkeleton";
import toast from "react-hot-toast";

const CustomerRestaurantPage = () => {
      const { id } = useParams();
      const navigate = useNavigate();
      const { cart } = useAppData();
      const isMobile = useMobile();
      const { socket } = useSocket();

      const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
      const [menuItem, setMenuItem] = useState<IMenuItem[]>([]);
      const [loading, setLoading] = useState(true);
      const [activeTab, setActiveTab] = useState<"menu" | "reviews">("menu");

      const fetchRestaurant = async () => {
            try {
                  const data = await fetchSingleRestaurant(id!);
                  setRestaurant(data.data || null);
            } catch (error: any) {
                  console.log(error);
                  if (error.status === 404) {
                        toast.error("Restaurant not found.");
                        navigate("/");
                  }
            } finally {
                  setLoading(false);
            }
      };

      const fetchMenuItem = async () => {
            try {
                  const data = await getAllMenuItems(id!);
                  setMenuItem(Array.isArray(data.data) ? data.data : []);
            } catch (error) {
                  console.log(error);
            }
      };

      useEffect(() => {
            if (id) {
                  fetchRestaurant();
                  fetchMenuItem();
            }
      }, [id]);

      useEffect(() => {
            if (!socket || !id) return;

            socket.emit("join:restaurant", id);

            const onStatus = ({ isOpen }: { isOpen: boolean }) => {
                  setRestaurant((prev) => prev ? { ...prev, isOpen } : prev);
            };
            const onVerified = ({ isVerified }: { isVerified: boolean }) => {
                  setRestaurant((prev) => prev ? { ...prev, isVerified } : prev);
            };
            const onDeleted = () => {
                  toast.error("This restaurant is no longer available.");
                  navigate("/");
            };
            const onAvailability = ({ itemId, isAvailable }: { itemId: string; isAvailable: boolean }) => {
                  setMenuItem((prev) =>
                        prev.map((m) => m._id === itemId ? { ...m, isAvailable } : m)
                  );
            };

            socket.on("restaurant:status", onStatus);
            socket.on("restaurant:verified", onVerified);
            socket.on("restaurant:deleted", onDeleted);
            socket.on("menuitem:availability", onAvailability);

            return () => {
                  socket.off("restaurant:status", onStatus);
                  socket.off("restaurant:verified", onVerified);
                  socket.off("restaurant:deleted", onDeleted);
                  socket.off("menuitem:availability", onAvailability);
            };
      }, [socket, id]);

      if (loading) return <AppSkeleton />;

      if (!restaurant) {
            return (
                  <div className="flex items-center justify-center h-screen">
                        <p className="text-xl font-semibold">No Restaurant found with this id: {id}</p>
                  </div>
            );
      }

      return (
            <div className="w-full min-h-auto bg-background">
                  <RestaurantProfile
                        restaurant={restaurant} onUpdate={setRestaurant} isSeller={false}
                        fetchMyRestaurant={fetchRestaurant}
                  />
                  <div className="container-app p-4">
                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 mb-5">
                              <button
                                    onClick={() => setActiveTab("menu")}
                                    className={`pb-3 px-6 font-semibold text-sm transition-all duration-200 border-b-2 ${
                                          activeTab === "menu"
                                                ? "border-primary text-primary"
                                                : "border-transparent text-gray-400 hover:text-gray-600"
                                    }`}
                              >
                                    Menu
                              </button>
                              <button
                                    onClick={() => setActiveTab("reviews")}
                                    className={`pb-3 px-6 font-semibold text-sm transition-all duration-200 border-b-2 ${
                                          activeTab === "reviews"
                                                ? "border-primary text-primary"
                                                : "border-transparent text-gray-400 hover:text-gray-600"
                                    }`}
                              >
                                    Reviews & Ratings
                              </button>
                        </div>

                        {activeTab === "menu" ? (
                              <Menuitems items={menuItem} onItemDelete={() => {}} isSeller={false} />
                        ) : (
                              <RestaurantReviewsSection restaurantId={restaurant._id} />
                        )}
                  </div>
                  {cart.length > 0 && (
                        <button
                              onClick={() => {
                                    navigate("/cart");
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="fixed left-1/2 -translate-x-1/2 flex items-center gap-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all z-50"
                              style={{ bottom: isMobile ? 16 : 24, padding: isMobile ? "10px 20px" : "12px 24px", fontSize: isMobile ? "0.875rem" : "1rem" }}
                        >
                              <ShoppingCart size={isMobile ? 16 : 18} />
                              View Cart ({cart.length})
                        </button>
                  )}
            </div>
      );
}

import type { IReview } from "../types/types";
import type { ReviewRatingsSummary } from "../utils/review.api";

const RestaurantReviewsSection = ({ restaurantId }: { restaurantId: string }) => {
      const [reviews, setReviews] = useState<IReview[]>([]);
      const [summary, setSummary] = useState<ReviewRatingsSummary | null>(null);
      const [loading, setLoading] = useState(true);
      const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | null>(null);
      const [sortBy, setSortBy] = useState<"createdAt" | "rating">("createdAt");
      const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
      const [reportingId, setReportingId] = useState<string | null>(null);
      const [reportReason, setReportReason] = useState("");

      const fetchReviews = async () => {
            setLoading(true);
            try {
                  const params: any = {};
                  if (selectedRatingFilter !== null) {
                        params.rating = selectedRatingFilter;
                  }
                  params.sortBy = sortBy;
                  params.order = sortOrder;

                  const data = await getRestaurantReviews(restaurantId, params);

                  if (data) {
                        setReviews(data.data?.reviews || []);
                        setSummary(data.data?.ratingsSummary || null);
                  }
            } catch (error) {
                  console.error("Failed to fetch restaurant reviews:", error);
                  toast.error("Failed to load reviews.");
            } finally {
                  setLoading(false);
            }
      };

      useEffect(() => {
            fetchReviews();
      }, [restaurantId, selectedRatingFilter, sortBy, sortOrder]);

      const handleReport = async (reviewId: string) => {
            if (!reportReason.trim()) {
                  toast.error("Please enter a reason for reporting.");
                  return;
            }
            try {
                  await reportReview(reviewId, reportReason);
                  toast.success("Review reported and sent for moderation.");
                  setReportingId(null);
                  setReportReason("");
                  fetchReviews();
            } catch (error: any) {
                  toast.error(error?.response?.data?.message || "Failed to report review.");
            }
      };

      if (loading && !summary) {
            return (
                  <div className="space-y-4">
                        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
                        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
                  </div>
            );
      }

      const getProgressPercent = (count: number) => {
            if (!summary || summary.totalReviews === 0) return 0;
            return Math.round((count / summary.totalReviews) * 100);
      };

      return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
                  <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl p-5 shadow-sm space-y-4 h-fit md:col-span-1">
                        <h3 className="font-bold text-gray-800 text-sm">Rating Details</h3>
                        {summary ? (
                              <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                          <div className="text-center">
                                                <div className="text-4xl font-extrabold text-gray-800">{summary.averageRating}</div>
                                                <div className="flex justify-center mt-1">
                                                      {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star
                                                                  key={star}
                                                                  size={14}
                                                                  className={
                                                                        star <= Math.round(summary.averageRating)
                                                                              ? "text-yellow-400 fill-yellow-400"
                                                                              : "text-gray-200 fill-gray-200"
                                                                  }
                                                            />
                                                      ))}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1 font-medium">{summary.totalReviews} ratings</div>
                                          </div>
                                          
                                          <div className="flex-1 space-y-1">
                                                {[5, 4, 3, 2, 1].map((stars) => {
                                                      const starKey = `star${stars}` as keyof ReviewRatingsSummary;
                                                      const count = (summary[starKey] as number) || 0;
                                                      const percent = getProgressPercent(count);
                                                      return (
                                                            <div key={stars} className="flex items-center gap-2 text-xs">
                                                                  <span className="w-3 text-gray-500 font-medium">{stars}</span>
                                                                  <Star size={10} className="text-yellow-400 fill-yellow-400 shrink-0" />
                                                                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                        <div
                                                                              className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                                                                              style={{ width: `${percent}%` }}
                                                                        />
                                                                  </div>
                                                                  <span className="w-8 text-right text-gray-400 font-mono">{count}</span>
                                                            </div>
                                                      );
                                                })}
                                          </div>
                                    </div>
                              </div>
                        ) : (
                              <p className="text-xs text-gray-400 text-center py-4">No rating summary available.</p>
                        )}
                  </div>

                  <div className="md:col-span-2 space-y-4">
                        <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-center justify-between">
                              <div className="flex flex-wrap gap-1.5">
                                    <button
                                          onClick={() => setSelectedRatingFilter(null)}
                                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                                selectedRatingFilter === null
                                                      ? "bg-primary text-white"
                                                      : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                          }`}
                                    >
                                          All
                                    </button>
                                    {[5, 4, 3, 2, 1].map((star) => (
                                          <button
                                                key={star}
                                                onClick={() => setSelectedRatingFilter(star)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                                                      selectedRatingFilter === star
                                                            ? "bg-primary text-white"
                                                            : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                                }`}
                                          >
                                                {star} <Star size={10} className={selectedRatingFilter === star ? "fill-white" : "fill-gray-400"} />
                                          </button>
                                    ))}
                              </div>

                              <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400 font-medium">Sort:</span>
                                    <select
                                          value={`${sortBy}-${sortOrder}`}
                                          onChange={(e) => {
                                                const [field, order] = e.target.value.split("-");
                                                setSortBy(field as any);
                                                setSortOrder(order as any);
                                          }}
                                          className="text-xs bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-1.5 text-gray-600 font-semibold focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all cursor-pointer"
                                    >
                                          <option value="createdAt-desc">Newest First</option>
                                          <option value="rating-desc">Highest Rating</option>
                                          <option value="rating-asc">Lowest Rating</option>
                                    </select>
                              </div>
                        </div>

                        {reviews.length > 0 ? (
                              <div className="space-y-3">
                                    {reviews.map((review) => {
                                          const reviewDate = new Date(review.createdAt).toLocaleDateString("en-IN", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric"
                                          });

                                          return (
                                                <div
                                                      key={review._id}
                                                      className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl p-4 shadow-sm space-y-2.5 transition-all hover:translate-y-[-1px] hover:shadow-md"
                                                >
                                                      <div className="flex justify-between items-start">
                                                            <div className="flex items-center gap-3">
                                                                  {review.userImage ? (
                                                                        <img
                                                                              src={review.userImage}
                                                                              alt={review.userName}
                                                                              className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-100"
                                                                              onError={(e) => {
                                                                                    (e.target as HTMLElement).style.display = 'none';
                                                                              }}
                                                                        />
                                                                  ) : (
                                                                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                                                              {review.userName.charAt(0).toUpperCase()}
                                                                        </div>
                                                                  )}
                                                                  <div>
                                                                        <p className="font-semibold text-gray-800 text-xs">{review.userName}</p>
                                                                        <p className="text-[10px] text-gray-400">{reviewDate}</p>
                                                                  </div>
                                                            </div>

                                                            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-100">
                                                                  <span className="text-xs font-bold text-yellow-600">{review.rating}</span>
                                                                  <Star size={10} className="text-yellow-400 fill-yellow-400" />
                                                            </div>
                                                      </div>

                                                      <p className="text-xs text-gray-600 leading-relaxed font-medium">
                                                            "{review.comment}"
                                                      </p>

                                                      <div className="flex justify-between items-center pt-1.5 border-t border-gray-50">
                                                            <span className="text-[10px] text-gray-400 capitalize">
                                                                  Reviewed order
                                                            </span>

                                                            {reportingId === review._id ? (
                                                                  <div className="flex items-center gap-1.5 w-full max-w-xs mt-2 md:mt-0">
                                                                        <input
                                                                              type="text"
                                                                              value={reportReason}
                                                                              onChange={(e) => setReportReason(e.target.value)}
                                                                              placeholder="Reason..."
                                                                              className="flex-1 text-[11px] bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 focus:outline-none"
                                                                        />
                                                                        <button
                                                                              onClick={() => handleReport(review._id)}
                                                                              className="text-[10px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg transition-all"
                                                                        >
                                                                              Submit
                                                                        </button>
                                                                        <button
                                                                              onClick={() => {
                                                                                    setReportingId(null);
                                                                                    setReportReason("");
                                                                              }}
                                                                              className="text-[10px] font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded-lg transition-all"
                                                                        >
                                                                              Cancel
                                                                        </button>
                                                                  </div>
                                                            ) : (
                                                                  <button
                                                                        onClick={() => setReportingId(review._id)}
                                                                        className="text-[10px] text-gray-400 hover:text-red-500 font-semibold flex items-center gap-1 transition-colors"
                                                                        title="Report this review"
                                                                  >
                                                                        <AlertTriangle size={10} /> Report
                                                                  </button>
                                                            )}
                                                      </div>
                                                </div>
                                          );
                                    })}
                              </div>
                        ) : (
                              <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl p-8 text-center shadow-sm">
                                    <MessageSquare className="mx-auto text-gray-300 mb-2" size={32} />
                                    <p className="text-xs font-semibold text-gray-500">No reviews found.</p>
                                    <p className="text-[11px] text-gray-400 mt-1">Be the first to review this restaurant by ordering now!</p>
                              </div>
                        )}
                  </div>
            </div>
      );
};

export default CustomerRestaurantPage;
