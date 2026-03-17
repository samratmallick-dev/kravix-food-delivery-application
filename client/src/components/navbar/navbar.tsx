import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAppData } from "../../context/AppContext";
import { useEffect, useRef, useState } from "react";
import Logo from "./logo";
import { ShoppingCart, User2 } from "lucide-react";
import { BiMapPin, BiSearch } from "react-icons/bi";

const Navbar = () => {

      const { isAuth, city } = useAppData();

      const currentLocation = useLocation();

      const isHomePage = currentLocation.pathname === "/";

      const [searchParams, SetSearchParms] = useSearchParams("");
      const [search, setSearch] = useState(searchParams.get("search") || "");
      const [isFocused, setIsFocused] = useState(false);
      const inputRef = useRef<HTMLInputElement>(null);

      useEffect(() => {
            const timmer = setTimeout(() => {
                  if (search) {
                        SetSearchParms({ search });
                  } else {
                        SetSearchParms({});
                  }
            }, 0);
            return () => clearTimeout(timmer);
      }, [search])

      return (
            <div className="w-full bg-background/70 shadow-md">
                  <div className="container-app w-full mx-auto flex items-center justify-between gap-2 px-4 py-3 md:h-24 h-20">
                        <Logo />
                        <div className="flex items-center gap-3">

                              {
                                    isAuth ? (
                                          <Link
                                                to="/account"
                                                className="flex gap-2 items-center bg-gray-200 hover:bg-primary md:px-5 md:py-2 p-2 rounded-lg group transition-all duration-300 ease-in-out"
                                          >
                                                <User2
                                                      size={24}
                                                      className="text-primary group-hover:text-white transition-colors duration-300"
                                                />
                                                <span
                                                      className="text-gray-500 group-hover:text-white font-medium transition-colors duration-300 md:block hidden"
                                                >
                                                      Account
                                                </span>
                                          </Link>
                                    ) : (
                                          <Link
                                                to="/login"
                                                className="flex gap-2 items-center bg-gray-200 hover:bg-primary md:px-5 md:py-2 p-2 rounded-lg group transition-all duration-300 ease-in-out"
                                          >
                                                <User2
                                                      size={24}
                                                      className="text-primary group-hover:text-white transition-colors duration-300"
                                                />
                                                <span
                                                      className="text-gray-500 group-hover:text-white font-medium transition-colors duration-300 md:block hidden"
                                                >
                                                      Login
                                                </span>
                                          </Link>
                                    )
                              }
                              <Link to="/cart" className="relative ">
                                    <ShoppingCart size={26} className="text-primary" />
                                    <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 bg-primary text-gray-200 rounded-full">0</span>
                              </Link>
                        </div>
                  </div>
                  {
                        isHomePage && (
                              <div className="border-t border-gray-400 py-2 px-3">
                                    <div
                                          onClick={() => inputRef.current?.focus()}
                                          className={`w-full container-app flex items-center border shadow-sm rounded-lg py-2 cursor-text transition-colors duration-300 ${isFocused ? "border-primary" : "border-gray-600"}`}
                                    >
                                          <div className={`flex items-center gap-2 px-3 border-r text-gray-700 transition-colors duration-300 ${isFocused ? "border-primary" : "border-gray-600"}`}>
                                                <BiMapPin size={18} className="text-primary" />
                                                <span className="text-sm truncate max-w-36">{city}</span>
                                          </div>
                                          <div className="flex-1 flex items-center gap-2 px-2">
                                                <BiSearch size={20} className="text-primary" />
                                                <input
                                                      ref={inputRef}
                                                      name="search"
                                                      value={search}
                                                      onChange={(e) => setSearch(e.target.value)}
                                                      onFocus={() => setIsFocused(true)}
                                                      onBlur={() => setIsFocused(false)}
                                                      placeholder="Search For Restaurant"
                                                      className="w-full outline-none border-0 text-gray-600 text-md font-medium bg-transparent"
                                                />
                                          </div>
                                    </div>
                              </div>
                        )
                  }
            </div>
      );
}

export default Navbar;
