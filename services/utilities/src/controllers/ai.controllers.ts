import { Request, Response } from "express";
import axios from "axios";

const AI_MICROSERVICE_URL = process.env.AI_MICROSERVICE_URL || "http://127.0.0.1:5500";
const RESTAURANT_BASE_URL = process.env.RESTAURANT_BASE_URL || "http://localhost:9000";

async function fetchContextData(authToken: string, restaurantId?: string) {
    const contextData: {
        orders: { id: string; status: string }[];
        menu_items: { name: string; price: number; available: boolean }[];
    } = { orders: [], menu_items: [] };

    const authHeaders = { Authorization: `Bearer ${authToken}` };

    try {
        const ordersRes = await axios.get(`${RESTAURANT_BASE_URL}/api/v1/orders/me`, {
            headers: authHeaders,
            params: { limit: 5 },
        });
        const rawOrders = ordersRes.data?.data?.orders ?? ordersRes.data?.data ?? [];
        contextData.orders = rawOrders.map((o: any) => ({
            id: o._id ?? o.id,
            status: o.status,
        }));
    } catch {
        // silently skip — AI will work without order context
    }

    if (restaurantId) {
        try {
            const menuRes = await axios.get(
                `${RESTAURANT_BASE_URL}/api/v1/menu/${restaurantId}`,
                { headers: authHeaders }
            );
            const rawItems = menuRes.data?.data?.menuItems ?? menuRes.data?.data ?? [];
            contextData.menu_items = rawItems.slice(0, 10).map((item: any) => ({
                name: item.name,
                price: item.price,
                available: item.isAvailable ?? true,
            }));
        } catch {
            
        }
    }

    return contextData;
}

export const aiChat = async (req: Request, res: Response) => {
    try {
        const { message, userId, role, restaurantId } = req.body;

        if (!message || !userId || !role) {
            return res.status(400).json({ error: "Missing required fields: message, userId, role" });
        }

        const authToken = req.headers.authorization?.split(" ")[1] ?? "";
        const contextData = await fetchContextData(authToken, restaurantId);

        const response = await axios.post(`${AI_MICROSERVICE_URL}/chat`, {
            message,
            userId,
            role,
            contextData,
        });

        return res.status(200).json(response.data);
    } catch (error: any) {
        console.error("AI Chat Error:", error.response?.data || error.message);
        const isServiceDown = error.code === "ECONNREFUSED" || error.code === "ECONNRESET" || error.response?.status === 502;
        if (isServiceDown) {
            return res.status(200).json({
                reply: "I'm currently unavailable. Please try again in a moment.",
                intent_confidence: 0,
            });
        }
        return res.status(500).json({
            error: `Failed to communicate with AI Assistant: ${error.message}`,
        });
    }
};
