import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import ProtectedRoutes from "./components/common/protectedRoutes";
import PublicRoutes from "./components/common/publicRoutes";
import Navbar from "./components/navbar/navbar";
import AppSkeleton from "./components/common/AppSkeleton";
import { useAppData } from "./context/AppContext";
import Footer from "./components/home/footer";
import AiAssistant from "./components/common/AiAssistant";

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
const RiderLayout = lazy(() => import("./layouts/RiderLayout"));
const RiderDashboardPage = lazy(() => import("./pages/rider/Dashboard"));
const RiderOrdersPage = lazy(() => import("./pages/rider/Orders"));
const RiderOrderDetailsPage = lazy(() => import("./pages/rider/OrderDetails"));
const RiderEarningsPage = lazy(() => import("./pages/rider/Earnings"));
const RiderWalletPage = lazy(() => import("./pages/rider/Wallet"));
const RiderProfilePage = lazy(() => import("./pages/rider/Profile"));
const RiderDocumentsPage = lazy(() => import("./pages/rider/Documents"));
const RiderSettingsPage = lazy(() => import("./pages/rider/Settings"));
const CodOrderSuccess = lazy(() => import("./pages/codOrderSuccess"));
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
const About = lazy(() => import("./pages/about"));
const Help = lazy(() => import("./pages/help"));
const Privacy = lazy(() => import("./pages/privacy"));
const Terms = lazy(() => import("./pages/terms"));
const Refunds = lazy(() => import("./pages/refunds"));
const Blog = lazy(() => import("./pages/blog"));
const Contact = lazy(() => import("./pages/contact"));
const FAQ = lazy(() => import("./pages/faq"));

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
                              <Route element={
                                    <>
                                          <a 
                                                href="#main-content" 
                                                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-white px-4 py-2 rounded-lg z-50 font-bold focus:outline-none"
                                          >
                                                Skip to main content
                                          </a>
                                          <Navbar />
                                          <main id="main-content" className="flex-1 min-h-[60vh] focus:outline-none" tabIndex={-1}>
                                                <Outlet />
                                          </main>
                                          <Footer />
                                    </>
                              }>
                                    <Route path="/about" element={<About />} />
                                    <Route path="/help" element={<Help />} />
                                    <Route path="/privacy" element={<Privacy />} />
                                    <Route path="/terms" element={<Terms />} />
                                    <Route path="/refunds" element={<Refunds />} />
                                    <Route path="/blog" element={<Blog />} />
                                    <Route path="/contact" element={<Contact />} />
                                    <Route path="/faq" element={<FAQ />} />
                              </Route>
                              <Route element={<ProtectedRoutes />}>
                                    <Route path="/seller" element={<Restaurant />} />
                                    <Route path="/rider" element={<RiderLayout />}>
                                          <Route index element={<Navigate to="dashboard" replace />} />
                                          <Route path="dashboard" element={<RiderDashboardPage />} />
                                          <Route path="orders" element={<RiderOrdersPage />} />
                                          <Route path="orders/:id" element={<RiderOrderDetailsPage />} />
                                          <Route path="earnings" element={<RiderEarningsPage />} />
                                          <Route path="wallet" element={<RiderWalletPage />} />
                                          <Route path="profile" element={<RiderProfilePage />} />
                                          <Route path="documents" element={<RiderDocumentsPage />} />
                                          <Route path="settings" element={<RiderSettingsPage />} />
                                    </Route>
                                    <Route element={
                                          <>
                                                <a 
                                                      href="#main-content" 
                                                      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-white px-4 py-2 rounded-lg z-50 font-bold focus:outline-none"
                                                >
                                                      Skip to main content
                                                </a>
                                                <Navbar />
                                                <main id="main-content" className="flex-1 min-h-[60vh] focus:outline-none" tabIndex={-1}>
                                                      <Outlet />
                                                </main>
                                                <Footer />
                                          </>
                                    }>
                                          <Route path="/" element={<Home />} />
                                          <Route path="/search" element={<SearchPage />} />
                                          <Route path="/restaurant/:id" element={<CustomerRestaurantPage />} />
                                          <Route path="/address" element={<AddAddressPage />} />
                                          <Route path="/cart" element={<Cart />} />
                                          <Route path="/checkout" element={<Checkout />} />
                                          <Route path="/payment-success/:paymentId" element={<PaymentSuccess />} />
                                          <Route path="/ordersuccess" element={<OrderSuccess />} />
                                          <Route path="/order-success/:orderId" element={<CodOrderSuccess />} />
                                          <Route path="/orders" element={<CustomerOrder />} />
                                          <Route path="/orders/:id" element={<OrderDetails />} />
                                          <Route path="/select-role" element={<SelectRole />} />
                                          <Route path="/account" element={<Account />} />
                                          
                                          <Route path="*" element={<Navigate to="/" replace />} />
                                    </Route>
                              </Route>
                        </Routes>
                  </Suspense>
                  <AiAssistant />
            </BrowserRouter>
      );
};

export default App;
