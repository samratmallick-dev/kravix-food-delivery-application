import { Navigate, Outlet } from "react-router-dom";
import { useAppData } from "@/context/AppContext";
import { AppSkeleton } from "@/components/common";

const PublicRoutes = () => {
      const { isAuth, loading, user } = useAppData();

      if (loading) return <AppSkeleton />;

      if (isAuth) {
            if (user?.role === "seller") return <Navigate to="/seller" replace />;
            if (user?.role === "rider") return <Navigate to="/rider/dashboard" replace />;
            return <Navigate to="/" replace />;
      }

      return <Outlet />;
};

export default PublicRoutes;