import axios from "axios";
import { createContext, useContext, useState, type ReactNode } from "react";
import { adminBaseUrl } from "../../components/common/constant";
import toast from "react-hot-toast";
import { storage } from "../../utils/secureStorage";

interface AdminAuthContextType {
      isAdminAuth: boolean;
      adminLogin: (email: string, password: string) => Promise<boolean>;
      adminLogout: () => void;
      getAdminToken: () => string | null;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
      const [isAdminAuth, setIsAdminAuth] = useState<boolean>(
            () => !!storage.getAdminToken()
      );

      const getAdminToken = () => storage.getAdminToken();

      const adminLogin = async (email: string, password: string): Promise<boolean> => {
            try {
                  const { data } = await axios.post(`${adminBaseUrl}/login`, { email, password });
                  storage.setAdminToken(data.data.token);
                  setIsAdminAuth(true);
                  return true;
            } catch (error: any) {
                  toast.error(error.response?.data?.message || "Login failed");
                  return false;
            }
      };

      const adminLogout = () => {
            storage.removeAdminToken();
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
