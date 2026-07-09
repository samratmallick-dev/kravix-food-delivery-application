import { request } from "./request";
import { analyticsBaseUrl } from "../components/common/constant";
import { buildQueryString } from "./query";
import type { ApiResponse } from "../types/api.types";
import { storage } from "./secureStorage";

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
