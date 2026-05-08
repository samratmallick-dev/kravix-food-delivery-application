import { Navigate, Outlet } from "react-router-dom";
import { useAppData } from "../../context/AppContext";
import AppSkeleton from "./AppSkeleton";

const PublicRoutes = () => {
      const { isAuth, loading } = useAppData();

      if (loading) return <AppSkeleton />;

      return (
            isAuth ? <Navigate to={"/"} replace /> : <Outlet />
      );
};

export default PublicRoutes;