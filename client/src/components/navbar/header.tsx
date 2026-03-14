import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAppData } from "../../context/AppContext";
import { useEffect, useState } from "react";
import Logo from "./logo";
import { SearchIcon, ShoppingCart } from "lucide-react";
import { BiMapPin } from "react-icons/bi";

const Navbar = () => {

      const { isAuth, city } = useAppData();
      const currentLocation = useLocation();

      const isHomePage = currentLocation.pathname === "/home";

      const [searchParams, setSearchParams] = useSearchParams();
      const [search, setSearch] = useState(searchParams.get("search") || "");

      useEffect(() => {
            const timar = setTimeout(() => search ? setSearchParams({ search }) : setSearchParams({}), 400);
            return () => clearTimeout(timar);
      }, [search])

      return (
            <div className="sticky top-0 z-50 shadow-md bg-white">
                  <div className="w-full container mx-auto flex max-w-7xl justify-between items-center px-4 py-3">
                        <Logo />
                        <div className="flex items-center gap-4">
                              <Link to={"/cart"} className="relative">

                                    <ShoppingCart className="w-6 h-6 text-[#C22630]" />
                                    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#C22630] text-white text-xs font-semibold">
                                          0
                                    </span>
                              </Link>
                              {isAuth ? (
                                    <Link to={"/account"} className=" font-medium text-[#C22630]">
                                          Account
                                    </Link>
                              ) : (
                                    <Link to={"/login"} className="text-sm font-medium text-[#C22630]">
                                          Login
                                    </Link>
                              )}
                        </div>
                  </div>
                  {isHomePage && (
                        <div className="border-t py-3 px-4 border-gray-300">
                              <div className="container mx-auto flex items-center w-full max-w-7xl rounded-lg border border-gray-400 shadow-md">
                                    <div className="flex items-center gap-2 px-3 border-r border-gray-400 text-gray-700">
                                          <BiMapPin className="h-4 w-4 text-[#C22630]" />
                                          <span className="text-sm truncate max-w-35">{city}</span>
                                    </div>
                                    <div className="flex flex-1 items-center gap-2 px-3">
                                          <SearchIcon className="w-4 h-4 text-gray-400" />
                                          <input
                                                type="text"
                                                placeholder="Search for Restaurants"
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                className="w-full border-0 outline-none py-2 text-sm"
                                          />
                                    </div>
                              </div>
                        </div>
                  )}
            </div>
      );
}

export default Navbar;
