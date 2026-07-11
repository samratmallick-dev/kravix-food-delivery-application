import type { IOrder } from "../../types/types";
import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import { updateLiveLocation } from "../../utils/rider.api";
import deliveryIconImage from "../../assets/Delivery_man.jpg";
import homeIconImage from "../../assets/Home.jpg";

declare module "leaflet" {
      namespace Routing {
            function control(option: any): any;
            function osrmv1(option?: any): any;
      }
}

const riderIcon = new L.Icon({ iconUrl: deliveryIconImage, iconSize: [50, 50], iconAnchor: [25, 50], popupAnchor: [0, -45] });
const homeIcon = new L.Icon({ iconUrl: homeIconImage, iconSize: [50, 50], iconAnchor: [25, 50], popupAnchor: [0, -45] });

const Routing = ({ from, to }: { from: [number, number]; to: [number, number] }) => {
      const map = useMap();
      useEffect(() => {
            const control = L.Routing.control({
                  waypoints: [L.latLng(from), L.latLng(to)],
                  lineOptions: { style: [{ color: "#E27444", weight: 5 }] },
                  addWaypoints: false,
                  draggableWaypoints: false,
                  show: false,
                  createMarker: () => null,
                  router: L.Routing.osrmv1({ serviceUrl: "https://router.project-osrm.org/route/v1", useHints: false, timeout: 10000 }),
            }).addTo(map);
            return () => {
                  try { control.getPlan().setWaypoints([]); map.removeControl(control); } catch (_) {}
            };
      }, [from, to, map]);
      return null;
};

const RiderOrderMap = ({ order }: { order: IOrder }) => {
      const [riderLocation, setRiderLocation] = useState<[number, number] | null>(null);
      const watchIdRef = useRef<number | null>(null);
      
      const lastEmitRef = useRef<{ lat: number; lng: number; time: number } | null>(null);

      useEffect(() => {
            if (order.deliveryAddress.latitude == null || order.deliveryAddress.longitude == null) return;
            if (!order.userId) return;

            const haversineMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
                  const toRad = (d: number) => (d * Math.PI) / 180;
                  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
                  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
                  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            };

            watchIdRef.current = navigator.geolocation.watchPosition(
                  (pos) => {
                        const { latitude, longitude } = pos.coords;
                        setRiderLocation([latitude, longitude]);

                        const now = Date.now();
                        const last = lastEmitRef.current;
                        const movedEnough = !last || haversineMeters(last.lat, last.lng, latitude, longitude) > 5;
                        const timeElapsed = !last || now - last.time > 5000;

                        if (movedEnough || timeElapsed) {
                              lastEmitRef.current = { lat: latitude, lng: longitude, time: now };
                              updateLiveLocation({
                                    latitude,
                                    longitude,
                                    orderId: order._id,
                                    customerUserId: order.userId
                              }).catch((err) => console.error("Failed to emit rider location:", err));
                        }
                  },
                  (err) => console.error("Geolocation error:", err),
                  { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
            );

            return () => {
                  if (watchIdRef.current !== null) {
                        navigator.geolocation.clearWatch(watchIdRef.current);
                        watchIdRef.current = null;
                  }
            };
      }, [order._id, order.userId, order.deliveryAddress.latitude, order.deliveryAddress.longitude]);

      if (order.deliveryAddress.latitude == null || order.deliveryAddress.longitude == null) return null;
      if (!riderLocation) return null;

      const deliveryLocation: [number, number] = [order.deliveryAddress.latitude, order.deliveryAddress.longitude];

      return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-3">
                  <MapContainer center={riderLocation} zoom={14} className="w-full h-87.5 rounded-lg">
                        <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={riderLocation} icon={riderIcon}>
                              <Popup><span className="font-medium">Your Location (Rider)</span></Popup>
                        </Marker>
                        <Marker position={deliveryLocation} icon={homeIcon}>
                              <Popup><span className="font-medium">Delivery Location</span></Popup>
                        </Marker>
                        <Routing from={riderLocation} to={deliveryLocation} />
                  </MapContainer>
            </div>
      );
};

export default RiderOrderMap;
