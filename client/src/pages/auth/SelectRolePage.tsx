import { useState } from "react";
import { useAppData } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { updateRole } from "@/services/api/auth.services";
import toast from "react-hot-toast";
import { storage } from "@/utils";
import Logo from "@/components/common/Logo";

type Role = "customer" | "rider" | "seller" | null;
const SelectRole = () => {

      const [role, setRole] = useState<Role>(null);

      const roles: Role[] = ["customer", "rider", "seller"];

      const { fetchCurrentUser, fetchCart } = useAppData();
      const navigate = useNavigate();

      const addRole = async () => {
            try {
                  const res = await updateRole(role as string);
                  const token = res.data?.token;

                  if (token) {
                        storage.setToken(token);
                        const userData = await fetchCurrentUser();
                        await fetchCart();
                        toast.success("Role Updated Successfully");
                        if (userData?.role === "seller") {
                              navigate("/seller", { replace: true });
                        } else if (userData?.role === "rider") {
                              navigate("/rider/dashboard", { replace: true });
                        } else {
                              navigate("/", { replace: true });
                        }
                  } else {
                        toast.error("Failed to update role");
                  }
            } catch (error: any) {
                  const message = error.message;
                  toast.error(message || "Problem while updating role");
            }
      };

      return (
            <div className="w-full min-h-screen bg-white px-4 flex justify-center items-center">
                  <div className="max-w-md w-full space-y-6">
                        <div className="flex justify-center">
                              <Logo auth />
                        </div>
                        <div className="w-full space-y-6">
                              <h1 className="text-center text-xl font-bold text-gray-600">
                                    Select Your Role
                              </h1>
                              <div className="space-y-4">
                                    {roles.map((item) => (
                                          <button
                                                key={item}
                                                onClick={() => setRole(item)}
                                                className={`w-full flex items-center justify-between p-4 border rounded-lg transition-all cursor-pointer ${role === item
                                                      ? "border-primary bg-red-50"
                                                      : "border-gray-200 hover:border-gray-300"
                                                      }`}
                                          >
                                                <span className="font-medium capitalize">Continue as {item}</span>
                                                <div className="w-5 h-5 rounded-full border flex items-center justify-center">
                                                      {role === item && (
                                                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                                                      )}
                                                </div>
                                          </button>
                                    ))}
                              </div>
                              <button
                                    onClick={addRole}
                                    disabled={!role}
                                    className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
                                          role
                                                ? "bg-primary text-white hover:bg-red-700 cursor-pointer"
                                                : "bg-gray-100 text-gray-800 cursor-not-allowed"
                                    }`}
                              >
                                    Continue
                              </button>
                        </div>
                  </div>
            </div>
      );
};

export default SelectRole;
