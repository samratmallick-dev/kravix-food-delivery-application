import { Zap, Shield, Star, Clock } from "lucide-react";

const FeatureBanmner = () => {
      return (
            <section className="bg-card border-b border-border">
                  <div className="container-app py-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                              {[
                                    { icon: Zap, title: 'Lightning Fast', desc: 'Delivery in 30 mins' },
                                    { icon: Shield, title: 'Safe & Hygienic', desc: 'Contactless delivery' },
                                    { icon: Star, title: 'Best Rated', desc: 'Top rated restaurants' },
                                    { icon: Clock, title: 'Live Tracking', desc: 'Real-time order tracking' },
                              ].map((feature) => (
                                    <div key={feature.title} className="flex items-center gap-3 p-3 rounded-xl">
                                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                <feature.icon className="w-5 h-5 text-primary" />
                                          </div>
                                          <div>
                                                <p className="text-sm font-semibold text-foreground">{feature.title}</p>
                                                <p className="text-xs text-muted-foreground">{feature.desc}</p>
                                          </div>
                                    </div>
                              ))}
                        </div>
                  </div>
            </section>
      );
}

export default FeatureBanmner;
