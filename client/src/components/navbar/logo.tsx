import { UtensilsCrossed } from 'lucide-react';
import { Link } from 'react-router-dom';

const Logo = () => {
      return (
            <Link to="/" className="flex items-center gap-1 z-10 border-0 outline-none" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  <div className="md:w-12 w-8 md:h-12 h-8 bg-white rounded-xl flex items-center justify-center">
                        <UtensilsCrossed className="w-7 h-7 text-primary" />
                  </div>
                  <span className="md:text-2xl text-xl font-extrabold text-gradient ">আবার খাবো</span>
            </Link>
      );
}

export default Logo;
