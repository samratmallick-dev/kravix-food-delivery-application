import { useEffect, useState } from "react";
import SEO from "@/components/common/SEO";
import PageHeader from "@/components/common/legal/PageHeader";
import { Mail, Phone, MessageSquare, Search, ChevronDown, ChevronUp } from "lucide-react";

interface FAQItem {
      id: number;
      category: string;
      question: string;
      answer: string;
}

const FAQS: FAQItem[] = [
      {
            id: 1,
            category: "getting-started",
            question: "How do I place an order on Kravix?",
            answer: "To place an order, search for a dish or restaurant in the search bar, add items to your cart, click the Cart icon to review, and proceed to checkout to enter your delivery details and payment information."
      },
      {
            id: 2,
            category: "orders",
            question: "Can I edit my order details after placing it?",
            answer: "Once an order is accepted by a restaurant, it cannot be modified. If you need to make urgent changes, please contact our support team immediately."
      },
      {
            id: 3,
            category: "payments",
            question: "What payment methods are supported?",
            answer: "We support UPI, Netbanking, wallets, and cards via Razorpay and Stripe, as well as Cash on Delivery (COD) for selected restaurant partners."
      },
      {
            id: 4,
            category: "refunds",
            question: "When will I receive my refund?",
            answer: "Once a refund is approved by our team, it typically takes 5 to 7 business days to appear in your account, depending on your bank's processing times."
      },
      {
            id: 5,
            category: "delivery",
            question: "How is delivery distance calculated?",
            answer: "Delivery distance is calculated dynamically using geographic coordinate data between the merchant restaurant and your saved delivery location."
      },
      {
            id: 6,
            category: "restaurant-issues",
            question: "What if my food items are missing or incorrect?",
            answer: "Please report any missing or incorrect food items via our Help Center within 2 hours of delivery. Include pictures of the items received and your order receipt."
      },
      {
            id: 7,
            category: "account-login",
            question: "How do I update my profile details?",
            answer: "Go to the Account page where you can edit your profile picture, modify your display name, and update saved delivery addresses."
      },
      {
            id: 8,
            category: "technical-problems",
            question: "Why am I seeing 'Location Access Required'?",
            answer: "Kravix needs browser geolocation permissions to find restaurants nearby, calculate delivery fees, and show available menus. Please enable location services in your browser settings."
      }
];

const CATEGORIES = [
      { id: "all", label: "All" },
      { id: "getting-started", label: "Getting Started" },
      { id: "orders", label: "Orders" },
      { id: "payments", label: "Payments" },
      { id: "refunds", label: "Refunds" },
      { id: "delivery", label: "Delivery" },
      { id: "restaurant-issues", label: "Restaurant Issues" },
      { id: "account-login", label: "Account & Login" },
      { id: "technical-problems", label: "Technical Problems" }
];

