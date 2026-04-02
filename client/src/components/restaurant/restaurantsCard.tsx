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
                  className="cursor-pointer rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white relative"
            >
                  <div className={`h-48 w-full ${!isOpen && "grayscale brightness-75 opacity-80"}`}>
                        <img src={image} alt={name} className="h-full w-full object-cover" />
                  </div>
                  <span className={`absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full shadow z-10 ${isOpen ? "bg-green-500 text-white" : "bg-red-500 text-white"
                        }`}>
                        {isOpen ? "● OPEN" : "● CLOSED"}
                  </span>

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
