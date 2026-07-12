import { useCallback, useEffect, useRef, useState } from "react";
import { updateLiveLocation } from "@/services/api/rider.services";

const haversineMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const useRiderLocation = (orderId?: string, customerUserId?: string) => {
  const [riderLocation, setRiderLocation] = useState<[number, number] | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastEmitRef = useRef<{ lat: number; lng: number; time: number } | null>(null);

  const startWatching = useCallback(() => {
    if (watchIdRef.current !== null) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setRiderLocation([latitude, longitude]);

        if (!orderId || !customerUserId) return;
        const now = Date.now();
        const last = lastEmitRef.current;
        const movedEnough = !last || haversineMeters(last.lat, last.lng, latitude, longitude) > 5;
        const timeElapsed = !last || now - last.time > 5000;
        if (movedEnough || timeElapsed) {
          lastEmitRef.current = { lat: latitude, lng: longitude, time: now };
          updateLiveLocation({ latitude, longitude, orderId, customerUserId }).catch(() => {});
        }
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
  }, [orderId, customerUserId]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (orderId && customerUserId) startWatching();
    return stopWatching;
  }, [orderId, customerUserId, startWatching, stopWatching]);

  return { riderLocation, startWatching, stopWatching };
};
