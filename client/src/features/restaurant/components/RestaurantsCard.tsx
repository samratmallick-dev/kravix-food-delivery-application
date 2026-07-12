import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";

type RestaurantProps = {
      id: string;
      slug?: string;
      name: string;
      image: string;
      distance: string;
      isOpen: boolean;
};

const RestaurantsCard = ({ id, slug, name, image, distance, isOpen }: RestaurantProps) => {
      const navigate = useNavigate();
      const identifier = slug || id;
      const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/restaurant/${identifier}`);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
            }
      };

      const formattedDistance = isNaN(parseFloat(distance)) ? distance : parseFloat(distance).toFixed(2);

      return (
            <div
                  onClick={() => {
                        navigate(`/restaurant/${identifier}`);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onKeyDown={handleKeyDown}
                  tabIndex={0}
                  role="link"
                  aria-label={`View details of restaurant ${name}`}
                  className="group cursor-pointer rounded-2xl overflow-hidden border border-gray-100 hover:border-transparent bg-white shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 focus:ring-2 focus:ring-primary/20 focus:outline-none relative flex flex-col w-full"
            >
                  <div className="relative h-32 sm:h-36 md:h-40 w-full overflow-hidden shrink-0">
                        <img 
                              src={image || `https://placehold.co/400x176?text=${encodeURIComponent(name)}`} 
                              alt={name} 
                              className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                                    !isOpen ? "grayscale brightness-75 opacity-80" : ""
                              }`} 
                              loading="lazy" 
                              width={400} 
                              height={176} 
                              decoding="async" 
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        <span className="absolute top-3 right-3 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/10 text-white bg-black/45 shadow-sm flex items-center gap-1.5 select-none">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                    isOpen ? "bg-green-400 animate-pulse" : "bg-red-500"
                              }`} />
                              {isOpen ? "Open" : "Closed"}
                        </span>
                  </div>

                  {/* Details section */}
                  <div className="p-4 flex flex-col flex-1 gap-1">
                        <h3 className="font-bold text-gray-800 text-sm group-hover:text-primary transition-colors duration-200 line-clamp-1">
                              {name}
                        </h3>
                        <div className="flex items-center justify-between text-[11px] text-gray-500 font-semibold border-t border-gray-50 pt-2.5 mt-auto">
                              <div className="flex items-center gap-1">
                                    <MapPin size={12} className="text-gray-400 shrink-0" />
                                    <span>{formattedDistance} KM Away</span>
                              </div>
                              <span className="text-primary font-bold transition-all group-hover:translate-x-0.5 flex items-center gap-0.5">
                                    Order Now &rarr;
                              </span>
                        </div>
                  </div>
            </div>
      );
};

export default RestaurantsCard;
