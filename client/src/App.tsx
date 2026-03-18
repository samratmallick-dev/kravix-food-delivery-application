import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/login";
import Home from "./pages/home";
import SelectRole from "./pages/select-role";
import ProtectedRoutes from "./components/common/protectedRoutes";
import PublicRoutes from "./components/common/publicRoutes";
import Navbar from "./components/navbar/navbar";
import Account from "./pages/account";
import { useAppData } from "./context/AppContext";
import Restaurant from "./pages/restaurant";
import CustomerRestaurantPage from "./pages/customerRestaurantPage";
import Footer from "./components/home/footer";
import Cart from "./pages/cart";
import AddAddressPage from "./pages/address";
import SearchPage from "./pages/search";

const App = () => {

      const { user, loading } = useAppData();

      if (loading) return null;

      const isSeller = user?.role === "seller";

      if(isSeller) return <Restaurant />

      return (
            <BrowserRouter>
                  <Navbar />
                  <Routes>
                        <Route element={<PublicRoutes />}>
                              <Route path="/login" element={<Login />} />
                        </Route>
                        <Route element={<ProtectedRoutes />}>
                              <Route path="/" element={<Home />} />
                              <Route path="/search" element={<SearchPage />} />
                              <Route path="/restaurant/:id" element={<CustomerRestaurantPage />} />
                              <Route path="/address" element={<AddAddressPage />} />
                              <Route path="/cart" element={<Cart />} />
                              <Route path="/select-role" element={<SelectRole />} />
                              <Route path="/account" element={<Account />} />
                        </Route>
                  </Routes>
                  <Footer />
            </BrowserRouter>
      );
}

export default App;
