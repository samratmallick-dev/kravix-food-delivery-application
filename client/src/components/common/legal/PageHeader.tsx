import React from "react";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
      title: string;
      description?: string;
      subtitle?: string;
      lastUpdated?: string;
      icon?: LucideIcon;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, subtitle, lastUpdated, icon: Icon }) => {
      const displayDesc = description || subtitle;
      return (
            <div className="text-center py-12 md:py-16 bg-linear-to-br from-gray-50 to-white rounded-3xl border border-gray-100 shadow-xs mb-8 flex flex-col items-center">
                  {Icon && (
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 select-none">
                              <Icon size={24} />
                        </div>
                  )}
                  <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
                        {title}
                  </h1>
                  {displayDesc && (
                        <p className="text-base md:text-lg text-text-secondary font-medium max-w-2xl mx-auto px-4">
                              {displayDesc}
                        </p>
                  )}
                  {lastUpdated && (
                        <p className="text-xs md:text-sm text-text-muted font-bold mt-4">
                              Last Updated: {lastUpdated}
                        </p>
                  )}
            </div>
      );
};

export default PageHeader;
