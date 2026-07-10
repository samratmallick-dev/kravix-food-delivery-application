import React from "react";
import { Helmet } from "react-helmet-async";

interface SEOProps {
      title: string;
      description: string;
      path: string;
      image?: string;
      type?: "website" | "restaurant" | "article" | "profile";
      children?: React.ReactNode;
}

const SEO: React.FC<SEOProps> = ({
      title,
      description,
      path,
      image = "https://kravix-nu.vercel.app/android-chrome-512x512.png",
      type = "website",
      children
}) => {
      const canonicalUrl = `https://kravix-nu.vercel.app${path}`;

      return (
            <Helmet>
                  <title>{title}</title>
                  <meta name="description" content={description} />
                  <link rel="canonical" href={canonicalUrl} />

                  <meta property="og:title" content={title} />
                  <meta property="og:description" content={description} />
                  <meta property="og:type" content={type} />
                  <meta property="og:url" content={canonicalUrl} />
                  <meta property="og:image" content={image} />
                  <meta property="og:site_name" content="Kravix" />
                  <meta property="og:locale" content="en_US" />

                  <meta name="twitter:card" content="summary_large_image" />
                  <meta name="twitter:title" content={title} />
                  <meta name="twitter:description" content={description} />
                  <meta name="twitter:image" content={image} />

                  {children}
            </Helmet>
      );
};

export default SEO;
