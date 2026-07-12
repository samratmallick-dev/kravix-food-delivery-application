import { aiBaseUrl } from "../components/common/constant";
import { request } from "./request";

export interface AIChatPayload {
    message: string;
    userId: string;
    role: string;
    restaurantId?: string;
    currentPage?: string;
    currentModule?: string;
    preferredLanguage?: string;
    recentActions?: string[];
}

export interface AIChatResponse {
    reply: string;
    intent_confidence?: number;
}

export interface AIFeedbackPayload {
    messageId: string;
    message: string;
    reply: string;
    role: string;
    feedback: 1 | -1;
}

export const aiApi = {
    chat: (payload: AIChatPayload, tokenOverride?: string): Promise<AIChatResponse> => {
        return request<AIChatResponse>(`${aiBaseUrl}/chat`, {
            method: "POST",
            body: JSON.stringify(payload),
        }, tokenOverride);
    },
    feedback: (payload: AIFeedbackPayload): Promise<void> => {
        return request<void>(`${aiBaseUrl}/feedback`, {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },
};
