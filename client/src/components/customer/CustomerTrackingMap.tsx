import type { IOrder } from "../../types/types";
import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useSocket } from "../../context/SocketContext";
import { fetchRiderLocation } from "../../utils/rider.api";
import deliveryIconImage from "../../assets/Delivery_man.jpg";
import homeIconImage from "../../assets/Home.jpg";

const riderIcon = new L.Icon({ iconUrl: deliveryIconImage, iconSize: [50, 50], iconAnchor: [25, 50], popupAnchor: [0, -45] });
const homeIcon = new L.Icon({ iconUrl: homeIconImage, iconSize: [50, 50], iconAnchor: [25, 50], popupAnchor: [0, -45] });

const ACTIVE_TRACKING_STATUSES = ["rider_assigned", "picked_up", "out_for_delivery", "reached_delivery_location"];
const INTERPOLATION_DURATION = 2000;

const RoutePolyline = ({ from, to }: { from: [number, number]; to: [number, number] }) => {
      const map = useMap();
      useEffect(() => {
            let polyline: L.Polyline | null = null;
            let cancelled = false;
            const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
            fetch(url)
                  .then(r => r.json())
                  .then(data => {
                        if (cancelled) return;
                        const coords: [number, number][] = data?.routes?.[0]?.geometry?.coordinates?.map(
                              ([lng, lat]: [number, number]) => [lat, lng]
                        );
                        if (coords?.length) {
                              polyline = L.polyline(coords, { color: "#C22630", weight: 4, opacity: 0.8 }).addTo(map);
                        }
                  })
                  .catch(() => {});
            return () => {
                  cancelled = true;
                  polyline?.remove();
            };
      }, [from[0], from[1], to[0], to[1], map]);
      return null;
};

const SmoothRiderMarker = ({ target }: { target: [number, number] }) => {
      const map = useMap();
      const markerRef = useRef<L.Marker | null>(null);
      const currentPosRef = useRef<[number, number]>(target);
      const rafRef = useRef<number | null>(null);

      useEffect(() => {
            if (!markerRef.current) {
                  markerRef.current = L.marker(target, { icon: riderIcon })
                        .addTo(map)
                        .bindPopup('<span style="font-weight:600">Your Rider</span>');
                  currentPosRef.current = target;
                  return;
            }

            const from = currentPosRef.current;
            const to = target;
            const startTime = performance.now();

            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

            const animate = (now: number) => {
                  const elapsed = now - startTime;
                  const t = Math.min(elapsed / INTERPOLATION_DURATION, 1);
                  
                  const ease = 1 - Math.pow(1 - t, 3);
                  const lat = from[0] + (to[0] - from[0]) * ease;
                  const lng = from[1] + (to[1] - from[1]) * ease;
                  markerRef.current?.setLatLng([lat, lng]);
                  if (t < 1) {
                        rafRef.current = requestAnimationFrame(animate);
                  } else {
                        currentPosRef.current = to;
                        rafRef.current = null;
                  }
            };
            rafRef.current = requestAnimationFrame(animate);
      }, [target, map]);

      useEffect(() => () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
            markerRef.current?.remove();
            markerRef.current = null;
      }, []);

      return null;
};

const AutoFitBounds = ({ rider, delivery }: { rider: [number, number]; delivery: [number, number] }) => {
      const map = useMap();
      useEffect(() => {
            const bounds = L.latLngBounds([rider, delivery]);
            map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, animate: true });
      }, [rider, delivery, map]);
      return null;
};

const POLL_INTERVAL_MS = 5000;

const CustomerTrackingMap = ({ order }: { order: IOrder }) => {
      const { socket } = useSocket();
      const [riderLocation, setRiderLocation] = useState<[number, number] | null>(null);

      const isActive = ACTIVE_TRACKING_STATUSES.includes(order.status);
      const hasDeliveryCoords = order.deliveryAddress?.latitude != null && order.deliveryAddress?.longitude != null;

      useEffect(() => {
            setRiderLocation(null);
            if (!isActive || !order.riderId) return;

            const fetchLocation = () =>
                  fetchRiderLocation(order.riderId)
                        .then(res => {
                              if (res.data?.latitude != null && res.data?.longitude != null) {
                                    setRiderLocation([res.data.latitude, res.data.longitude]);
                              }
                        })
                        .catch(() => {});

            fetchLocation();
            const intervalId = setInterval(fetchLocation, POLL_INTERVAL_MS);
            return () => clearInterval(intervalId);
      }, [order._id, order.riderId, isActive]);

      useEffect(() => {
            if (!socket || !isActive) return;
            const handleLocation = ({ latitude, longitude }: { latitude: number; longitude: number }) => {
                  setRiderLocation([latitude, longitude]);
            };
            socket.on("rider:location", handleLocation);
            return () => { socket.off("rider:location", handleLocation); };
      }, [socket, isActive]);

      if (!isActive || !hasDeliveryCoords) return null;

      const deliveryLocation: [number, number] = [order.deliveryAddress.latitude!, order.deliveryAddress.longitude!];
      const mapCenter = riderLocation ?? deliveryLocation;

      return (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-md p-3">
                  <div className="flex items-center justify-between mb-2 px-1">
                        <p className="text-sm font-semibold text-gray-700">Live Rider Tracking</p>
                        <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${riderLocation ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${riderLocation ? "bg-green-500 animate-pulse" : "bg-amber-400 animate-pulse"}`} />
                              {riderLocation ? "Rider nearby" : "Waiting for rider…"}
                        </span>
                  </div>
                  <MapContainer center={mapCenter} zoom={14} className="w-full h-72 rounded-xl">
                        <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={deliveryLocation} icon={homeIcon}>
                              <Popup><span style={{ fontWeight: 600 }}>Your Location</span></Popup>
                        </Marker>
                        {riderLocation && (
                              <>
                                    <SmoothRiderMarker target={riderLocation} />
                                    <AutoFitBounds rider={riderLocation} delivery={deliveryLocation} />
                                    <RoutePolyline from={riderLocation} to={deliveryLocation} />
                              </>
                        )}
                  </MapContainer>
            </div>
      );
};

export default CustomerTrackingMap;
