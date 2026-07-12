import { Outlet } from "react-router-dom";
import Footer from "../components/home/footer";

const AuthLayout = () => (
      <div className="flex flex-col min-h-screen bg-white">
            <main className="flex-1 flex items-center justify-center px-4 py-10">
                  <Outlet />
            </main>
            <Footer />
      </div>
);

export default AuthLayout;