const Help = () => {
      useEffect(() => {
            window.scrollTo({
                  top: 0,
                  behavior: "smooth",
            });
      }, []);

      const [searchQuery, setSearchQuery] = useState("");
      const [activeCategory, setActiveCategory] = useState("all");
      const [openFaqId, setOpenFaqId] = useState<number | null>(null);

      const handleFaqToggle = (id: number) => {
            setOpenFaqId(openFaqId === id ? null : id);
      };

      const filteredFaqs = FAQS.filter((faq) => {
            const matchesSearch =
                  faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
            return matchesSearch && matchesCategory;
      });

      return (
            <div className="container-app py-8 space-y-8">
                  <SEO
                        title="Help Center | Kravix"
                        description="Browse our Help Center, FAQs, and support channels to resolve any questions about orders, payments, refunds, or account settings."
                        path="/help"
                  />

                  <PageHeader
                        title="Help Center"
                        description="How can we help you today? Search FAQs or browse by category to find answers."
                  />

                  <div className="max-w-2xl mx-auto relative flex items-center mb-6">
                        <div className="absolute left-4 text-gray-400">
                              <Search size={20} />
                        </div>
                        <input
                              type="text"
                              placeholder="Search FAQs (e.g. refund, location)..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-150 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm font-semibold text-gray-800 transition placeholder-gray-400 shadow-2xs"
                        />
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none justify-start md:justify-center border-b border-gray-100">
                        {CATEGORIES.map((cat) => (
                              <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-colors border shrink-0 ${activeCategory === cat.id ? "bg-primary border-transparent text-white shadow-xs" : "bg-white border-gray-150 text-gray-600 hover:bg-gray-50"}`}
                              >
                                    {cat.label}
                              </button>
                        ))}
                  </div>

                  <section className="max-w-3xl mx-auto space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h2>
                        {filteredFaqs.length > 0 ? (
                              <div className="space-y-3">
                                    {filteredFaqs.map((faq) => {
                                          const isOpen = openFaqId === faq.id;
                                          return (
                                                <div key={faq.id} className="bg-white border border-gray-155 rounded-2xl overflow-hidden transition-all shadow-2xs">
                                                      <button
                                                            onClick={() => handleFaqToggle(faq.id)}
                                                            aria-expanded={isOpen}
                                                            aria-controls={`faq-answer-${faq.id}`}
                                                            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50/50 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                      >
                                                            <span className="font-bold text-gray-800 text-sm md:text-base">{faq.question}</span>
                                                            <span className="text-gray-400 shrink-0 ml-2">
                                                                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                            </span>
                                                      </button>
                                                      <div
                                                            id={`faq-answer-${faq.id}`}
                                                            className={`transition-all duration-300 ${isOpen ? "max-h-60 border-t border-gray-100" : "max-h-0 overflow-hidden"}`}
                                                      >
                                                            <div className="px-6 py-4 text-sm text-text-secondary leading-relaxed font-semibold">
                                                                  {faq.answer}
                                                            </div>
                                                      </div>
                                                </div>
                                          );
                                    })}
                              </div>
                        ) : (
                              <div className="text-center py-12 text-gray-500 font-semibold">
                                    No FAQs found matching your criteria. Try adjusting your search query or filters.
                              </div>
                        )}
                  </section>

                  <section className="max-w-4xl mx-auto pt-8 border-t border-gray-100 space-y-6">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center">Still need help? Contact Support</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="bg-white p-6 rounded-2xl border border-gray-155 flex flex-col items-center text-center space-y-3 hover:shadow-md transition-shadow">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                          <Mail size={24} />
                                    </div>
                                    <h3 className="font-bold text-gray-805">Email Support</h3>
                                    <p className="text-xs text-text-secondary font-semibold leading-relaxed">
                                          Send us an email and we will respond within 24 hours.
                                    </p>
                                    <a href="mailto:support@kravix.com" className="text-sm font-bold text-primary hover:underline">
                                          support@kravix.com
                                    </a>
                              </div>

                              <div className="bg-white p-6 rounded-2xl border border-gray-155 flex flex-col items-center text-center space-y-3 hover:shadow-md transition-shadow">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                          <Phone size={24} />
                                    </div>
                                    <h3 className="font-bold text-gray-805">Call Us</h3>
                                    <p className="text-xs text-text-secondary font-semibold leading-relaxed">
                                          Talk to our customer service agent directly.
                                    </p>
                                    <a href="tel:+18005550199" className="text-sm font-bold text-primary hover:underline">
                                          +91-9999999999
                                    </a>
                              </div>

                              <div className="bg-white p-6 rounded-2xl border border-gray-155 flex flex-col items-center text-center space-y-3 hover:shadow-md transition-shadow">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                          <MessageSquare size={24} />
                                    </div>
                                    <h3 className="font-bold text-gray-850">Live Chat</h3>
                                    <p className="text-xs text-text-secondary font-semibold leading-relaxed">
                                          Chat in real-time with one of our online support experts.
                                    </p>
                                    <button className="px-4 py-2 bg-primary hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer">
                                          Start Chat
                                    </button>
                              </div>
                        </div>
                  </section>
            </div>
      );
};

export default Help;
