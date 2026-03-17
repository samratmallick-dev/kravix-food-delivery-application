import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";

type RestaurantProps = {
      id: string;
      name: string;
      image: string;
      distance: string;
      isOpen: boolean;
};

const RestaurantsCard = ({ id, name, image, distance, isOpen }: RestaurantProps) => {
      const navigate = useNavigate();
      return (
            <div
                  onClick={() => {
                        navigate(`/restaurant/${id}`);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`cursor-pointer rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white ${!isOpen && "grayscale brightness-75 opacity-80"}`}
            >
                  <div className="relative h-48 w-full">
                        <img src={image} alt={name} className="h-full w-full object-cover" />
                        <span
                              className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full ${isOpen ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                                    }`}
                        >
                              {isOpen ? "Open" : "Closed"}
                        </span>
                  </div>

                  <div className="p-3">
                        <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
                        <div className="flex items-center gap-1 mt-1 text-gray-500 text-sm">
                              <MapPin size={13} />
                              <span>{distance} KM Away</span>
                        </div>
                  </div>
            </div>
      );
};

export default RestaurantsCard;
