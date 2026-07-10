import React from "react";

interface PolicySectionProps {
      title: string;
      children: React.ReactNode;
}

const PolicySection: React.FC<PolicySectionProps> = ({ title, children }) => {
      return (
            <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-155 shadow-xs space-y-4">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-850 border-b border-gray-100 pb-3">
                        {title}
                  </h2>
                  <div className="text-sm md:text-base text-text-secondary leading-relaxed space-y-3">
                        {children}
                  </div>
            </section>
      );
};

export default PolicySection;
