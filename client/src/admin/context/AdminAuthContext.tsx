import axios from "axios";
import { createContext, useContext, useState, type ReactNode } from "react";
import { adminBaseUrl } from "../../components/common/constant";
import toast from "react-hot-toast";

interface AdminAuthContextType {
      isAdminAuth: boolean;
      adminLogin: (email: string, password: string) => Promise<boolean>;
      adminLogout: () => void;
      getAdminToken: () => string | null;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
      const [isAdminAuth, setIsAdminAuth] = useState<boolean>(
            () => !!localStorage.getItem("adminToken")
      );

      const getAdminToken = () => localStorage.getItem("adminToken");

      const adminLogin = async (email: string, password: string): Promise<boolean> => {
            try {
                  const { data } = await axios.post(`${adminBaseUrl}/login`, { email, password });
                  localStorage.setItem("adminToken", data.data.token);
                  setIsAdminAuth(true);
                  return true;
            } catch (error: any) {
                  toast.error(error.response?.data?.message || "Login failed");
                  return false;
            }
      };

      const adminLogout = () => {
            localStorage.removeItem("adminToken");
            setIsAdminAuth(false);
      };

      return (
            <AdminAuthContext.Provider value={{ isAdminAuth, adminLogin, adminLogout, getAdminToken }}>
                  {children}
            </AdminAuthContext.Provider>
      );
};

export const useAdminAuth = () => {
      const ctx = useContext(AdminAuthContext);
      if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
      return ctx;
};
