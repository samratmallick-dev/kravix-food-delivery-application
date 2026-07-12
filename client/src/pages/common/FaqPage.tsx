import { useState, useMemo } from "react";
import PageHeader from "@/components/common/legal/PageHeader";
import SEO from "@/components/common/SEO";
import { HelpCircle, Search, ChevronDown, ChevronUp } from "lucide-react";

interface FAQItem {
      question: string;
      answer: string;
      category: "general" | "ordering" | "payments" | "assistant" | "delivery" | "account" | "restaurants" | "technical";
}

const FAQPage = () => {
      const [searchQuery, setSearchQuery] = useState("");
      const [selectedCategory, setSelectedCategory] = useState<string>("all");
      const [openIndex, setOpenIndex] = useState<number | null>(null);

      const categories = [
            { id: "all", name: "All Questions" },
            { id: "general", name: "General" },
            { id: "ordering", name: "Ordering" },
            { id: "payments", name: "Payments" },
            { id: "assistant", name: "AI Assistant" },
            { id: "delivery", name: "Delivery" },
            { id: "account", name: "Account" },
            { id: "restaurants", name: "Restaurants" },
            { id: "technical", name: "Technical Issues" }
      ];

      const faqs: FAQItem[] = [
            {
                  question: "What is Kravix?",
                  category: "general",
                  answer: "Kravix is an academic prototype of an online food delivery platform, developed as a final-year B.Tech Computer Science and Engineering graduation project. It showcases a fully operational microservices backend, real-time geofencing, and AI-driven meal recommendations."
            },
            {
                  question: "Is this a real commercial platform?",
                  category: "general",
                  answer: "No. Kravix is strictly an educational project built for demonstration and testing purposes. It does not possess commercial restaurant contracts, real delivery riders, or active physical operations."
            },
            {
                  question: "Which technologies were used to build this project?",
                  category: "technical",
                  answer: "The frontend is constructed using React, TypeScript, and Tailwind CSS v4, compiled via Vite. The backend consists of Node.js and Express microservices decoupled across boundaries (Auth, Restaurant, Order, Rider, Notification) communicating via RabbitMQ message brokers, utilizing MongoDB for data storage and Redis for state caching."
            },
            {
                  question: "How does the AI recommendation work?",
                  category: "assistant",
                  answer: "The AI recommendation pipeline queries menu vectors and historic order logs to run collaborative filtering algorithms. It matches user profiles to coordinates and cuisine types, presenting personalized food cards and menu predictions."
            },
            {
                  question: "How is authentication handled securely?",
                  category: "account",
                  answer: "Access is protected using JSON Web Tokens (JWT) issued by the Auth microservice upon registration or login. It also features Google OAuth 2.0 integration, validating credentials securely and storing active tokens in secure cookie wrappers."
            },
            {
                  question: "How does payment integration work on Kravix?",
                  category: "payments",
                  answer: "We have integrated Stripe and Razorpay payment gateways in developer test mode. No real monetary transactions take place; card details and inputs are processed through standard test tokens for validation purposes."
            },
            {
                  question: "How are restaurants and food menus managed?",
                  category: "restaurants",
                  answer: "Registered sellers have access to a dedicated dashboard to register restaurant profiles, set localized coordinate boundaries, upload food menus, set prices, toggle availability, and monitor real-time orders."
            },
            {
                  question: "How can I report bugs or review the source code?",
                  category: "technical",
                  answer: "Since this is an educational graduation project, bugs and technical glitches can be reported using the Contact Us form or directly opened as issues on the project's GitHub repository."
            },
            {
                  question: "How is delivery coordinate tracking simulated?",
                  category: "delivery",
                  answer: "Delivery tracking utilizes WebSockets via Socket.io. The rider's simulated location changes are published dynamically to the socket cluster, updating the customer's map overlay screen in real-time."
            },
            {
                  question: "Can anyone order food on this platform?",
                  category: "ordering",
                  answer: "Anyone can create an account and place simulated orders. Since this is a graduation project, no real food is cooked or delivered. Orders go through a simulated lifecycle from placement to fulfillment."
            },
            {
                  question: "Which areas does Kravix deliver to?",
                  category: "delivery",
                  answer: "We primarily operate in Kolkata and surrounding areas in West Bengal, delivering within a 10 KM radius of our listed partner restaurants."
            },
            {
                  question: "How do I join as a Partner or Rider?",
                  category: "restaurants",
                  answer: "We welcome local businesses and delivery personnel! You can register as a partner by clicking Become a Partner or apply to be a courier on the Become a Rider page."
            },
            {
                  question: "Is there a contact number for support?",
                  category: "general",
                  answer: "Yes, you can contact our 24/7 help desk through the Contact Us page or drop an email directly to support@kravix.com."
            }
      ];

      const filteredFaqs = useMemo(() => {
            return faqs.filter((faq) => {
                  const matchesSearch =
                        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
                  return matchesSearch && matchesCategory;
            });
      }, [searchQuery, selectedCategory]);

      const toggleAccordion = (idx: number) => {
            setOpenIndex(openIndex === idx ? null : idx);
      };

      return (
            <div className="w-full bg-background min-h-screen pb-16">
                  <SEO
                        title="Frequently Asked Questions | Kravix FAQ"
                        description="Find answers to frequently asked questions about the Kravix B.Tech graduation project food delivery prototype."
                        path="/faq"
                        type="website"
                  />

                  <PageHeader
                        title="Frequently Asked Questions"
                        subtitle="Detailed answers regarding the system features, architecture, and deployment setup of Kravix."
                        icon={HelpCircle}
                  />

                  <div className="container-app px-4 max-w-4xl mt-8 space-y-8">
                        <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                    <Search size={18} />
                              </div>
                              <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setOpenIndex(null); }}
                                    placeholder="Search FAQ questions and answers..."
                                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-xs md:text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none shadow-xs transition-all"
                              />
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
                              {categories.map((cat) => (
                                    <button
                                          key={cat.id}
                                          type="button"
                                          onClick={() => { setSelectedCategory(cat.id); setOpenIndex(null); }}
                                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border shrink-0 cursor-pointer ${
                                                selectedCategory === cat.id
                                                      ? "bg-primary border-primary text-white shadow-xs"
                                                      : "bg-white border-gray-100 text-text-secondary hover:border-primary/25 hover:text-primary"
                                          }`}
                                    >
                                          {cat.name}
                                    </button>
                              ))}
                        </div>

                        <div className="space-y-4">
                              {filteredFaqs.length > 0 ? (
                                    filteredFaqs.map((faq, idx) => {
                                          const isOpen = openIndex === idx;
                                          return (
                                                <div
                                                      key={idx}
                                                      className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs hover:border-gray-200 transition-all"
                                                >
                                                      <button
                                                            type="button"
                                                            onClick={() => toggleAccordion(idx)}
                                                            className="w-full flex items-center justify-between p-5 text-left font-bold text-gray-800 text-xs md:text-sm cursor-pointer select-none focus:outline-none"
                                                      >
                                                            <span>{faq.question}</span>
                                                            {isOpen ? (
                                                                  <ChevronUp size={18} className="text-primary shrink-0 ml-4" />
                                                            ) : (
                                                                  <ChevronDown size={18} className="text-gray-400 shrink-0 ml-4" />
                                                            )}
                                                      </button>

                                                      <div
                                                            className={`transition-all duration-300 ease-in-out overflow-hidden ${
                                                                  isOpen ? "max-h-96 border-t border-gray-50" : "max-h-0"
                                                            }`}
                                                      >
                                                            <div className="p-5 text-xs md:text-sm text-text-secondary leading-relaxed font-semibold">
                                                                  {faq.answer}
                                                            </div>
                                                      </div>
                                                </div>
                                          );
                                    })
                              ) : (
                                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                                          <p className="text-sm font-semibold text-text-secondary">No questions match your filter options.</p>
                                    </div>
                              )}
                        </div>
                  </div>
            </div>
      );
};

export default FAQPage;
