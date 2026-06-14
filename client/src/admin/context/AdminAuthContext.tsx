import { createContext, useContext, useState, type ReactNode } from "react";
import { adminLogin as apiAdminLogin } from "../../utils/admin.api";
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
                  const res = await apiAdminLogin(email, password);
                  if (res && res.success) {
                        storage.setAdminToken(res.data.token);
                        setIsAdminAuth(true);
                        return true;
                  }
                  toast.error(res.message || "Login failed");
                  return false;
            } catch (error: any) {
                  toast.error(error.message || "Login failed");
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
