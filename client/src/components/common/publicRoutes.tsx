import { Navigate, Outlet } from "react-router-dom";
import { useAppData } from "../../context/AppContext"

const PublicRoutes = () => {
      const {isAuth, loading} = useAppData();

      if (loading) {
            return <div className="min-h-screen w-full flex items-center justify-center bg-amber-50">
                  <h1 className="text-lg text-gray-600 font-semibold">Loading...</h1>
            </div>
      }

      return (
            isAuth ? <Navigate to={"/"} replace /> : <Outlet />
      );
};

export default PublicRoutes;