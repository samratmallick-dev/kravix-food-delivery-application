import { useSearchParams, Link } from "react-router-dom";
import Hero from "../components/home/hero";
import { useAppData } from "../context/AppContext";
import type { IRestaurant } from "../types/types";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getNearestRestaurant } from "../utils/restaurant.api";
import FeatureBanmner from "../components/home/featureBanner";
import RestaurantsCard from "../components/restaurant/restaurantsCard";
import { useMobile } from "../components/common/useMobile";
import { useSocket } from "../context/SocketContext";
import AppSkeleton from "../components/common/AppSkeleton";
import SEO from "../components/common/SEO";
import StructuredData from "../components/common/StructuredData";
import { Zap, Shield, Clock, Heart, Loader, MapPin, ChevronDown } from "lucide-react";
import { getAvailableCategories } from "../utils/menu.api";
import type { ICategory } from "../utils/menu.api";

const CATEGORY_PLACEHOLDER = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300&auto=format&fit=crop&fm=webp";

const Home = () => {

      const { location, locationLoading, detectUserLocation } = useAppData();
      const [searchParams] = useSearchParams();
      const isMobile = useMobile();
      const [activeFaq, setActiveFaq] = useState<number | null>(null);
      const { socket } = useSocket();

      const search = searchParams.get("search") || "";

      const [retaurants, setRestaurants] = useState<IRestaurant[]>([]);
      const [loading, setLoading] = useState(true);
      const [searching, setSearching] = useState(false);

      const [categories, setCategories] = useState<ICategory[]>([]);
      const [categoriesLoading, setCategoriesLoading] = useState(true);
      const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

      const fetchCategories = async () => {
            try {
                  setCategoriesLoading(true);
                  const response = await getAvailableCategories();
                  if (response.success && response.data) {
                        setCategories(response.data);
                  }
            } catch (error) {
                  console.error("Failed to fetch available categories:", error);
            } finally {
                  setCategoriesLoading(false);
            }
      };

      useEffect(() => {
            fetchCategories();
      }, []);

      const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
            const R = 6371;
            const dLat = ((lat2 - lat1) * Math.PI) / 180;
            const dLon = ((lon2 - lon1) * Math.PI) / 180;
            const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return +(R * c).toFixed(2);
      };

      const fetchRestaurant = async () => {
            if (!location?.latitude || !location.longitude) {
                  return;
            }
            try {
                  if (search) setSearching(true);
                  else setLoading(true);
                  const data = await getNearestRestaurant({
                        latitude: location.latitude,
                        longitude: location.longitude,
                        search
                  });
                  setRestaurants((data.data || []).filter((r) => !!r._id));
                  setLoading(false);
                  setSearching(false);
            } catch (error: any) {
                  console.log(error);
                  toast.error(error.response?.data?.message || "Failed to fetch restaurants");
            }
      };

      useEffect(() => {
            if (!location) {
                  setLoading(false);
                  return;
            }
            fetchRestaurant();
      }, [location, search]);

      const handleRequestLocation = () => {
            detectUserLocation(true);
      };

      useEffect(() => {
            if (!socket) return;

            retaurants.forEach((r) => socket.emit("join:restaurant", r._id));

            socket.on("restaurant:status", ({ isOpen, restaurantId }: { isOpen: boolean; restaurantId: string }) => {
                  setRestaurants((prev) =>
                        prev.map((r) => r._id === restaurantId ? { ...r, isOpen } : r)
                  );
            });

            socket.on("restaurant:verified", ({ restaurantId, isVerified }: { restaurantId: string; isVerified: boolean }) => {
                  if (isVerified) {
                        fetchRestaurant();
                  } else {
                        setRestaurants((prev) => prev.filter((r) => r._id !== restaurantId));
                  }
            });

            socket.on("restaurant:deleted", ({ restaurantId }: { restaurantId: string }) => {
                  setRestaurants((prev) => prev.filter((r) => r._id !== restaurantId));
            });

            socket.on("restaurant:ownerBlocked", ({ restaurantId, isBlocked }: { restaurantId: string; isBlocked: boolean }) => {
                  if (isBlocked) {
                        setRestaurants((prev) => prev.filter((r) => r._id !== restaurantId));
                  } else {
                        fetchRestaurant();
                  }
            });

            return () => {
                  socket.off("restaurant:status");
                  socket.off("restaurant:verified");
                  socket.off("restaurant:deleted");
                  socket.off("restaurant:ownerBlocked");
            };
      }, [socket, retaurants.length]);

      if (loading && !searching) {
            return <AppSkeleton />;
      }

      const homeSchema = {
            "@context": "https://schema.org",
            "@graph": [
                  {
                        "@type": "Organization",
                        "@id": "https://kravix-nu.vercel.app/#organization",
                        "name": "Kravix",
                        "url": "https://kravix-nu.vercel.app/",
                        "logo": "https://kravix-nu.vercel.app/android-chrome-512x512.png",
                        "sameAs": [
                              "https://www.facebook.com/kravix",
                              "https://twitter.com/kravix",
                              "https://www.instagram.com/kravix",
                              "https://github.com/kravix"
                        ]
                  },
                  {
                        "@type": "WebSite",
                        "@id": "https://kravix-nu.vercel.app/#website",
                        "url": "https://kravix-nu.vercel.app/",
                        "name": "Kravix",
                        "description": "Order Bengali, Indian & Multi-Cuisine Food Online",
                        "potentialAction": {
                              "@type": "SearchAction",
                              "target": {
                                    "@type": "EntryPoint",
                                    "urlTemplate": "https://kravix-nu.vercel.app/search?search={search_term_string}"
                              },
                              "query-input": "required name=search_term_string"
                        }
                  },
                  {
                        "@type": "FoodDeliveryService",
                        "@id": "https://kravix-nu.vercel.app/#fooddeliveryservice",
                        "name": "Kravix Food Delivery",
                        "url": "https://kravix-nu.vercel.app/",
                        "logo": "https://kravix-nu.vercel.app/android-chrome-512x512.png",
                        "description": "Fast and reliable online food delivery service for authentic Bengali, Indian, Asian, and international cuisines.",
                        "provider": {
                              "@type": "Organization",
                              "name": "Kravix",
                              "url": "https://kravix-nu.vercel.app/"
                        },
                        "areaServed": [
                              {
                                    "@type": "State",
                                    "name": "West Bengal",
                                    "sameAs": "https://en.wikipedia.org/wiki/West_Bengal"
                              },
                              {
                                    "@type": "City",
                                    "name": "Kolkata",
                                    "sameAs": "https://en.wikipedia.org/wiki/Kolkata"
                              }
                        ],
                        "offers": {
                              "@type": "Offer",
                              "priceCurrency": "INR"
                        }
                  }
            ]
      };

      return (
            <div className="space-y-8 bg-background pb-12">
                  <SEO
                        title="Kravix | Bengali, Indian & Multi-Cuisine Food Delivery"
                        description="Order authentic Bengali, Indian, Asian and international food online with Kravix. Fast delivery, secure ordering and delicious meals delivered to your doorstep."
                        path="/"
                  />
                  <StructuredData data={homeSchema} />

                  <Hero />
                  <FeatureBanmner />

                  <section aria-labelledby="why-kravix-heading" className="container-app py-6">
                        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-10 shadow-xs space-y-8">
                              <div className="text-center max-w-xl mx-auto space-y-2">
                                    <h2 id="why-kravix-heading" className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight">Why Choose Kravix Food Delivery?</h2>
                                    <p className="text-xs md:text-sm text-text-secondary font-semibold">We offer the smartest way to order fresh and delicious food online.</p>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                          { icon: Zap, title: "Lightning Fast Delivery", desc: "Our localized riders ensure your favorite meals arrive hot and fresh within 30 minutes of preparation.", border: "hover:border-amber-200 hover:shadow-amber-100/40", badge: "text-amber-500 bg-amber-500/10" },
                                          { icon: Shield, title: "Hygiene Guaranteed", desc: "We partner exclusively with restaurants that maintain strict contactless preparation standards.", border: "hover:border-emerald-200 hover:shadow-emerald-100/40", badge: "text-emerald-500 bg-emerald-500/10" },
                                          { icon: Clock, title: "Live Order Tracking", desc: "Track your food order in real-time from the kitchen counter all the way to your door.", border: "hover:border-blue-200 hover:shadow-blue-100/40", badge: "text-blue-500 bg-blue-500/10" },
                                          { icon: Heart, title: "AI-Powered Recommendations", desc: "Get smart recommendations based on your cuisine preferences and location history.", border: "hover:border-rose-200 hover:shadow-rose-100/40", badge: "text-rose-500 bg-rose-500/10" }
                                    ].map((item, idx) => (
                                          <div key={idx} className={`flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-gray-100 shadow-3xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group ${item.border}`}>
                                                <div className={`w-12 h-12 rounded-2xl ${item.badge} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}>
                                                      <item.icon className="w-5 h-5" />
                                                </div>
                                                <h3 className="text-xs md:text-sm font-bold text-gray-800 mb-2">{item.title}</h3>
                                                <p className="text-[11px] md:text-xs text-text-secondary leading-relaxed font-semibold">{item.desc}</p>
                                          </div>
                                    ))}
                              </div>
                        </div>
                  </section>

                  <section aria-labelledby="popular-foods-heading" className="container-app py-6 space-y-5">
                        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-10 shadow-xs space-y-6">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                                    <div className="space-y-1">
                                          <h2 id="popular-foods-heading" className="text-2xl font-black text-gray-850">Popular Foods Near You</h2>
                                          <p className="text-xs text-text-secondary font-semibold">Quickly browse popular food categories in your area</p>
                                    </div>
                                    <div className="flex gap-2 text-xs font-bold text-text-secondary flex-wrap items-center">
                                          <span className="text-gray-400 font-medium mr-1.5">Popular:</span>
                                          {categoriesLoading ? (
                                                <Loader size={14} className="animate-spin text-primary" />
                                          ) : categories.length === 0 ? (
                                                <span className="text-gray-400 text-xs italic">No categories</span>
                                          ) : (
                                                categories.slice(0, 5).map((cat) => {
                                                      const isActive = selectedCategory === cat.name;
                                                      return (
                                                            <button
                                                                  key={cat.name}
                                                                  onClick={() => setSelectedCategory(isActive ? null : cat.name)}
                                                                  className={`px-3 py-1.5 rounded-full border transition-all duration-200 shadow-2xs hover:scale-[1.02] active:scale-[0.98] cursor-pointer font-bold text-[11px] ${
                                                                        isActive 
                                                                        ? "bg-primary text-white border-transparent"
                                                                        : "bg-gray-55/60 hover:bg-primary hover:text-white border-gray-100/60 hover:border-transparent text-text-secondary"
                                                                  }`}
                                                            >
                                                                  {cat.name}
                                                            </button>
                                                      );
                                                })
                                          )}
                                    </div>
                              </div>

                              {categoriesLoading ? (
                                    <div className="flex flex-col items-center justify-center py-14 gap-2.5">
                                          <Loader size={32} className="animate-spin text-primary" />
                                          <span className="text-xs text-gray-400 font-semibold">Loading categories...</span>
                                    </div>
                              ) : categories.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50/40 border border-dashed border-gray-150 rounded-2xl">
                                          <p className="text-sm text-gray-500 font-semibold">No food categories are available at the moment.</p>
                                    </div>
                              ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                          {(selectedCategory ? categories.filter(c => c.name === selectedCategory) : categories).map((food, idx) => (
                                                <Link 
                                                      key={idx}
                                                      to={`/search?search=${encodeURIComponent(food.name)}&type=food`}
                                                      className="group flex flex-col items-center bg-gray-50/40 hover:bg-white border border-transparent hover:border-gray-150 rounded-2xl p-3 text-center transition-all duration-300 hover:shadow-xs hover:scale-[1.03]"
                                                >
                                                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden mb-3 border border-gray-100 shadow-2xs group-hover:scale-105 transition-transform duration-300">
                                                            <img 
                                                                  src={food.image || CATEGORY_PLACEHOLDER} 
                                                                  alt={`Category ${food.name}`} 
                                                                  className="w-full h-full object-cover" 
                                                                  loading="lazy" 
                                                                  onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = CATEGORY_PLACEHOLDER;
                                                                  }}
                                                            />
                                                      </div>
                                                      <span className="text-xs sm:text-sm font-bold text-gray-800 group-hover:text-primary transition-colors">{food.name}</span>
                                                      <span className="text-[10px] text-gray-400 font-semibold mt-0.5">{food.count} dish{food.count !== 1 ? "es" : ""}</span>
                                                </Link>
                                          ))}
                                    </div>
                              )}
                        </div>
                  </section>

                  <section id="nearest-restaurants" aria-labelledby="nearest-restaurants-heading" className="container-app py-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <h2 id="nearest-restaurants-heading" className={`font-black text-gray-850 ${isMobile ? "text-xl" : "text-2xl"}`}>
                                    Your Nearest Restaurants
                              </h2>
                        </div>
                        
                        {!location ? (
                              <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-gray-100 rounded-3xl text-center shadow-xs max-w-2xl mx-auto space-y-6 animate-fadeIn">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                          <MapPin size={32} className="animate-bounce" />
                                    </div>
                                    <div className="space-y-2">
                                          <h3 className="text-lg font-bold text-gray-800">Location Access Required</h3>
                                          <p className="text-xs text-text-secondary font-semibold max-w-md mx-auto leading-relaxed">
                                                Please allow location access to discover local restaurants, calculate delivery distance, and browse menus active in your area.
                                          </p>
                                    </div>
                                    <button 
                                          onClick={handleRequestLocation}
                                          disabled={locationLoading}
                                          className="px-6 py-3 bg-primary hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                          {locationLoading ? (
                                                <>
                                                      <Loader size={16} className="animate-spin" />
                                                      Detecting Location...
                                                </>
                                          ) : (
                                                "Allow Location Access"
                                          )}
                                    </button>
                              </div>
                        ) : (
                              <>
                                    {searching && (
                                          <p className="text-sm text-gray-400 animate-pulse" aria-live="polite">Searching...</p>
                                    )}
                                    {retaurants.length > 0 ? (
                                          <div className="container-app py-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {retaurants.map((restaurant) => {
                                                      const [resLong, resLat] = restaurant.autoLocation.coordinates;
                                                      const distance = getDistanceKm(
                                                            location.latitude,
                                                            location.longitude,
                                                            resLat,
                                                            resLong
                                                      );
                                                      return <RestaurantsCard
                                                            key={restaurant._id}
                                                            id={restaurant._id}
                                                            slug={restaurant.slug}
                                                            name={restaurant.name}
                                                            image={restaurant.image ?? ""}
                                                            distance={`${distance}`}
                                                            isOpen={restaurant.isOpen}
                                                      />;
                                                })}
                                          </div>
                                    ) : (
                                          <p className="text-center text-gray-600 font-semibold py-8 bg-white border border-gray-150 rounded-2xl">No Restaurant Found...</p>
                                    )}
                              </>
                        )}
                  </section>

                  <section aria-labelledby="cuisine-heading" className="container-app py-6">
                        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-10 shadow-xs space-y-8">
                              <h2 id="cuisine-heading" className="text-2xl md:text-3xl font-black text-gray-800 text-center tracking-tight">Explore Our Curated Cuisines</h2>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[
                                          {
                                                title: "Authentic Bengali Cuisine",
                                                desc: "Savor the traditional tastes of Bengal. From delectable Macher Jhol (fish curry) and Kosha Mangsho (mutton) to sweet treats like Rosogolla and Sandesh, our partners serve it authentic.",
                                                link: "/search?search=bengali&type=food",
                                                label: "Order Bengali Food",
                                                gradient: "from-amber-500/20 to-red-500/10",
                                                border: "hover:border-amber-200 hover:shadow-amber-100/30"
                                          },
                                          {
                                                title: "Traditional Indian Specialties",
                                                desc: "Indulge in rich culinary traditions from North to South India. Experience slow-cooked biryani, buttery paneer, warm tandoori naan, and fragrant curries.",
                                                link: "/search?search=indian&type=food",
                                                label: "Order Indian Food",
                                                gradient: "from-orange-500/20 to-amber-500/10",
                                                border: "hover:border-orange-200 hover:shadow-orange-100/30"
                                          },
                                          {
                                                title: "Asian & Multi-Cuisine Delights",
                                                desc: "From Chinese dim sums and street style noodles to Italian pizzas and Continental treats, satisfy your global cravings instantly.",
                                                link: "/search?search=chinese&type=food",
                                                label: "Order Asian Food",
                                                gradient: "from-rose-500/20 to-purple-500/10",
                                                border: "hover:border-rose-200 hover:shadow-rose-100/30"
                                          }
                                    ].map((cuisine, idx) => (
                                          <article 
                                                key={idx} 
                                                className={`bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-3xs flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group ${cuisine.border}`}
                                          >
                                                <div className={`h-24 bg-linear-to-br ${cuisine.gradient} p-5 flex items-end shrink-0`}>
                                                      <h3 className="text-xs md:text-sm font-black text-gray-800 uppercase tracking-wider">{cuisine.title}</h3>
                                                </div>
                                                <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                                                      <p className="text-[11px] md:text-xs text-text-secondary leading-relaxed font-semibold">
                                                            {cuisine.desc}
                                                      </p>
                                                      <Link 
                                                            to={cuisine.link} 
                                                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                                            className="w-full text-center py-2.5 rounded-xl border border-primary/20 text-primary font-bold text-xs hover:bg-primary hover:text-white hover:border-transparent transition-all duration-300 select-none block"
                                                      >
                                                            {cuisine.label} &rarr;
                                                      </Link>
                                                </div>
                                          </article>
                                    ))}
                              </div>
                        </div>
                  </section>

                  <section aria-labelledby="faq-heading" className="container-app py-6">
                        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-10 shadow-xs space-y-8">
                              <h2 id="faq-heading" className="text-2xl md:text-3xl font-black text-gray-800 text-center tracking-tight">Kravix Food Delivery FAQs</h2>
                              <div className="max-w-2xl mx-auto space-y-4">
                                    {[
                                          { q: "Which areas does Kravix deliver to?", a: "We primarily operate in Kolkata and surrounding areas in West Bengal, delivering within a 10 KM radius of our listed partner restaurants." },
                                          { q: "How do I join as a Partner or Rider?", a: "We welcome local businesses and delivery personnel! You can register as a partner by clicking Become a Partner or apply to be a courier on the Become a Rider page." },
                                          { q: "Is there a contact number for support?", a: "Yes, you can contact our 24/7 help desk through the Contact Us page or drop an email directly to support@kravix.com." }
                                    ].map((faq, index) => {
                                          const isOpen = activeFaq === index;
                                          return (
                                                <div 
                                                      key={index} 
                                                      className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-3xs ${
                                                            isOpen ? "border-primary/20 shadow-xs ring-2 ring-primary/5" : "border-gray-100 hover:border-gray-250"
                                                      }`}
                                                >
                                                      <button
                                                            type="button"
                                                            onClick={() => setActiveFaq(isOpen ? null : index)}
                                                            className="w-full flex justify-between items-center p-5 text-left font-bold text-xs md:text-sm text-gray-850 cursor-pointer select-none focus:outline-none"
                                                      >
                                                            <span>{faq.q}</span>
                                                            <ChevronDown 
                                                                  size={16} 
                                                                  className={`text-primary transition-transform duration-300 shrink-0 ml-4 ${
                                                                        isOpen ? "rotate-180" : ""
                                                                  }`} 
                                                            />
                                                      </button>
                                                      <div 
                                                            className={`transition-all duration-300 ease-in-out overflow-hidden ${
                                                                  isOpen ? "max-h-40 border-t border-gray-50" : "max-h-0"
                                                            }`}
                                                      >
                                                            <p className="p-5 text-[11px] md:text-xs text-text-secondary leading-relaxed font-semibold">
                                                                  {faq.a}
                                                            </p>
                                                      </div>
                                                </div>
                                          );
                                    })}
                              </div>
                              <div className="text-center pt-2">
                                    <Link 
                                          to="/faq" 
                                          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                          className="text-xs md:text-sm font-bold text-primary hover:underline inline-flex items-center gap-1 hover:scale-102 transition-transform"
                                    >
                                          View all FAQs &rarr;
                                    </Link>
                              </div>
                        </div>
                  </section>
            </div>
      );
}

export default Home;
