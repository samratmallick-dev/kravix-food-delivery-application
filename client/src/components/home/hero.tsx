import heroImage from "../../assets/hero_background.jpg";

const Hero = () => {
      const handleScrollToRestaurants = () => {
            const el = document.getElementById("nearest-restaurants");
            if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
            }
      };

      return (
            <div className="relative w-full flex items-center justify-center overflow-hidden min-h-[45vh] sm:min-h-[55vh] md:min-h-[65vh] lg:min-h-[70vh] bg-gray-950 select-none">
                  <div className="absolute inset-0 z-0">
                        <img 
                              src={heroImage} 
                              alt="Delicious food background" 
                              className="w-full h-full object-cover animate-subtle-zoom" 
                              fetchPriority="high" 
                              decoding="sync" 
                              loading="eager"
                              width={1920}
                              height={1080}
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-gray-950 via-black/55 to-black/80" />
                  </div>
                  
                  <div className="container-app relative z-10 w-full py-14 sm:py-20 md:py-24 px-4 flex flex-col items-center justify-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-amber-300 text-xs font-semibold mb-5 tracking-wide shadow-xs">
                              <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </span>
                              Be Smart, Eat Better
                        </div>
                        
                        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white text-center tracking-tight leading-[1.2] max-w-4xl">
                              Order Bengali, Indian & Multi-Cuisine Food Online
                        </h1>
                        
                        <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-200/90 mt-5 max-w-lg md:max-w-xl lg:max-w-2xl text-center leading-relaxed font-medium">
                              Experience the best food delivery service with fast and reliable delivery. Taste the finest Bengali cuisine and beyond.
                        </p>
                        
                        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                              <button 
                                    onClick={handleScrollToRestaurants}
                                    className="w-full sm:w-auto px-8 py-3.5 bg-primary hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all duration-300 shadow-md shadow-primary/20 hover:shadow-primary/45 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center"
                              >
                                    Explore Restaurants
                              </button>
                        </div>
                  </div>
            </div>
      );
};

export default Hero;
