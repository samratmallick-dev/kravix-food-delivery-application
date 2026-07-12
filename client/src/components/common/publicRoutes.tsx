import { Navigate, Outlet } from "react-router-dom";
import { useAppData } from "../../context/AppContext";
import AppSkeleton from "./AppSkeleton";

const PublicRoutes = () => {
      const { isAuth, loading } = useAppData();

      if (loading) return <AppSkeleton />;

      if (isAuth) {
            return <Navigate to={"/"} replace />;
      }

      return <Outlet />;
};

export default PublicRoutes;