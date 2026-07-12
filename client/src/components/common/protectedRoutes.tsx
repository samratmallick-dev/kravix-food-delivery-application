import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppData } from "../../context/AppContext";
import AppSkeleton from "./AppSkeleton";

const ProtectedRoutes = () => {
    const { isAuth, user, loading } = useAppData();
    const location = useLocation();

    if (loading) return <AppSkeleton />;

    if (!isAuth) return <Navigate to="/login" replace />;

    if (!user) return <AppSkeleton />;

    if (user.role === null && location.pathname !== "/select-role") {
        return <Navigate to="/select-role" replace />;
    }

    if (user.role !== null && location.pathname === "/select-role") {
        if (user.role === "seller") return <Navigate to="/seller" replace />;
        if (user.role === "rider") return <Navigate to="/rider/dashboard" replace />;
        return <Navigate to="/" replace />;
    }

    if (user.role === "seller" && location.pathname !== "/seller") {
        return <Navigate to="/seller" replace />;
    }

    if (user.role === "rider" && !location.pathname.startsWith("/rider")) {
        return <Navigate to="/rider/dashboard" replace />;
    }

    if (user.role === "customer" && (location.pathname === "/seller" || location.pathname.startsWith("/rider"))) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoutes;