import { Navigate, Outlet } from "react-router-dom";
import { useAppData } from "../../context/AppContext";

const PublicRoutes = () => {

      const { isAuth, loading } = useAppData();

      if (loading) return (
            <div className="flex items-center justify-center min-h-screen">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
      );

      return isAuth ? <Navigate to="/home" replace /> : <Outlet />;

};

export default PublicRoutes;