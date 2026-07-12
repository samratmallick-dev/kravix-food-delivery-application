import PageHeader from "@/components/common/legal/PageHeader";
import SEO from "@/components/common/SEO";
import { BookOpen, Brain, Server, Navigation, ShieldCheck, Search, Calendar, User } from "lucide-react";

const BlogPage = () => {
      const posts = [
            {
                  title: "Building Kravix: From Idea to Implementation",
                  date: "July 10, 2026",
                  category: "Project Lifecycle",
                  description: "A comprehensive journey mapping how Kravix evolved from a conceptual B.Tech capstone project into a fully functional, multi-role food delivery system with live order execution.",
                  icon: BookOpen,
                  gradient: "from-amber-500/10 to-orange-500/5",
                  iconColor: "text-amber-600"
            },
            {
                  title: "AI-Powered Food Recommendation System",
                  date: "July 08, 2026",
                  category: "Artificial Intelligence",
                  description: "Deep dive into the collaborative filtering recommendations, cosine similarity calculations, and real-time user preference weightings that power personalized food listings.",
                  icon: Brain,
                  gradient: "from-pink-500/10 to-purple-500/5",
                  iconColor: "text-pink-600"
            },
            {
                  title: "Microservices Architecture Used in Kravix",
                  date: "July 05, 2026",
                  category: "System Architecture",
                  description: "Exploring the asynchronous event loop design pattern, service decoupling (auth, restaurant, ordering, and rider services), and message brokering using RabbitMQ queues.",
                  icon: Server,
                  gradient: "from-blue-500/10 to-indigo-500/5",
                  iconColor: "text-blue-600"
            },
            {
                  title: "Real-Time Order Tracking & WebSockets",
                  date: "July 01, 2026",
                  category: "WebSockets",
                  description: "Implementing real-time coordinate streaming and socket pools between customer dashboards, restaurant orders, and active riders to synchronize route lifecycle events.",
                  icon: Navigation,
                  gradient: "from-emerald-500/10 to-teal-500/5",
                  iconColor: "text-emerald-600"
            },
            {
                  title: "Integrating Secure Google & Token Authentication",
                  date: "June 25, 2026",
                  category: "Security",
                  description: "Securing student dashboards, seller settings, and admin panel endpoints using JWT verification pipelines, Google OAuth 2.0 integrations, and secure cookie headers.",
                  icon: ShieldCheck,
                  gradient: "from-violet-500/10 to-fuchsia-500/5",
                  iconColor: "text-violet-600"
            },
            {
                  title: "Search Optimization Techniques & Geolocation Querying",
                  date: "June 20, 2026",
                  category: "Database & Geofencing",
                  description: "How we optimized database search queries using MongoDB spatial indices, coordinate calculations ($geoNear), and text normalizers to query nearby restaurants.",
                  icon: Search,
                  gradient: "from-cyan-500/10 to-sky-500/5",
                  iconColor: "text-cyan-600"
            }
      ];

      return (
            <div className="w-full bg-background min-h-screen pb-16">
                  <SEO
                        title="Engineering & Development Blog | Kravix Project"
                        description="Explore technical design journals, architectural decisions, and integration write-ups behind the Kravix final-year food delivery application."
                        path="/blog"
                        type="website"
                  />

                  <PageHeader
                        title="Engineering & Development Blog"
                        subtitle="Detailed logs, architectural journals, and technical breakthroughs written by the project development team."
                        icon={BookOpen}
                  />

                  <div className="container-app px-4 max-w-6xl mt-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                              {posts.map((post, idx) => {
                                    const IconComponent = post.icon;
                                    return (
                                          <article
                                                key={idx}
                                                className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-primary/20 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col h-full group"
                                          >
                                                <div className={`h-48 w-full bg-linear-to-br ${post.gradient} flex items-center justify-center relative shrink-0`}>
                                                      <div className="p-4 rounded-full bg-white/80 shadow-md backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                                                            <IconComponent size={36} className={post.iconColor} />
                                                      </div>
                                                      <span className="absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-white/90 text-gray-800 px-2.5 py-1 rounded-md shadow-sm border border-gray-50">
                                                            {post.category}
                                                      </span>
                                                </div>

                                                <div className="p-6 flex flex-col flex-1 gap-3">
                                                      <div className="flex items-center gap-3 text-[11px] font-bold text-text-secondary">
                                                            <span className="flex items-center gap-1">
                                                                  <Calendar size={12} />
                                                                  {post.date}
                                                            </span>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1">
                                                                  <User size={12} />
                                                                  Project Team
                                                            </span>
                                                      </div>

                                                      <h3 className="font-bold text-gray-800 text-base md:text-lg group-hover:text-primary transition-colors duration-200 leading-snug line-clamp-2">
                                                            {post.title}
                                                      </h3>

                                                      <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-semibold line-clamp-3">
                                                            {post.description}
                                                      </p>

                                                      <div className="pt-4 border-t border-gray-50 mt-auto flex items-center justify-between">
                                                            <button
                                                                  type="button"
                                                                  className="text-primary font-bold text-xs md:text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform duration-200 cursor-default"
                                                            >
                                                                  Read Article &rarr;
                                                            </button>
                                                      </div>
                                                </div>
                                          </article>
                                    );
                              })}
                        </div>
                  </div>
            </div>
      );
};

export default BlogPage;
