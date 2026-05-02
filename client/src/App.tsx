import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import Login from "./pages/login";
import Home from "./pages/home";
import SelectRole from "./pages/select-role";
import ProtectedRoutes from "./components/common/protectedRoutes";
import PublicRoutes from "./components/common/publicRoutes";
import Navbar from "./components/navbar/navbar";
import Account from "./pages/account";
import Restaurant from "./pages/restaurant";
import CustomerRestaurantPage from "./pages/customerRestaurantPage";
import Footer from "./components/home/footer";
import Cart from "./pages/cart";
import AddAddressPage from "./pages/address";
import SearchPage from "./pages/search";
import Checkout from "./pages/checkout";
import PaymentSuccess from "./pages/paymentSuccess";
import OrderSuccess from "./pages/orderSuccess";
import CustomerOrder from "./pages/customerOrder";
import OrderDetails from "./pages/orderDetails";
import RiderDashboard from "./pages/rider";
import AppSkeleton from "./components/common/AppSkeleton";
import { useAppData } from "./context/AppContext";
import AdminLayout from "./admin/components/AdminLayout";
import AdminLogin from "./admin/pages/AdminLogin";
import AdminOverview from "./admin/pages/AdminOverview";
import AdminOrders from "./admin/pages/AdminOrders";
import AdminUsers from "./admin/pages/AdminUsers";
import AdminRestaurants from "./admin/pages/AdminRestaurants";
import AdminRiders from "./admin/pages/AdminRiders";
import AdminFinances from "./admin/pages/AdminFinances";
import AdminAnalytics from "./admin/pages/AdminAnalytics";
import AdminSettings from "./admin/pages/AdminSettings";

const App = () => {
      const { loading } = useAppData();

      if (loading) return <AppSkeleton />;

      return (
            <BrowserRouter>
                  <Routes>
                        <Route path="/admin/login" element={<AdminLogin />} />
                        <Route path="/admin" element={<AdminLayout />}>
                              <Route index element={<Navigate to="/admin/dashboard" replace />} />
                              <Route path="dashboard" element={<AdminOverview />} />
                              <Route path="orders" element={<AdminOrders />} />
                              <Route path="users" element={<AdminUsers />} />
                              <Route path="restaurants" element={<AdminRestaurants />} />
                              <Route path="riders" element={<AdminRiders />} />
                              <Route path="finances" element={<AdminFinances />} />
                              <Route path="analytics" element={<AdminAnalytics />} />
                              <Route path="settings" element={<AdminSettings />} />
                        </Route>

                        <Route element={<PublicRoutes />}>
                              <Route path="/login" element={<Login />} />
                        </Route>
                        <Route element={<ProtectedRoutes />}>
                              <Route path="/seller" element={<Restaurant />} />
                              <Route path="/rider" element={<RiderDashboard />} />
                              <Route element={<><Navbar /><Outlet /><Footer /></>}>
                                    <Route path="/" element={<Home />} />
                                    <Route path="/search" element={<SearchPage />} />
                                    <Route path="/restaurant/:id" element={<CustomerRestaurantPage />} />
                                    <Route path="/address" element={<AddAddressPage />} />
                                    <Route path="/cart" element={<Cart />} />
                                    <Route path="/checkout" element={<Checkout />} />
                                    <Route path="/payment-success/:paymentId" element={<PaymentSuccess />} />
                                    <Route path="/ordersuccess" element={<OrderSuccess />} />
                                    <Route path="/orders" element={<CustomerOrder />} />
                                    <Route path="/orders/:id" element={<OrderDetails />} />
                                    <Route path="/select-role" element={<SelectRole />} />
                                    <Route path="/account" element={<Account />} />
                                    <Route path="*" element={<Navigate to="/" replace />} />
                              </Route>
                        </Route>
                  </Routes>
            </BrowserRouter>
      );
};

export default App;
