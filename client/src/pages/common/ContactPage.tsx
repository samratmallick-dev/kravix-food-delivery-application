import React, { useState } from "react";
import PageHeader from "@/components/common/legal/PageHeader";
import SEO from "@/components/common/SEO";
import toast from "react-hot-toast";
import { Mail, Github, Linkedin, Globe, BookOpen, GraduationCap, User, ArrowRight } from "lucide-react";

const TEAM_MEMBERS = [
      {
            name: "Samrat Mallick",
            role: "Team Lead & Full Stack Developer",
            roll: "28100122019",
            reg: "222810110089",
            initials: "SM",
            gradient: "from-red-500 to-orange-500",
            email: "samratmallick832@gmail.com",
            github: "https://github.com/samratmallick-dev",
            linkedin: "https://www.linkedin.com/in/samrat-mallick01"
      },
      {
            name: "Shubhranil Chowdhury",
            role: "Frontend Developer & UI Designer",
            roll: "28100122046",
            reg: "222810110096",
            initials: "SC",
            gradient: "from-pink-500 to-rose-500",
            email: "subhranilchowdhury27@gmail.com",
            github: "https://github.com/shubhranil1",
            linkedin: "https://www.linkedin.com/in/shubhranil-chowdhury"
      },
 {
            name: "Tanushri Ghosh",
            role: "Testing & Documentation",
            roll: "28100122007",
            reg: "222810110118",
            initials: "TG",
            gradient: "from-pink-500 to-rose-500",
            email: "tanushrighosh396@gmail.com",
            github: "https://github.com/tanushri396815",
            linkedin: "https://www.linkedin.com/in/tanushri-ghosh1/"
      },
 {
            name: "Arup Kumar Das",
            role: "Backend and UIUX design",
            roll: "28100122071",
            reg: "222810110063",
            initials: "AKD",
            gradient: "from-pink-500 to-rose-500",
            email: "arup80424@gmail.com",
            github: "https://github.com/ArupKumarDas-Dev",
            linkedin: "https://www.linkedin.com/in/arup-kumar-das-85952a273"
      },
 {
            name: "Soumyajit Barick",
            role: "Documentation",
            roll: "28100122016",
            reg: "222810110103",
            initials: "SB",
            gradient: "from-pink-500 to-rose-500",
            email: "soumyajitbarick2004@gmail.com",
            github: "https://github.com/Soumyajit1608",
            linkedin: "https://www.linkedin.com/in/soumyajit-barick-113a47253"
      },
];

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

                  {/* Our Development Team Section */}
                  <div className="container-app px-4 max-w-5xl mt-12 space-y-6">
                        <div className="text-center md:text-left">
                              <h2 className="text-xl md:text-2xl font-black text-gray-805 tracking-tight flex items-center justify-center md:justify-start gap-2.5">
                                    <span className="p-2 rounded-lg bg-primary/10 text-primary">
                                          <User size={22} />
                                    </span>
                                    Our Development Team
                              </h2>
                              <p className="text-xs md:text-sm text-text-secondary mt-1.5 font-semibold">
                                    The talented team of developers, designers, and administrators behind Kravix.
                              </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                              {TEAM_MEMBERS.map((member, index) => (
                                    <div
                                          key={index}
                                          className="bg-white rounded-2xl border border-gray-100 hover:border-transparent p-6 shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group flex flex-col items-center text-center relative overflow-hidden"
                                    >
                                          {/* Accent line */}
                                          <div className={`absolute top-0 inset-x-0 h-1.5 bg-linear-to-r ${member.gradient}`} />

                                          {/* Avatar Circle */}
                                          <div className={`w-16 h-16 rounded-full bg-linear-to-br ${member.gradient} text-white font-black text-xl flex items-center justify-center shadow-md select-none group-hover:scale-105 transition-transform duration-300 mb-4`}>
                                                {member.initials}
                                          </div>

                                          <h3 className="font-bold text-gray-805 text-base group-hover:text-primary transition-colors duration-200">
                                                {member.name}
                                          </h3>
                                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/5 px-2.5 py-1 rounded-full mt-1.5 text-center">
                                                {member.role}
                                          </span>

                                          <div className="w-full border-t border-gray-50 pt-4 mt-4 space-y-2 text-left">
                                                <div className="flex justify-between items-center text-xs">
                                                      <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Roll No:</span>
                                                      <span className="font-bold text-gray-800">{member.roll}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                      <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Reg No:</span>
                                                      <span className="font-bold text-gray-800 text-right">{member.reg}</span>
                                                </div>
                                          </div>

                                          {/* Social links */}
                                          <div className="flex gap-2.5 mt-5">
                                                <a
                                                      href={`mailto:${member.email}`}
                                                      className="p-2 rounded-xl border border-gray-100 hover:border-primary/20 hover:bg-primary/5 text-gray-400 hover:text-primary transition-all duration-300"
                                                      aria-label={`Email ${member.name}`}
                                                >
                                                      <Mail size={16} />
                                                </a>
                                                <a
                                                      href={member.github}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="p-2 rounded-xl border border-gray-100 hover:border-primary/20 hover:bg-primary/5 text-gray-400 hover:text-primary transition-all duration-300"
                                                      aria-label={`${member.name}'s GitHub`}
                                                >
                                                      <Github size={16} />
                                                </a>
                                                <a
                                                      href={member.linkedin}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="p-2 rounded-xl border border-gray-100 hover:border-primary/20 hover:bg-primary/5 text-gray-400 hover:text-primary transition-all duration-300"
                                                      aria-label={`${member.name}'s LinkedIn`}
                                                >
                                                      <Linkedin size={16} />
                                                </a>
                                          </div>
                                    </div>
                              ))}
                        </div>
                  </div>
            </div>
      );
};

export default ContactPage;
