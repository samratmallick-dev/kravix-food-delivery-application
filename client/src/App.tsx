import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoutes, PublicRoutes } from "@/features/auth";
import { useAppData } from "@/context/AppContext";
import { AppSkeleton, AiAssistant } from "@/components/common";
import { PublicLayout, AdminLayout, RiderLayout, AuthLayout } from "@/layouts";
import { storage } from "@/utils";

const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const VerifyEmailPage = lazy(() => import("@/pages/auth/VerifyEmailPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage"));

const HomePage = lazy(() => import("@/pages/customer/HomePage"));
const SelectRolePage = lazy(() => import("@/pages/auth/SelectRolePage"));
const AccountPage = lazy(() => import("@/pages/customer/AccountPage"));
const CustomerRestaurantPage = lazy(() => import("@/pages/customer/CustomerRestaurantPage"));
const CartPage = lazy(() => import("@/pages/customer/CartPage"));
const AddAddressPage = lazy(() => import("@/pages/customer/AddressPage"));
const SearchPage = lazy(() => import("@/pages/customer/SearchPage"));
const CheckoutPage = lazy(() => import("@/pages/customer/CheckoutPage"));
const PaymentSuccessPage = lazy(() => import("@/pages/customer/PaymentSuccessPage"));
const OrderSuccessPage = lazy(() => import("@/pages/customer/OrderSuccessPage"));
const CodOrderSuccessPage = lazy(() => import("@/pages/customer/CodOrderSuccessPage"));
const CustomerOrderPage = lazy(() => import("@/pages/customer/CustomerOrderPage"));
const OrderDetailsPage = lazy(() => import("@/pages/customer/OrderDetailsPage"));

const RestaurantDashboardPage = lazy(() => import("@/pages/restaurant/RestaurantDashboardPage"));

const RiderDashboardPage = lazy(() => import("@/pages/rider/RiderDashboardPage"));
const RiderOrdersPage = lazy(() => import("@/pages/rider/RiderOrdersPage"));
const RiderOrderDetailsPage = lazy(() => import("@/pages/rider/RiderOrderDetailsPage"));
const RiderEarningsPage = lazy(() => import("@/pages/rider/RiderEarningsPage"));
const RiderWalletPage = lazy(() => import("@/pages/rider/RiderWalletPage"));
const RiderProfilePage = lazy(() => import("@/pages/rider/RiderProfilePage"));
const RiderDocumentsPage = lazy(() => import("@/pages/rider/RiderDocumentsPage"));
const RiderSettingsPage = lazy(() => import("@/pages/rider/RiderSettingsPage"));

const AdminLoginPage = lazy(() => import("@/pages/admin/AdminLoginPage"));
const AdminDashboardPage = lazy(() => import("@/pages/admin/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("@/pages/admin/AdminUsersPage"));
const AdminRestaurantsPage = lazy(() => import("@/pages/admin/AdminRestaurantsPage"));
const AdminRidersPage = lazy(() => import("@/pages/admin/AdminRidersPage"));
const AdminOrdersPage = lazy(() => import("@/pages/admin/AdminOrdersPage"));
const AdminAnalyticsPage = lazy(() => import("@/pages/admin/AdminAnalyticsPage"));
const AdminCouponsPage = lazy(() => import("@/pages/admin/AdminCouponsPage"));
const AdminReviewsPage = lazy(() => import("@/pages/admin/AdminReviewsPage"));

const AboutPage = lazy(() => import("@/pages/common/AboutPage"));
const HelpPage = lazy(() => import("@/pages/common/HelpPage"));
const PrivacyPage = lazy(() => import("@/pages/common/PrivacyPage"));
const TermsPage = lazy(() => import("@/pages/common/TermsPage"));
const RefundsPage = lazy(() => import("@/pages/common/RefundsPage"));
const BlogPage = lazy(() => import("@/pages/common/BlogPage"));
const ContactPage = lazy(() => import("@/pages/common/ContactPage"));
const FaqPage = lazy(() => import("@/pages/common/FaqPage"));

const App = () => {
      const { loading } = useAppData();

      if (loading && !!storage.getToken()) return <AppSkeleton />;

      return (
            <BrowserRouter>
                  <Suspense fallback={<AppSkeleton />}>
                        <Routes>
                              <Route path="/admin/login" element={<AdminLoginPage />} />
                              <Route path="/admin" element={<AdminLayout />}>
                                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                                    <Route path="dashboard" element={<AdminDashboardPage />} />
                                    <Route path="users" element={<AdminUsersPage />} />
                                    <Route path="restaurants" element={<AdminRestaurantsPage />} />
                                    <Route path="riders" element={<AdminRidersPage />} />
                                    <Route path="orders" element={<AdminOrdersPage />} />
                                    <Route path="analytics" element={<AdminAnalyticsPage />} />
                                    <Route path="coupons" element={<AdminCouponsPage />} />
                                    <Route path="reviews" element={<AdminReviewsPage />} />
                              </Route>
                              <Route element={<AuthLayout />}>
                                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                                    <Route element={<PublicRoutes />}>
                                          <Route path="/login" element={<LoginPage />} />
                                          <Route path="/register" element={<RegisterPage />} />
                                          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                                          <Route path="/reset-password" element={<ResetPasswordPage />} />
                                    </Route>
                              </Route>
                              <Route element={<PublicLayout />}>
                                    <Route path="/about" element={<AboutPage />} />
                                    <Route path="/help" element={<HelpPage />} />
                                    <Route path="/privacy" element={<PrivacyPage />} />
                                    <Route path="/terms" element={<TermsPage />} />
                                    <Route path="/refunds" element={<RefundsPage />} />
                                    <Route path="/blog" element={<BlogPage />} />
                                    <Route path="/contact" element={<ContactPage />} />
                                    <Route path="/faq" element={<FaqPage />} />
                              </Route>
                              <Route element={<ProtectedRoutes />}>
                                    <Route path="/seller" element={<RestaurantDashboardPage />} />
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
                                    <Route element={<PublicLayout />}>
                                          <Route path="/" element={<HomePage />} />
                                          <Route path="/search" element={<SearchPage />} />
                                          <Route path="/restaurant/:id" element={<CustomerRestaurantPage />} />
                                          <Route path="/address" element={<AddAddressPage />} />
                                          <Route path="/cart" element={<CartPage />} />
                                          <Route path="/checkout" element={<CheckoutPage />} />
                                          <Route path="/payment-success/:paymentId" element={<PaymentSuccessPage />} />
                                          <Route path="/ordersuccess" element={<OrderSuccessPage />} />
                                          <Route path="/order-success/:orderId" element={<CodOrderSuccessPage />} />
                                          <Route path="/orders" element={<CustomerOrderPage />} />
                                          <Route path="/orders/:id" element={<OrderDetailsPage />} />
                                          <Route path="/select-role" element={<SelectRolePage />} />
                                          <Route path="/account" element={<AccountPage />} />
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