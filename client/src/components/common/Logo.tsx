import { Link } from 'react-router-dom';

interface LogoProps {
      auth?: boolean;
}

const Logo = ({ auth }: LogoProps) => {
      return (
            <Link 
                  to="/" 
                  aria-label="Kravix Homepage"
                  className="flex items-center gap-3 z-10 border-0 outline-none select-none group" 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
                  <div className={`${
                        auth ? 'w-14 h-14 rounded-2xl' : 'md:w-11 w-9 md:h-11 h-9 rounded-xl'
                  } bg-white flex items-center justify-center overflow-hidden shadow-xs border border-gray-100/50 shrink-0 transition-transform duration-300 group-hover:scale-105`}>
                        <img 
                              src="/apple-touch-icon.png" 
                              alt="Kravix Icon" 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/favicon-32x32.png";
                              }}
                        />
                  </div>
                  <span className={`${
                        auth ? 'text-3xl' : 'md:text-2xl text-lg'
                  } font-extrabold text-gradient flex flex-col leading-none tracking-tight`}>
                        Kravix
                        <span className={`${
                              auth ? 'block text-sm' : 'hidden sm:block text-[10px] md:text-xs'
                        } font-semibold text-gradient mt-1 opacity-90`}>
                              Be Smart, Eat Better
                        </span>
                  </span>
            </Link>
      );
}

export default Logo;
