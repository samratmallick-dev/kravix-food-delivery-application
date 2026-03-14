import { useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import toast from "react-hot-toast";
import { LogOut, PackageOpenIcon } from "lucide-react";
import { BiMapPin } from "react-icons/bi";

const Account = () => {
      const { user, setUser, setIsAuth } = useAppData();
      const firstLatter = user?.name.charAt(0).toUpperCase();
      const navigate = useNavigate();

      const logoutHandler = () => {
            localStorage.removeItem("token");
            setIsAuth(false);
            setUser(null);
            navigate("/login");
            toast.success("Logged out successfully");
            window.location.reload();
            return false;
      };

      return (
            <div className="pt-6 min-h-screen bg-gray-100">
                  <div className="mx-auto max-w-lg rounded-lg bg-slate-200 shadow-sm ">
                        <div className="flex items-center gap-4 border-b p-5 border-gray-400">
                              {
                                    user && user?.image ? <img src={user.image} referrerPolicy="no-referrer" alt={user.name} className="w-16 h-16 rounded-full" /> : <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#C22630] text-white font-bold text-xl">{firstLatter}</div>
                              }
                              <div>
                                    <h2 className="font-bold text-lg">{user?.name}</h2>
                                    <p className="text-gray-500 text-sm">{user?.email}</p>
                              </div>
                        </div>
                        <div className="divide-y divide-gray-400">
                              <div className="flex items-center gap-4 p-5 hover:bg-gray-50 cursor-pointer transition ease-in-out" onClick={() => navigate("/orders")}>
                                    <PackageOpenIcon className="w-5 h-5 text-[#C22630]" />
                                    <p className="font-medium">My Orders</p>
                              </div>
                              <div className="flex items-center gap-4 p-5 hover:bg-gray-50 cursor-pointer transition ease-in-out" onClick={() => navigate("/address")}>
                                    <BiMapPin className="w-5 h-5 text-[#C22630]" />
                                    <p className="font-medium">My Addresses</p>
                              </div>
                              <div className="flex items-center gap-4 p-5 hover:bg-gray-50 cursor-pointer transition ease-in-out" onClick={logoutHandler}>
                                    <LogOut className="w-5 h-5 text-[#C22630]" />
                                    <p className="font-medium">Logout</p>
                              </div>
                        </div>
                  </div>
            </div>
      );
}

export default Account;
