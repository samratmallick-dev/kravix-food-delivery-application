import React from "react";
import { Helmet } from "react-helmet-async";

interface StructuredDataProps {
      data: object;
}

const StructuredData: React.FC<StructuredDataProps> = ({ data }) => {
      return (
            <Helmet>
                  <script type="application/ld+json">
                        {JSON.stringify(data)}
                  </script>
            </Helmet>
      );
};

export default StructuredData;
