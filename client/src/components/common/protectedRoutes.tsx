import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppData } from "../../context/AppContext";

const ProtectedRoutes = () => {

      const { isAuth, loading, user } = useAppData();
      const location = useLocation();

      if (loading) return (
            <div className="flex items-center justify-center min-h-screen">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
      );

      if (!isAuth) return <Navigate to="/login" state={{ from: location }} replace />;

      if (user?.role === null && location.pathname !== "/select-role") return <Navigate to="/select-role" replace />;

      if (user?.role !== null && location.pathname === "/select-role") return <Navigate to="/home" replace />;

      return <Outlet />;
};

export default ProtectedRoutes;
