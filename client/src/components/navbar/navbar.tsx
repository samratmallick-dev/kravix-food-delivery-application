import { Link, useLocation } from "react-router-dom";
import { useAppData } from "../../context/AppContext";
import Logo from "./logo";
import { ShoppingCart, User2 } from "lucide-react";
import { BiMapPin } from "react-icons/bi";
import SearchBar from "./SearchBar";

const Navbar = () => {
      const { isAuth, city, quantity } = useAppData();
      const currentLocation = useLocation();
      const isSearchPage = currentLocation.pathname === "/search";
      const isHomePage = currentLocation.pathname === "/";
      const showSearch = isHomePage || isSearchPage;

      return (
            <div className="w-full bg-background shadow-md">
                  <div className="container-app w-full mx-auto flex items-center justify-between gap-2 px-4 py-3 md:h-24 h-20">
                        <Logo />
                        <div className="flex items-center gap-3">
                              {isAuth ? (
                                    <Link
                                          to="/account"
                                          className="flex gap-2 items-center bg-gray-200 hover:bg-primary md:px-5 md:py-2 p-2 rounded-lg group transition-all duration-300 ease-in-out"
                                          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                                    >
                                          <User2 size={24} className="text-primary group-hover:text-white transition-colors duration-300" />
                                          <span className="text-gray-500 group-hover:text-white font-medium transition-colors duration-300 md:block hidden">
                                                Account
                                          </span>
                                    </Link>
                              ) : (
                                    <Link
                                          to="/login"
                                          className="flex gap-2 items-center bg-gray-200 hover:bg-primary md:px-5 md:py-2 p-2 rounded-lg group transition-all duration-300 ease-in-out"
                                          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                                    >
                                          <User2 size={24} className="text-primary group-hover:text-white transition-colors duration-300" />
                                          <span className="text-gray-500 group-hover:text-white font-medium transition-colors duration-300 md:block hidden">
                                                Login
                                          </span>
                                    </Link>
                              )}
                              <Link to="/cart" className="relative" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                                    <ShoppingCart size={26} className="text-primary" />
                                    <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 bg-primary text-gray-200 rounded-full">
                                          {quantity}
                                    </span>
                              </Link>
                        </div>
                  </div>

                  {showSearch && (
                        <div className="border-t border-gray-200 py-2 px-3">
                              <div className="container-app flex items-center gap-3">
                                    <div className="flex items-center gap-2 text-gray-600 shrink-0">
                                          <BiMapPin size={18} className="text-primary" />
                                          <span className="text-sm truncate max-w-36 hidden sm:block">{city}</span>
                                    </div>
                                    <div className="flex-1">
                                          <SearchBar redirectOnFocus={isHomePage} />
                                    </div>
                              </div>
                        </div>
                  )}
            </div>
      );
};

export default Navbar;
