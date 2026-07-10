import React from "react";

interface SectionCardProps {
      title: string;
      value?: string;
      description: string;
      icon?: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, value, description, icon }) => {
      return (
            <div className="bg-white p-6 rounded-2xl border border-gray-155 hover:border-primary/20 hover:shadow-md transition-all duration-300 flex flex-col items-center text-center space-y-3">
                  {icon && (
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              {icon}
                        </div>
                  )}
                  {value && (
                        <span className="text-2xl md:text-3xl font-black text-primary">
                              {value}
                        </span>
                  )}
                  <h3 className="text-base md:text-lg font-bold text-gray-850">
                        {title}
                  </h3>
                  <p className="text-xs md:text-sm text-text-secondary font-semibold leading-relaxed">
                        {description}
                  </p>
            </div>
      );
};

export default SectionCard;
