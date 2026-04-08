import axios from "axios";
import { useMemo } from "react";
import { adminBaseUrl } from "../../components/common/constant";

export const useAdminApi = () => {
      return useMemo(() => {
            const instance = axios.create({ baseURL: adminBaseUrl });
            instance.interceptors.request.use((config) => {
                  const token = localStorage.getItem("adminToken");
                  if (token) config.headers.Authorization = `Bearer ${token}`;
                  return config;
            });
            return instance;
      }, []);
};
