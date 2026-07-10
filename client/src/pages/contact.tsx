import React, { useState } from "react";
import PageHeader from "../components/common/legal/PageHeader";
import SEO from "../components/common/SEO";
import toast from "react-hot-toast";
import { Mail, Github, Linkedin, Globe, BookOpen, GraduationCap, User, ArrowRight } from "lucide-react";

const ContactPage = () => {
      const [formData, setFormData] = useState({
            name: "",
            email: "",
            subject: "",
            message: ""
      });
      const [isSubmitting, setIsSubmitting] = useState(false);

      const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            setFormData({
                  ...formData,
                  [e.target.id]: e.target.value
            });
      };

      const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            setIsSubmitting(true);
            setTimeout(() => {
                  toast.success("Thank you! Your feedback has been simulated successfully.");
                  setFormData({ name: "", email: "", subject: "", message: "" });
                  setIsSubmitting(false);
            }, 1000);
      };

      return (
            <div className="w-full bg-background min-h-screen pb-16">
                  <SEO
                        title="Contact Us | Kravix Project"
                        description="Get in touch with the development team of Kravix, an academic final-year B.Tech computer science project."
                        path="/contact"
                        type="website"
                  />

                  <PageHeader
                        title="Contact Us & Project Info"
                        subtitle="Detailed academic metadata and project contact hub for Kravix."
                        icon={GraduationCap}
                  />

                  <div className="container-app px-4 max-w-5xl mt-12">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                              
                              <div className="lg:col-span-5 space-y-6">
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-5">
                                          <div className="flex items-center gap-3 pb-3 border-b border-gray-50">
                                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                      <BookOpen size={20} />
                                                </div>
                                                <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wider">Project Metadata</h3>
                                          </div>
                                          <div className="space-y-4">
                                                <div>
                                                      <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider block">Project Prototype</span>
                                                      <span className="text-sm font-bold text-gray-800">Kravix Food Delivery Platform</span>
                                                </div>
                                                <div>
                                                      <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider block">Department</span>
                                                      <span className="text-sm font-bold text-gray-800">Computer Science & Engineering</span>
                                                </div>
                                                <div>
                                                      <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider block">Course</span>
                                                      <span className="text-sm font-bold text-gray-800">B.Tech (Bachelor of Technology)</span>
                                                </div>
                                                <div>
                                                      <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider block">Academic Session</span>
                                                      <span className="text-sm font-bold text-gray-800">2022 - 2026</span>
                                                </div>
                                          </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-5">
                                          <div className="flex items-center gap-3 pb-3 border-b border-gray-50">
                                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                      <User size={20} />
                                                </div>
                                                <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wider">Developer Profile</h3>
                                          </div>
                                          <div className="space-y-4">
                                                <div>
                                                      <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider block">Project Developer</span>
                                                      <span className="text-sm font-bold text-gray-800">Samrat Mallick</span>
                                                </div>
                                                <div>
                                                      <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider block">Roll Number</span>
                                                      <span className="text-sm font-bold text-gray-800">CSE/2022/0832 (Demo Placeholder)</span>
                                                </div>
                                                <div>
                                                      <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider block">Registration Number</span>
                                                      <span className="text-sm font-bold text-gray-800">REG-832-2022-CSE (Demo Placeholder)</span>
                                                </div>
                                                <div>
                                                      <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider block">University affiliation</span>
                                                      <span className="text-sm font-bold text-gray-800">State University of Technology (Demo Placeholder)</span>
                                                </div>
                                          </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                                          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider pb-2 border-b border-gray-50">Academic Channels</h3>
                                          <div className="grid grid-cols-2 gap-3">
                                                <a
                                                      href="mailto:developer@example.com"
                                                      className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 hover:border-primary/20 hover:bg-primary/5 transition-all text-xs font-bold text-gray-700"
                                                >
                                                      <Mail size={16} className="text-primary" />
                                                      <span>Email</span>
                                                </a>
                                                <a
                                                      href="https://github.com"
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 hover:border-primary/20 hover:bg-primary/5 transition-all text-xs font-bold text-gray-700"
                                                >
                                                      <Github size={16} className="text-primary" />
                                                      <span>GitHub</span>
                                                </a>
                                                <a
                                                      href="https://linkedin.com"
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 hover:border-primary/20 hover:bg-primary/5 transition-all text-xs font-bold text-gray-700"
                                                >
                                                      <Linkedin size={16} className="text-primary" />
                                                      <span>LinkedIn</span>
                                                </a>
                                                <a
                                                      href="https://google.com"
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 hover:border-primary/20 hover:bg-primary/5 transition-all text-xs font-bold text-gray-700"
                                                >
                                                      <Globe size={16} className="text-primary" />
                                                      <span>Portfolio</span>
                                                </a>
                                          </div>
                                    </div>
                              </div>

                              <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-xs">
                                    <h3 className="font-bold text-gray-800 text-base md:text-lg mb-2">Academic Feedback & Inquiries</h3>
                                    <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-semibold mb-6">
                                          Submit reviews, technical feedback, or questions regarding our final year graduation prototype. Note: This form represents a simulated front-end interface.
                                    </p>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                          <div>
                                                <label htmlFor="name" className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Your Name</label>
                                                <input
                                                      type="text"
                                                      id="name"
                                                      required
                                                      value={formData.name}
                                                      onChange={handleChange}
                                                      placeholder="e.g. Professor Smith"
                                                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                                                />
                                          </div>

                                          <div>
                                                <label htmlFor="email" className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Email Address</label>
                                                <input
                                                      type="email"
                                                      id="email"
                                                      required
                                                      value={formData.email}
                                                      onChange={handleChange}
                                                      placeholder="reviewer@university.edu"
                                                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                                                />
                                          </div>

                                          <div>
                                                <label htmlFor="subject" className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Subject</label>
                                                <input
                                                      type="text"
                                                      id="subject"
                                                      required
                                                      value={formData.subject}
                                                      onChange={handleChange}
                                                      placeholder="Project Evaluation / Bug Report"
                                                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                                                />
                                          </div>

                                          <div>
                                                <label htmlFor="message" className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Message Content</label>
                                                <textarea
                                                      id="message"
                                                      rows={5}
                                                      required
                                                      value={formData.message}
                                                      onChange={handleChange}
                                                      placeholder="Type your message here..."
                                                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none resize-none"
                                                />
                                          </div>

                                          <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full py-3 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs md:text-sm transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                                {isSubmitting ? "Sending..." : "Submit Inquiry"}
                                                <ArrowRight size={16} />
                                          </button>
                                    </form>
                              </div>

                        </div>
                  </div>
            </div>
      );
};

export default ContactPage;
