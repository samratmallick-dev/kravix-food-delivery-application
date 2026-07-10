import { useEffect } from "react";
import SEO from "../components/common/SEO";
import PageHeader from "../components/common/legal/PageHeader";
import { BookOpen, Code, Cpu, Server, ShieldAlert, Award, ArrowUpRight } from "lucide-react";

const About = () => {
      useEffect(() => {
            window.scrollTo({
                  top: 0,
                  behavior: "smooth",
            });
      }, []);

      return (
            <div className="w-full bg-background min-h-screen pb-16">
                  <SEO
                        title="About Kravix | Academic Project"
                        description="Learn about the architecture, tech stack, and goals behind Kravix, a B.Tech Computer Science graduation project prototype."
                        path="/about"
                  />

                  <PageHeader
                        title="About Kravix Project"
                        subtitle="Detailed technical overview and design system of our final-year B.Tech Computer Science capstone prototype."
                        icon={Award}
                  />

                  <div className="container-app px-4 max-w-4xl mt-12 space-y-12">
                        <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <BookOpen size={22} className="text-primary" />
                                    Project Overview
                              </h2>
                              <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-semibold">
                                    Kravix is an educational software prototype developed as a B.Tech Computer Science final-year graduation project. The platform simulates a hyperlocal, multi-role food delivery system. It acts as an integration benchmark for low-latency notifications, event-driven microservices, spatial querying, and artificial intelligence recommendation components.
                              </p>
                              <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-semibold">
                                    Unlike commercial platforms, Kravix runs fully inside development sandboxes. No real-world merchants, courier logistics, or monetary financial services are linked. It serves as a proof-of-concept application demonstrating advanced systems architecture.
                              </p>
                        </section>

                        <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <Cpu size={22} className="text-primary" />
                                    AI & Smart Features
                              </h2>
                              <div className="space-y-4 font-semibold text-text-secondary">
                                    <div>
                                          <h3 className="font-bold text-gray-800 text-xs md:text-sm mb-1">AI Recommendation Engine</h3>
                                          <p className="text-xs md:text-sm leading-relaxed">
                                                Features a collaborative filtering algorithm that parses menu tags and user dining history to calculate item similarity scores (cosine similarity vectors), presenting dynamic recommendation strips.
                                          </p>
                                    </div>
                                    <div>
                                          <h3 className="font-bold text-gray-800 text-xs md:text-sm mb-1">Fuzzy Search & Intent Detection</h3>
                                          <p className="text-xs md:text-sm leading-relaxed">
                                                Implements localized query auto-correction, prefix matching, and category grouping strategies to suggest relevant listings during client searches.
                                          </p>
                                    </div>
                              </div>
                        </section>

                        <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-xs space-y-6">
                              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <Server size={22} className="text-primary" />
                                    System Architecture
                              </h2>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                          <h3 className="font-bold text-gray-800 text-xs md:text-sm">Microservices Decoupling</h3>
                                          <p className="text-xs leading-relaxed text-text-secondary font-semibold">
                                                The backend is split into multiple isolated service boundaries:
                                          </p>
                                          <ul className="text-xs text-text-secondary font-semibold list-disc pl-4 space-y-1">
                                                <li>Auth Service: Handles token issues and login paths.</li>
                                                <li>Restaurant Service: Manages menu cards and profiles.</li>
                                                <li>Order Service: Controls transactional checkout states.</li>
                                                <li>Rider Service: Synchronizes delivery updates.</li>
                                                <li>Email & Real-Time Services: Processes socket events and mail templates.</li>
                                          </ul>
                                    </div>
                                    <div className="space-y-2">
                                          <h3 className="font-bold text-gray-800 text-xs md:text-sm">Event-Driven Integration</h3>
                                          <p className="text-xs leading-relaxed text-text-secondary font-semibold">
                                                Asynchronous communication between services is managed via RabbitMQ queues. Real-time updates (driver coordinates, order stages) are broadcast dynamically using Socket.io server clusters, optimizing state responsiveness.
                                          </p>
                                    </div>
                              </div>
                        </section>

                        <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <Code size={22} className="text-primary" />
                                    Technology Stack
                              </h2>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">Frontend</span>
                                          <span className="text-xs font-bold text-gray-800">React + Vite</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">Language</span>
                                          <span className="text-xs font-bold text-gray-800">TypeScript</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">Styling</span>
                                          <span className="text-xs font-bold text-gray-800">Tailwind CSS v4</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">State Caching</span>
                                          <span className="text-xs font-bold text-gray-800">Redis</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">Databases</span>
                                          <span className="text-xs font-bold text-gray-800">MongoDB + Mongoose</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">Event Broker</span>
                                          <span className="text-xs font-bold text-gray-800">RabbitMQ</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">WebSockets</span>
                                          <span className="text-xs font-bold text-gray-800">Socket.io</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">Gateways</span>
                                          <span className="text-xs font-bold text-gray-800">Stripe & Razorpay</span>
                                    </div>
                              </div>
                        </section>

                        <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <ArrowUpRight size={22} className="text-primary" />
                                    Learning Outcomes & Future Scope
                              </h2>
                              <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-semibold">
                                    Building Kravix provided hands-on experience in orchestrating Dockerized environments, managing distributed state, solving eventual consistency issues, and scaling WebSocket gateways. 
                              </p>
                              <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-semibold">
                                    Future updates aim to incorporate Apache Kafka for high-throughput stream processing, implement routing paths via OpenStreetMap APIs, and upgrade recommendation weights to neural network layers.
                              </p>
                        </section>

                        <section className="bg-red-50/50 p-6 md:p-8 rounded-2xl border border-red-100 text-center max-w-3xl mx-auto space-y-3">
                              <h2 className="text-base font-bold text-gray-900 flex items-center justify-center gap-2">
                                    <ShieldAlert size={18} className="text-primary" />
                                    Academic Disclaimer
                              </h2>
                              <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                                    This application is built solely for educational evaluation as part of B.Tech requirements. It does not perform active delivery transactions, represent commercial ventures, or manage real money systems. All operations, restaurant listings, order status updates, and rider routes are fully simulated.
                              </p>
                        </section>
                  </div>
            </div>
      );
};

export default About;
