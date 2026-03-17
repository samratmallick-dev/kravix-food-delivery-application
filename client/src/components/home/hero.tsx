import heroImage from "../../assets/hero_background.jpg";

const Hero = () => {
      return (
            <div>
                  <div className="relative min-h-[70vh] flex items-center overflow-hidden select-none">
                        <div className="absolute inset-0">
                              <img src={heroImage} alt="Delicious food" className="w-full h-full object-cover" />
                              <div
                                    className="absolute inset-0 bg-linear-to-r from-black/90 via-black/70 to-black/30"
                              />
                        </div>
                        <div className='container-app relative z-10 py-20 w-full flex flex-col items-center'>
                              <h1 className="text-4xl md:text-6xl font-bold text-white max-w-2xl text-center ">
                                    Order your favorite food from our app <span className="text-gradient">আবার খাবো</span>
                              </h1>
                              <p className="text-lg md:text-xl text-white/90 mt-4 max-w-2xl text-center">
                                    Experience the best food delivery service with fast and reliable delivery.
                              </p>
                        </div>
                  </div>
            </div>
      );
};

export default Hero;
