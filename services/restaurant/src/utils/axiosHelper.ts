import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

export const postWithRetry = async (
  url: string,
  body: any,
  config?: AxiosRequestConfig,
  retries = 4,
  delayMs = 4000
): Promise<AxiosResponse<any>> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.post(url, body, config);
    } catch (error: any) {
      const status = error?.response?.status;
      const isRetryable = !status || [502, 503, 504].includes(status) || error.code === "ECONNABORTED" || error.message?.includes("Network Error");
      if (isRetryable && i < retries - 1) {
        console.warn(
          `[restaurant] Axios POST to ${url} failed (status: ${status || "Timeout/Network Error"}). Retrying in ${delayMs}ms... (Attempt ${i + 1}/${retries})`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Request failed after maximum retries");
};
