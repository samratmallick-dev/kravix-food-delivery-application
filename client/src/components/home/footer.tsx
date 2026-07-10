import Logo from "../navbar/logo";
import { 
      FaFacebook, 
      FaInstagram, 
      FaTwitter, 
      FaLinkedin, 
      FaGithub,
      FaEnvelope
} from "react-icons/fa";
import { Link } from "react-router-dom";
import React, { useState } from "react";
import toast from "react-hot-toast";

const Footer = () => {
      const currentYear = new Date().getFullYear();
      const [email, setEmail] = useState("");

      const handleSubscribe = (e: React.FormEvent) => {
            e.preventDefault();
            if (!email) {
                  toast.error("Please enter a valid email address");
                  return;
            }
            toast.success("Thank you for subscribing to Kravix updates!");
            setEmail("");
      };

      return (
            <footer className="bg-gray-950 text-gray-400 border-t border-gray-900 mt-auto relative overflow-hidden select-none">
                  <div className="absolute top-0 left-1/4 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
                  <div className="absolute bottom-0 right-1/4 translate-y-1/2 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl" />

                  <div className="container-app py-16 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
                              {/* Brand Section */}
                              <div className="lg:col-span-2 space-y-6">
                                    <div className="flex items-center">
                                          <Logo />
                                    </div>
                                    <p className="text-sm text-gray-400 leading-relaxed font-semibold max-w-sm">
                                          Your favorite food, delivered fresh and fast. Savor authentic Bengali cuisines, traditional Indian delicacies, and global flavors right at your doorstep.
                                    </p>
                                    <div className="flex items-center gap-3">
                                          {[
                                                { icon: <FaFacebook size={16} />, label: "Facebook" },
                                                { icon: <FaInstagram size={16} />, label: "Instagram" },
                                                { icon: <FaTwitter size={16} />, label: "Twitter" },
                                                { icon: <FaLinkedin size={16} />, label: "LinkedIn" },
                                                { icon: <FaGithub size={16} />, label: "GitHub" },
                                          ].map((social, i) => (
                                                <a 
                                                      key={i} 
                                                      href="#" 
                                                      target="_blank" 
                                                      rel="noopener noreferrer" 
                                                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-primary hover:border-transparent transition-all duration-300 hover:scale-[1.08] shadow-xs" 
                                                      aria-label={social.label}
                                                >
                                                      {social.icon}
                                                </a>
                                          ))}
                                    </div>
                              </div>

                              {/* Column 2: Company */}
                              <div className="space-y-5">
                                    <h2 className="font-bold text-xs uppercase tracking-widest text-white">Company</h2>
                                    <ul className="space-y-3 text-sm font-semibold list-none p-0 m-0">
                                          <li><Link to="/about" className="hover:text-primary hover:translate-x-1 transition-all duration-200 inline-block">About Us</Link></li>
                                          <li><Link to="/careers" className="hover:text-primary hover:translate-x-1 transition-all duration-200 inline-block">Careers</Link></li>
                                          <li><Link to="/blog" className="hover:text-primary hover:translate-x-1 transition-all duration-200 inline-block">Blog</Link></li>
                                    </ul>
                              </div>

                              <div className="space-y-5">
                                    <h2 className="font-bold text-xs uppercase tracking-widest text-white">Support</h2>
                                    <ul className="space-y-3 text-sm font-semibold list-none p-0 m-0">
                                          <li><Link to="/help" className="hover:text-primary hover:translate-x-1 transition-all duration-200 inline-block">Help Center</Link></li>
                                          <li><Link to="/contact" className="hover:text-primary hover:translate-x-1 transition-all duration-200 inline-block">Contact Us</Link></li>
                                          <li><Link to="/faq" className="hover:text-primary hover:translate-x-1 transition-all duration-200 inline-block">FAQs</Link></li>
                                    </ul>
                              </div>

                              <div className="space-y-5">
                                    <h2 className="font-bold text-xs uppercase tracking-widest text-white">Newsletter</h2>
                                    <p className="text-xs text-gray-400 leading-relaxed font-semibold">
                                          Subscribe to get special discounts, offers, and regional updates!
                                    </p>
                                    <form onSubmit={handleSubscribe} className="relative flex items-center">
                                          <div className="absolute left-3.5 text-gray-500">
                                                <FaEnvelope size={14} />
                                          </div>
                                          <input 
                                                type="email" 
                                                placeholder="Your email address" 
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full pl-10 pr-24 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-xs font-semibold text-white transition placeholder-gray-500"
                                          />
                                          <button 
                                                type="submit"
                                                className="absolute right-1.5 px-3 py-1.5 bg-primary hover:bg-red-700 text-white font-bold text-[10px] rounded-lg transition-all active:scale-95 shadow-md shadow-primary/20 cursor-pointer"
                                          >
                                                Subscribe
                                          </button>
                                    </form>
                              </div>
                        </div>

                        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold">
                                    <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                                    <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
                                    <Link to="/refunds" className="hover:text-primary transition-colors">Refund Policy</Link>
                              </div>
                              <div className="flex flex-col items-center sm:items-end gap-1 text-xs text-gray-500 font-semibold">
                                    <p>© {currentYear} Kravix. All rights reserved.</p>
                                    <p className="flex items-center gap-1">
                                          Made with <span className="text-primary animate-pulse" aria-hidden="true">❤️</span> by Kravix Team
                                    </p>
                              </div>
                        </div>
                  </div>
            </footer>
      );
}

export default Footer;
