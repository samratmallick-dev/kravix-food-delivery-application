import { useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { useAppData } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { authBaseUrl } from "../components/common/constant";
import toast from "react-hot-toast";

type Role = "customer" | "rider" | "seller" | null;
const SelectRole = () => {

      const [role, setRole] = useState<Role>(null);

      const roles: Role[] = ["customer", "rider", "seller"];

      const { setUser } = useAppData();
      const navigate = useNavigate();

      const addRole = async () => {
            try {
                  const token = localStorage.getItem("token");
                  const { data } = await axios.put(`${authBaseUrl}/api/v1/auth/add-role`, { role }, {
                        headers: {
                              Authorization: `Bearer ${token}`
                        },
                        withCredentials: true
                  });

                  if (data.success) {
                        localStorage.setItem("token", data.token);
                        toast.success(data.message || "Role Updated Successfully");
                        setUser(data.data);
                        navigate("/", { replace: true });
                  } else {
                        toast.error(data.message || "Failed to update role");
                  }
            } catch (error: any) {
                  const message = error.response?.data?.message;
                  toast.error(message || "Problem while updating role");
            }
      };

      return (
            <div className="w-full min-h-screen bg-white px-4 flex justify-center items-center">
                  <div className="max-w-md w-full space-y-6">
                        <h1 className="text-center w-full flex items-center justify-center">
                              <span className="text-3xl font-extrabold text-gradient flex items-center gap-2">
                                    <UtensilsCrossed className="w-7 h-7 text-primary" /><span>আবার খাবো</span>
                              </span>
                        </h1>
                        <div className="w-full space-y-6">
                              <h1 className="text-center text-xl font-bold text-gray-500">
                                    Select Your Role
                              </h1>
                              <div className="space-y-4">
                                    {roles.map((item) => (
                                          <button
                                                key={item}
                                                onClick={() => setRole(item)}
                                                className={`w-full flex items-center justify-between p-4 border rounded-lg transition-all cursor-pointer ${role === item
                                                      ? "border-blue-500 bg-blue-50"
                                                      : "border-gray-200 hover:border-gray-300"
                                                      }`}
                                          >
                                                <span className="font-medium capitalize">Continue as {item}</span>
                                                <div className="w-5 h-5 rounded-full border flex items-center justify-center">
                                                      {role === item && (
                                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                      )}
                                                </div>
                                          </button>
                                    ))}
                              </div>
                              <button
                                    onClick={addRole}
                                    disabled={!role}
                                    className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition
                                          ${role ? "bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
                                                : "bg-gray-100 text-gray-400 cursor-not-allowed"}`
                                    }
                              >
                                    Continue
                              </button>
                        </div>
                  </div>
            </div>
      );
};

export default SelectRole;
