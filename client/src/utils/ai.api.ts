import { aiBaseUrl } from "../components/common/constant";
import { request } from "./request";

export interface AIChatPayload {
    message: string;
    userId: string;
    role: string;
}

export interface AIChatResponse {
    reply: string;
    intent_confidence?: number;
}

export const aiApi = {
    chat: (payload: AIChatPayload): Promise<AIChatResponse> => {
        return request<AIChatResponse>(`${aiBaseUrl}/chat`, {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },
};
