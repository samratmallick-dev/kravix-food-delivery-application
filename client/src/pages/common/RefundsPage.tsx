import { useEffect } from "react";
import SEO from "@/components/common/SEO";
import PageHeader from "@/components/common/legal/PageHeader";
import PolicySection from "@/components/common/legal/PolicySection";
import { RefreshCcw } from "lucide-react";

const Refunds = () => {
      useEffect(() => {
            window.scrollTo({
                  top: 0,
                  behavior: "smooth",
            });
      }, []);

      return (
            <div className="w-full bg-background min-h-screen pb-16">
                  <SEO
                        title="Refund Policy | Kravix Project"
                        description="Read the mock refund policy details for the Kravix academic demonstration prototype."
                        path="/refunds"
                  />

                  <PageHeader
                        title="Simulated Refund Policy"
                        lastUpdated="July 2026"
                        description="This document details how refund scenarios and order cancellations are handled inside the Kravix sandbox environment."
                        icon={RefreshCcw}
                  />

                  <div className="container-app px-4 max-w-4xl mt-8 space-y-6">
                        <PolicySection title="1. Sandbox Transaction Flow">
                              <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-semibold">
                                    Since Kravix is an academic final-year project, all financial integrations (Stripe and Razorpay gateways) operate in developer sandbox test modes. No real money transactions are processed, and no real currency is collected. Consequently, no real financial refunds can be issued.
                              </p>
                        </PolicySection>

                        <PolicySection title="2. Simulated Refund Triggering">
                              <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-semibold">
                                    To evaluate order lifecycle state machines, the application supports simulated refunds. In a testing scenario (such as canceling a mockup order before restaurant acceptance), the checkout database status switches to 'REFUNDED'. This simulates the payment gateway reversal workflow for system demonstration.
                              </p>
                        </PolicySection>

                        <PolicySection title="3. Mock Cancellation Rules">
                              <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-semibold">
                                    To evaluate state integrity inside the Order microservice:
                              </p>
                              <ul className="list-disc pl-5 space-y-2 text-xs md:text-sm font-semibold text-text-secondary">
                                    <li>Order cancellation and virtual wallet refund simulations are supported within 60 seconds of mock placement.</li>
                                    <li>Once a simulated restaurant transitions an order state to 'PREPARING', cancellations are locked at the schema level to test merchant protection flows.</li>
                              </ul>
                        </PolicySection>

                        <PolicySection title="4. Educational Evaluation">
                              <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-semibold">
                                    These simulated refund scenarios demonstrate event-driven database synchronization (updates propagated via RabbitMQ to invalidate redis cache entries and update client order views). This provides a sandbox environment for testing transactional state consistency.
                              </p>
                        </PolicySection>

                        <div className="bg-red-50 border border-primary/20 rounded-2xl p-6 text-center space-y-2 mt-8">
                              <h2 className="text-sm md:text-base font-bold text-gray-900">Prototype Disclaimer</h2>
                              <p className="text-xs text-text-secondary font-semibold">
                                    There is no financial liability or real-world refund processing capability within this student project workspace.
                              </p>
                        </div>
                  </div>
            </div>
      );
};

export default Refunds;