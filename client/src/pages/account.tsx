import toast from "react-hot-toast";
import { useAppData } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { BiMapPin, BiPackage } from "react-icons/bi";
import { LogOut } from "lucide-react";
import { useMobile } from "../components/common/useMobile";

const Account = () => {
      const { user, setUser, setIsAuth } = useAppData();
      const navigate = useNavigate();
      const isMobile = useMobile();

      const logoutHandler = () => {
            localStorage.removeItem("token");
            setUser(null);
            setIsAuth(false);
            navigate("/login");
            toast.success("Logout Successfull");
      };

      const profileImage = user?.image;

      return (
            <div className="w-full h-full min-h-screen bg-white py-6 px-4">
                  <div className={`w-full bg-slate-200 rounded-lg text-gray-700 shadow-sm ${isMobile ? "max-w-full" : "container max-w-lg mx-auto"}`}>
                        <div className="flex items-center gap-4 border-b-2 border-gray-500 p-5">
                              <img
                                    src={profileImage}
                                    alt="Profile"
                                    className={`rounded-full object-cover ${isMobile ? "w-16 h-16" : "w-20 h-20"}`}
                                    referrerPolicy="no-referrer"
                              />
                              <div className="flex flex-col gap-0 min-w-0">
                                    <h1 className={`font-bold break-all ${isMobile ? "text-base" : "text-lg"}`}>{user?.name}</h1>
                                    <p className="text-sm text-gray-600 break-all">{user?.email}</p>
                              </div>
                        </div>
                        <div className="divide-y">
                              <div
                                    onClick={() => navigate("/orders")}
                                    className="flex items-center gap-4 p-5 cursor-pointer hover:bg-white transition ease-linear"
                              >
                                    <BiPackage size={isMobile ? 20 : 24} className="text-primary" />
                                    <span className="font-medium">My Orders</span>
                              </div>
                              <div
                                    onClick={() => navigate("/address")}
                                    className="flex items-center gap-4 p-5 cursor-pointer hover:bg-white transition ease-linear"
                              >
                                    <BiMapPin size={isMobile ? 20 : 24} className="text-primary" />
                                    <span className="font-medium">My Addresses</span>
                              </div>
                              <div
                                    onClick={logoutHandler}
                                    className="flex items-center gap-4 p-5 cursor-pointer hover:bg-white transition ease-linear rounded-b-lg"
                              >
                                    <LogOut size={isMobile ? 20 : 24} className="text-primary" />
                                    <span className="font-medium">Logout</span>
                              </div>
                        </div>
                  </div>
            </div>
      );
}

export default Account;
