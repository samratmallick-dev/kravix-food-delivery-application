import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";
import type { IOrder } from "@/types";
import { fetchCurrentOrder as apiFetchCurrentOrder, updateOrderStatusByRider, generateDeliveryOtp } from "@/services/api/rider.services";
import { RIDER_ORDER_TRANSITIONS } from "@/utils";

export const useActiveOrder = (onDelivered?: () => void) => {
  const [currentOrder, setCurrentOrder] = useState<IOrder | null>(null);
  const currentOrderRef = useRef<IOrder | null>(null);
  currentOrderRef.current = currentOrder;

  const fetchCurrentOrder = useCallback(async () => {
    try {
      const res = await apiFetchCurrentOrder();
      setCurrentOrder(res.data || null);
    } catch {
      setCurrentOrder(null);
    }
  }, []);

  const handleStatusUpdate = useCallback(async (location: { latitude?: number; longitude?: number } | null, otp?: string, codPaymentMode?: string) => {
    if (!currentOrderRef.current) return;
    try {
      let lat = location?.latitude;
      let lng = location?.longitude;
      try {
        const fresh = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 5000 })
        );
        lat = fresh.coords.latitude;
        lng = fresh.coords.longitude;
      } catch {}

      const res = await updateOrderStatusByRider(currentOrderRef.current._id, lat, lng, otp, codPaymentMode);
      toast.success(res.message || "Status updated!");

      const nextStatus = RIDER_ORDER_TRANSITIONS[currentOrderRef.current.status];
      if (nextStatus === "delivered") {
        setCurrentOrder(null);
        onDelivered?.();
      } else if (nextStatus) {
        setCurrentOrder((prev) => prev ? { ...prev, status: nextStatus as IOrder["status"] } : prev);
      } else {
        fetchCurrentOrder();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  }, [fetchCurrentOrder, onDelivered]);

  const handleGenerateOtp = useCallback(async () => {
    if (!currentOrderRef.current) return;
    try {
      await generateDeliveryOtp(currentOrderRef.current._id);
      toast.success("OTP sent to customer!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate OTP");
      throw err;
    }
  }, []);

  return { currentOrder, setCurrentOrder, currentOrderRef, fetchCurrentOrder, handleStatusUpdate, handleGenerateOtp };
};
