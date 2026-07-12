import { Link, useLocation } from "react-router-dom";
import { useAppData } from "@/context/AppContext";
import { Logo } from "@/components/common";
import { ShoppingCart, UserCircle, MapPin } from "lucide-react";
import SearchBar from "@/features/customer/components/SearchBar";
import { useMobile } from "@/hooks";

const Navbar = () => {
      const { isAuth, user, city, location, quantity } = useAppData();
      const currentLocation = useLocation();
      const isMobile = useMobile();
      const isSearchPage = currentLocation.pathname === "/search";
      const isHomePage = currentLocation.pathname === "/";
      const showSearch = isHomePage || isSearchPage;
      const isCustomer = isAuth && user?.role === "customer";

      return (
            <header className="w-full bg-background shadow-xs border-b border-gray-100">
                  <div className="container-app w-full mx-auto flex items-center justify-between gap-3 px-4 h-16 md:h-24 transition-all duration-300">
                        <Logo />
                        <div className="flex items-center gap-3">
                              {isAuth ? (
                                    <Link
                                          to="/account"
                                          aria-label="View user profile account"
                                          className="flex gap-2 items-center bg-gray-100/80 hover:bg-primary px-3 py-1.5 md:py-2 rounded-xl group transition-all duration-300 ease-in-out border border-gray-200/20 shadow-xs hover:shadow-sm"
                                          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                                    >
                                          <UserCircle
                                                size={isMobile ? 18 : 22}
                                                className="text-primary group-hover:text-white transition-colors duration-300 shrink-0"
                                          />
                                          {!isMobile && (
                                                <span className="text-gray-600 group-hover:text-white font-semibold transition-colors duration-300 text-sm">
                                                      Account
                                                </span>
                                          )}
                                    </Link>
                              ) : (
                                    <Link
                                          to="/login"
                                          aria-label="Login page"
                                          className="flex gap-2 items-center bg-gray-100/80 hover:bg-primary px-3 py-1.5 md:py-2 rounded-xl group transition-all duration-300 ease-in-out border border-gray-200/20 shadow-xs hover:shadow-sm"
                                          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                                    >
                                          <UserCircle
                                                size={isMobile ? 18 : 22}
                                                className="text-primary group-hover:text-white transition-colors duration-300 shrink-0"
                                          />
                                          {!isMobile && (
                                                <span className="text-gray-600 group-hover:text-white font-semibold transition-colors duration-300 text-sm">
                                                      Login
                                                </span>
                                          )}
                                    </Link>
                              )}
                              {isCustomer && (
                                    <Link
                                          to="/cart"
                                          aria-label={`Shopping Cart, ${quantity} items`}
                                          className="relative p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 group flex items-center justify-center cursor-pointer"
                                          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                                    >
                                          <ShoppingCart
                                                size={isMobile ? 22 : 26}
                                                className="text-primary transition-transform duration-300 group-hover:scale-105"
                                          />
                                          {quantity > 0 && (
                                                <span className="absolute top-0.5 right-0.5 inline-flex items-center justify-center w-5 h-5 bg-primary text-white rounded-full text-[10px] font-bold shadow-sm border-2 border-background">
                                                      {quantity}
                                                </span>
                                          )}
                                    </Link>
                              )}
                        </div>
                  </div>

                  {showSearch && (
                        <div className="border-t border-gray-150 py-2 px-3 bg-white/50 backdrop-blur-xs">
                              <div className="container-app">
                                    {isSearchPage ? (
                                          <div className="flex items-center gap-2 text-gray-600 py-1">
                                                <MapPin size={18} className="text-primary shrink-0 animate-bounce-once" />
                                                <span className="text-sm font-medium">
                                                      {location?.formattedAddress || city}
                                                </span>
                                          </div>
                                    ) : (
                                          <SearchBar
                                                redirectOnFocus={isHomePage}
                                                locationPrefix={
                                                      <div className="flex md:flex-row flex-col items-center md:gap-1.5 gap-0.5 text-gray-600 shrink-0 border-r border-gray-250 pr-3">
                                                            <MapPin size={16} className="text-primary shrink-0" />
                                                            <span className="text-xs md:text-sm font-semibold truncate max-w-20 sm:max-w-28 md:max-w-36">
                                                                  {city}
                                                            </span>
                                                      </div>
                                                }
                                          />
                                    )}
                              </div>
                        </div>
                  )}
            </header>
      );
};

export default Navbar;
