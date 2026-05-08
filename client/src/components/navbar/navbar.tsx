import { Link, useLocation } from "react-router-dom";
import { useAppData } from "../../context/AppContext";
import Logo from "./logo";
import { ShoppingCart } from "lucide-react";
import { FaRegUserCircle } from "react-icons/fa";
import { BiMapPin } from "react-icons/bi";
import SearchBar from "./SearchBar";
import { useMobile } from "../common/useMobile";

const Navbar = () => {
      const { isAuth, user, city, location, quantity } = useAppData();
      const currentLocation = useLocation();
      const isMobile = useMobile();
      const isSearchPage = currentLocation.pathname === "/search";
      const isHomePage = currentLocation.pathname === "/";
      const showSearch = isHomePage || isSearchPage;
      const isCustomer = isAuth && user?.role === "customer";

      return (
            <div className="w-full bg-background shadow-md">
                  <div className="container-app w-full mx-auto flex items-center justify-between gap-2 px-4 py-3" style={{ height: isMobile ? 64 : 96 }}>
                        <Logo />
                        <div className="flex items-center gap-3">
                              {isAuth ? (
                                    <Link
                                          to="/account"
                                          className="flex gap-2 items-center bg-gray-200 hover:bg-primary px-3 py-2 rounded-lg group transition-all duration-300 ease-in-out"
                                          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                                    >
                                          <FaRegUserCircle size={isMobile ? 20 : 24} className="text-primary group-hover:text-white transition-colors duration-300" />
                                          {!isMobile && <span className="text-gray-500 group-hover:text-white font-medium transition-colors duration-300">Account</span>}
                                    </Link>
                              ) : (
                                    <Link
                                          to="/login"
                                          className="flex gap-2 items-center bg-gray-200 hover:bg-primary px-3 py-2 rounded-lg group transition-all duration-300 ease-in-out"
                                          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                                    >
                                          <FaRegUserCircle size={isMobile ? 20 : 24} className="text-primary group-hover:text-white transition-colors duration-300" />
                                          {!isMobile && <span className="text-gray-500 group-hover:text-white font-medium transition-colors duration-300">Login</span>}
                                    </Link>
                              )}
                              {isCustomer && (
                                    <Link to="/cart" className="relative" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                                          <ShoppingCart size={isMobile ? 22 : 26} className="text-primary" />
                                          {quantity > 0 && (
                                                <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 bg-primary text-gray-200 rounded-full text-xs">
                                                      {quantity}
                                                </span>
                                          )}
                                    </Link>
                              )}
                        </div>
                  </div>

                  {showSearch && (
                        <div className="border-t border-gray-200 py-2 px-3">
                              <div className="container-app">
                                    {isSearchPage ? (
                                          <div className="flex items-center gap-2 text-gray-600 py-1">
                                                <BiMapPin size={18} className="text-primary shrink-0" />
                                                <span className="text-sm">{location?.formattedAddress || city}</span>
                                          </div>
                                    ) : (
                                          <SearchBar redirectOnFocus={isHomePage} locationPrefix={
                                                <div className="flex md:flex-row flex-col items-center md:gap-2 gap-0.5 text-gray-600 shrink-0 border-r border-gray-200 pr-3">
                                                      <BiMapPin size={18} className="text-primary" />
                                                      <span className="text-sm truncate max-w-36">{city}</span>
                                                </div>
                                          } />
                                    )}
                              </div>
                        </div>
                  )}
            </div>
      );
};

export default Navbar;
