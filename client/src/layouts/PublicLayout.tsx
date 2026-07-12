import { Outlet } from "react-router-dom";
import { Navbar, Footer } from "@/components/layout";

const PublicLayout = () => (
      <>
            <a
                  href="#main-content"
                  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-white px-4 py-2 rounded-lg z-50 font-bold focus:outline-none"
            >
                  Skip to main content
            </a>
            <Navbar />
            <main id="main-content" className="flex-1 min-h-[60vh] focus:outline-none" tabIndex={-1}>
                  <Outlet />
            </main>
            <Footer />
      </>
);

export default PublicLayout;
