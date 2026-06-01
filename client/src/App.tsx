import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import ProtectedRoutes from "./components/common/protectedRoutes";
import PublicRoutes from "./components/common/publicRoutes";
import Navbar from "./components/navbar/navbar";
import AppSkeleton from "./components/common/AppSkeleton";
import { useAppData } from "./context/AppContext";
import Footer from "./components/home/footer";

const Login = lazy(() => import("./pages/login"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const Home = lazy(() => import("./pages/home"));
const SelectRole = lazy(() => import("./pages/select-role"));
const Account = lazy(() => import("./pages/account"));
const Restaurant = lazy(() => import("./pages/restaurant"));
const CustomerRestaurantPage = lazy(() => import("./pages/customerRestaurantPage"));
const Cart = lazy(() => import("./pages/cart"));
const AddAddressPage = lazy(() => import("./pages/address"));
const SearchPage = lazy(() => import("./pages/search"));
const Checkout = lazy(() => import("./pages/checkout"));
const PaymentSuccess = lazy(() => import("./pages/paymentSuccess"));
const OrderSuccess = lazy(() => import("./pages/orderSuccess"));
const CustomerOrder = lazy(() => import("./pages/customerOrder"));
const OrderDetails = lazy(() => import("./pages/orderDetails"));
const RiderDashboard = lazy(() => import("./pages/rider"));
const AdminLayout = lazy(() => import("./admin/components/AdminLayout"));
const AdminLogin = lazy(() => import("./admin/pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./admin/pages/AdminDashboard"));
const AdminUsers = lazy(() => import("./admin/pages/AdminUsers"));
const AdminRestaurants = lazy(() => import("./admin/pages/AdminRestaurants"));
const AdminRiders = lazy(() => import("./admin/pages/AdminRiders"));
const AdminOrders = lazy(() => import("./admin/pages/AdminOrders"));
const AdminAnalytics = lazy(() => import("./admin/pages/AdminAnalytics"));
const AdminCoupons = lazy(() => import("./admin/pages/AdminCoupons"));
const AdminReviews = lazy(() => import("./admin/pages/AdminReviews"));

const App = () => {
      const { loading } = useAppData();

      if (loading) return <AppSkeleton />;

      return (
            <BrowserRouter>
                  <Suspense fallback={<AppSkeleton />}>
                        <Routes>
                              <Route path="/admin/login" element={<AdminLogin />} />
                              <Route path="/admin" element={<AdminLayout />}>
                                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                                    <Route path="dashboard" element={<AdminDashboard />} />
                                    <Route path="users" element={<AdminUsers />} />
                                    <Route path="restaurants" element={<AdminRestaurants />} />
                                    <Route path="riders" element={<AdminRiders />} />
                                    <Route path="orders" element={<AdminOrders />} />
                                    <Route path="analytics" element={<AdminAnalytics />} />
                                    <Route path="coupons" element={<AdminCoupons />} />
                                    <Route path="reviews" element={<AdminReviews />} />
                              </Route>

                              <Route path="/verify-email" element={<VerifyEmailPage />} />
                              <Route element={<PublicRoutes />}>
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/register" element={<RegisterPage />} />
                                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                                    <Route path="/reset-password" element={<ResetPasswordPage />} />
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
                  </Suspense>
            </BrowserRouter>
      );
};

export default App;
