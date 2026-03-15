import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppData } from "../../context/AppContext"

const ProtectedRoutes = () => {
      const {isAuth, user, loading} = useAppData();

      const location = useLocation();

      if(loading) {
            return (
                  <div className="w-full h-screen flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary animate-pulse">Loading...</span>
                  </div>
            )
      }

      if(!isAuth && location.pathname !== "/login") {
            return <Navigate to={"/login"} replace />;
      }

      if(user?.role === null && location.pathname !== "/select-role") return <Navigate to={"/select-role"} replace />;
      if(user?.role !== null && location.pathname === "/select-role") return <Navigate to={"/"} replace />;

      return <Outlet />;
};

export default ProtectedRoutes;