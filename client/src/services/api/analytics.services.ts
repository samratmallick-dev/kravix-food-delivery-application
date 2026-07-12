import { analyticsBaseUrl } from "@/constants";
import { request } from "@/services/apiClient";
import { buildQueryString, storage } from "@/utils";
import type { ApiResponse } from "@/types";

export interface AnalyticsParams {
      startDate?: string;
      endDate?: string;
      interval?: "daily" | "weekly" | "monthly" | "yearly";
      restaurantId?: string;
}

export const getDashboardAnalytics = (params: AnalyticsParams): Promise<ApiResponse<any>> => {
      const qs = buildQueryString(params as any);
      return request<ApiResponse<any>>(`${analyticsBaseUrl}/${qs}`, {
            method: "GET",
      });
};

export const exportRevenueTrendsCSV = (params: AnalyticsParams): Promise<Blob> => {
      const qs = buildQueryString(params as any);
      return fetch(`${analyticsBaseUrl}/export${qs}`, {
            method: "GET",
            headers: {
                  Authorization: `Bearer ${storage.getToken() || ""}`,
            },
      }).then((res) => res.blob());
};
