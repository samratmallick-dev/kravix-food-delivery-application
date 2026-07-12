import { Logo } from "@/components/common";
import { Link } from "react-router-dom";
import React, { useState } from "react";
import toast from "react-hot-toast";

const SocialIcons = {
      Facebook: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>,
      Instagram: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>,
      LinkedIn: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>,
      GitHub: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>,
      Email: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
};

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
                              <div className="lg:col-span-2 space-y-6">
                                    <div className="flex items-center">
                                          <Logo />
                                    </div>
                                    <p className="text-sm text-gray-400 leading-relaxed font-semibold max-w-sm">
                                          An academic final-year B.Tech graduation project prototype showcasing a hyperlocal, multi-role food delivery platform with event-driven services.
                                    </p>
                                    <div className="flex items-center gap-3">
                                          {[
                                                { icon: <SocialIcons.Facebook />, label: "Facebook", link: "https://www.facebook.com/samratmallick.dev" },
                                                { icon: <SocialIcons.Instagram />, label: "Instagram", link: "https://www.instagram.com/samratmallick.dev/" },
                                                { icon: <SocialIcons.LinkedIn />, label: "LinkedIn", link: "https://www.linkedin.com/in/samrat-mallick01/" },
                                                { icon: <SocialIcons.GitHub />, label: "GitHub", link: "https://www.github.com/samratmallick-dev/" },
                                          ].map((social, i) => (
                                                <a
                                                      key={i}
                                                      href={social.link}
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
                              <div className="space-y-5">
                                    <h2 className="font-bold text-xs uppercase tracking-widest text-white">Company</h2>
                                    <ul className="space-y-3 text-sm font-semibold list-none p-0 m-0">
                                          <li><Link to="/about" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-primary hover:translate-x-1 transition-all duration-200 inline-block">About Us</Link></li>
                                          <li><Link to="/blog" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-primary hover:translate-x-1 transition-all duration-200 inline-block">Blog</Link></li>
                                          <li><Link to="/contact" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-primary hover:translate-x-1 transition-all duration-200 inline-block">Contact Us</Link></li>
                                    </ul>
                              </div>

                              <div className="space-y-5">
                                    <h2 className="font-bold text-xs uppercase tracking-widest text-white">Support</h2>
                                    <ul className="space-y-3 text-sm font-semibold list-none p-0 m-0">
                                          <li><Link to="/help" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-primary hover:translate-x-1 transition-all duration-200 inline-block">Help Center</Link></li>
                                          <li><Link to="/faq" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-primary hover:translate-x-1 transition-all duration-200 inline-block">FAQs</Link></li>
                                    </ul>
                              </div>

                              <div className="space-y-5">
                                    <h2 className="font-bold text-xs uppercase tracking-widest text-white">Newsletter</h2>
                                    <p className="text-xs text-gray-400 leading-relaxed font-semibold">
                                          Subscribe to get special discounts, offers, and regional updates!
                                    </p>
                                    <form onSubmit={handleSubscribe} className="relative flex items-center">
                                          <div className="absolute left-3.5 text-gray-500">
                                                <SocialIcons.Email />
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
                                    <Link to="/privacy" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-primary transition-colors">Privacy Policy</Link>
                                    <Link to="/terms" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-primary transition-colors">Terms of Service</Link>
                                    <Link to="/refunds" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-primary transition-colors">Refund Policy</Link>
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
