import { UtensilsCrossed } from 'lucide-react';
import { Link } from 'react-router-dom';

const Logo = () => {
      return (
            <Link to="/home" className="flex items-center gap-1 z-10">
                  <div className="md:w-12 w-8 md:h-12 h-8 bg-white rounded-xl flex items-center justify-center">
                        <UtensilsCrossed className="w-7 h-7 text-[#C22630]" />
                  </div>
                  <span className="md:text-2xl text-xl font-extrabold text-gradient ">আবার খাবো</span>
            </Link>
      );
}

export default Logo;
