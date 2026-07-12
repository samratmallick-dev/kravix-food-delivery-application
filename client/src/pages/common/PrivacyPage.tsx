import { useEffect } from "react";
import SEO from "@/components/common/SEO";
import PageHeader from "@/components/common/legal/PageHeader";
import PolicySection from "@/components/common/legal/PolicySection";
import { Shield } from "lucide-react";

const Privacy = () => {
      useEffect(() => {
            window.scrollTo({
                  top: 0,
                  behavior: "smooth",
            });
      }, []);

      return (
            <div className="w-full bg-background min-h-screen pb-16">
                  <SEO
                        title="Privacy Policy | Kravix Project"
                        description="Read the Kravix academic demonstration privacy policy to understand data handling in our testing and sandbox environments."
                        path="/privacy"
                  />

                  <PageHeader
                        title="Academic Privacy Policy"
                        lastUpdated="July 2026"
                        description="This policy outlines data handling practices for the Kravix educational capstone project prototype. No real-world personal identifiers are shared or commercialized."
                        icon={Shield}
                  />

                  <div className="container-app px-4 max-w-4xl mt-8 space-y-6">
                        <PolicySection title="1. Simulated Data Collection">
                              <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-semibold">
                                    We collect information that you directly provide when registering an account, updating your prototype profile, or placing simulated orders. This data includes:
                              </p>
                              <ul className="list-disc pl-5 space-y-2 text-xs md:text-sm font-semibold text-text-secondary">
                                    <li>Demo Account credentials: Name, email address, password hash, phone number, and avatar image.</li>
                                    <li>Simulated location details: Input addresses and geofencing coordinates.</li>
                                    <li>Session and connection data: IP address logs, cookies, and local storage keys used to preserve user authentication state.</li>
                              </ul>
                        </PolicySection>

                        <PolicySection title="2. Purpose of Processing">
                              <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-semibold">
                                    All collected data is processed strictly for demonstration, evaluation, and system analysis purposes. Specifically, data is used to:
                              </p>
                              <ul className="list-disc pl-5 space-y-2 text-xs md:text-sm font-semibold text-text-secondary">
                                    <li>Orchestrate WebSocket messages between simulated customer dashboards, restaurants, and riders.</li>
                                    <li>Calculate geofencing distances and mock courier routes.</li>
                                    <li>Test database spatial querying ($geoNear) efficiency and response latency.</li>
                                    <li>Train and run localized cuisine preference filters for AI recommended menus.</li>
                              </ul>
                        </PolicySection>

                        <PolicySection title="3. Session Storage & Cookies">
                              <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-semibold">
                                    We use browser cookies and local storage tokens to manage active login sessions and cart memory. Disabling cookies will interrupt JWT verification routines and reset your cart selections, but will not impact the platform's public static page views.
                              </p>
                        </PolicySection>

                        <PolicySection title="4. Payment Security Sandbox">
                              <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-semibold">
                                    Kravix does not process or store genuine financial credentials. Online transactions are simulated using Stripe and Razorpay developer test key environments. All card data entered during the testing lifecycle uses standard mock tokens and is never charged real currency.
                              </p>
                        </PolicySection>

                        <PolicySection title="5. Data Retention & Sandboxed Hosting">
                              <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-semibold">
                                    Database schemas run inside isolated cloud sandboxes. This project is developed for educational purposes and is not intended to replace commercial food delivery systems. All dummy logs, order histories, and coordinates can be wiped regularly during development cycles or upon evaluator request.
                              </p>
                        </PolicySection>

                        <div className="bg-red-50 border border-primary/20 rounded-2xl p-6 text-center space-y-2 mt-8">
                              <h2 className="text-sm md:text-base font-bold text-gray-900">Academic Project Disclaimer</h2>
                              <p className="text-xs text-text-secondary font-semibold">
                                    If you have questions regarding data security in this final-year capstone, please contact the development team using our Contact page.
                              </p>
                        </div>
                  </div>
            </div>
      );
};

export default Privacy;
