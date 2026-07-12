import { useEffect } from "react";
import SEO from "@/components/common/SEO";
import PageHeader from "@/components/common/legal/PageHeader";
import PolicySection from "@/components/common/legal/PolicySection";
import { FileText } from "lucide-react";

const Terms = () => {
      useEffect(() => {
            window.scrollTo({
                  top: 0,
                  behavior: "smooth",
            });
      }, []);

      return (
            <div className="w-full bg-background min-h-screen pb-16">
                  <SEO
                        title="Terms & Conditions | Kravix Project"
                        description="Read the terms of use for the Kravix educational food delivery prototype and sandbox environments."
                        path="/terms"
                  />

                  <PageHeader
                        title="Terms of Use"
                        lastUpdated="July 2026"
                        description="These terms outline the guidelines and agreements governing the use of the Kravix academic graduation project prototype."
                        icon={FileText}
                  />

                  <div className="container-app px-4 max-w-4xl mt-8 space-y-6">
                        <PolicySection title="1. Project Evaluation & Non-Commercial Scope">
                              <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-semibold">
                                    Kravix is an educational, non-commercial software prototype built for B.Tech Computer Science final-year graduation assessment. There are no legal business contracts, real food preparation partnerships, or functional logistics operations associated with this website. Use of this system constitutes agreement to evaluate it solely as a proof-of-concept software package.
                              </p>
                        </PolicySection>

                        <PolicySection title="2. Simulated Account Registration">
                              <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-semibold">
                                    Users may register mock customer, seller, or rider accounts to test dashboard interfaces. Registered users are responsible for keeping their dummy credentials safe. The development team is not responsible for any credential issues or database wipes occurring during server testing cycles.
                              </p>
                        </PolicySection>

                        <PolicySection title="3. Sandbox Transaction Guidelines">
                              <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-semibold">
                                    All payment pathways on Kravix use developer sandbox integrations (Stripe & Razorpay testing modes). Real currency, debit cards, or actual financial accounts must not be entered. The project team accepts no responsibility or financial liability for real monetary losses resulting from user input errors on test forms.
                              </p>
                        </PolicySection>

                        <PolicySection title="4. Prohibited Testing Actions">
                              <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-semibold">
                                    When testing the prototype, you agree not to perform actions that degrade the sandboxed server environment. Prohibited actions include:
                              </p>
                              <ul className="list-disc pl-5 space-y-2 text-xs md:text-sm font-semibold text-text-secondary">
                                    <li>DDOS attempts or API request flooding on hosted auth, restaurant, or coordinate endpoints.</li>
                                    <li>Injecting malicious scripts into review comment textareas or menu upload fields.</li>
                                    <li>Automated script-based scraping of mockup restaurant cards or menu details.</li>
                              </ul>
                        </PolicySection>

                        <PolicySection title="5. Absolute Disclaimer of Liability">
                              <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-semibold">
                                    Kravix is provided "as is" without warranties, representation, or guarantees of any kind. The development team is not responsible for transaction simulation bugs, WebSocket delays, geofencing misalignments, or database reset actions.
                              </p>
                        </PolicySection>

                        <div className="bg-red-50 border border-primary/20 rounded-2xl p-6 text-center space-y-2 mt-8">
                              <h2 className="text-sm md:text-base font-bold text-gray-900">Academic Review Agreement</h2>
                              <p className="text-xs text-text-secondary font-semibold">
                                    For any questions regarding academic terms or prototype operations, please contact the development team using our Contact page.
                              </p>
                        </div>
                  </div>
            </div>
      );
};

export default Terms;
