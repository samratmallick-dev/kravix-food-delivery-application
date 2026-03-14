import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/home";
import Login from "./pages/login";
import { Toaster } from "react-hot-toast";
import ProtectedRoutes from "./components/common/protectedRoutes";
import PublicRoutes from "./components/common/publicRoutes";
import SelectRole from "./pages/select-role";
import Navbar from "./components/navbar/header";
import Account from "./pages/account";
import Restaurant from "./pages/restaurant";
import { useAppData } from "./context/AppContext";

const App = () => {
      const { user } = useAppData();
      if (user?.role === "seller") return <Restaurant />;
      return (
            <BrowserRouter>
                  <Navbar />
                  <Routes>
                        <Route path="/" element={<Navigate to={"/home"} replace />} />
                        <Route path="/*" element={<Navigate to={"/home"} replace />} />
                        <Route element={<ProtectedRoutes />}>
                              <Route path="/home" element={<Home />} />
                              <Route path="/select-role" element={<SelectRole />} />
                              <Route path="/account" element={<Account />} />
                        </Route>
                        <Route element={<PublicRoutes />}>
                              <Route path="/login" element={<Login />} />
                        </Route>
                  </Routes>
                  <Toaster />
            </BrowserRouter>
      );
}

export default App;
