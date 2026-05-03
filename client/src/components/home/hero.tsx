import heroImage from "../../assets/hero_background.jpg";
import { useMobile } from "../common/useMobile";

const Hero = () => {
      const isMobile = useMobile();
      return (
            <div>
                  <div className="relative flex items-center overflow-hidden select-none" style={{ minHeight: isMobile ? "50vh" : "70vh" }}>
                        <div className="absolute inset-0">
                              <img src={heroImage} alt="Delicious food" className="w-full h-full object-cover" fetchPriority="high" decoding="sync" />
                              <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/70 to-black/30" />
                        </div>
                        <div className="container-app relative z-10 w-full flex flex-col items-center" style={{ padding: isMobile ? "40px 16px" : "80px 16px" }}>
                              <h1 className="font-bold text-white max-w-2xl text-center" style={{ fontSize: isMobile ? "1.75rem" : "3.75rem" }}>
                                    Order your favorite food from our app <span className="text-gradient">আবার খাবো</span>
                              </h1>
                              <p className="text-white/90 mt-4 max-w-2xl text-center" style={{ fontSize: isMobile ? "1rem" : "1.25rem" }}>
                                    Experience the best food delivery service with fast and reliable delivery.
                              </p>
                        </div>
                  </div>
            </div>
      );
};

export default Hero;
