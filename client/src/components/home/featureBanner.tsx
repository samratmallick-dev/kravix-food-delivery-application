import { Zap, Shield, Star, Clock } from "lucide-react";

const FeatureBanmner = () => {
      const features = [
            { icon: Zap, title: 'Lightning Fast', desc: 'Delivery in 30 mins', color: 'text-amber-500 bg-amber-500/10' },
            { icon: Shield, title: 'Safe & Hygienic', desc: 'Contactless delivery', color: 'text-emerald-500 bg-emerald-500/10' },
            { icon: Star, title: 'Best Rated', desc: 'Top rated restaurants', color: 'text-rose-500 bg-rose-500/10' },
            { icon: Clock, title: 'Live Tracking', desc: 'Real-time order tracking', color: 'text-blue-500 bg-blue-500/10' },
      ];

      return (
            <section className="bg-white/80 -mt-8 border-b border-gray-100/50 py-4 shadow-xs select-none">
                  <div className="container-app">
                        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:items-center">
                              {features.map((feature) => (
                                    <div 
                                          key={feature.title} 
                                          className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-gray-50/50 transition-all duration-300 hover:scale-[1.02]"
                                    >
                                          <div className={`w-11 h-11 rounded-xl ${feature.color} flex items-center justify-center shrink-0 shadow-2xs`}>
                                                <feature.icon className="w-5 h-5" />
                                          </div>
                                          <div>
                                                <p className="text-xs md:text-sm font-bold text-gray-800 tracking-tight">{feature.title}</p>
                                                <p className="text-[10px] md:text-xs text-text-secondary font-semibold leading-none mt-1">{feature.desc}</p>
                                          </div>
                                    </div>
                              ))}
                        </div>
                  </div>
            </section>
      );
}

export default FeatureBanmner;
