import type { IOrder } from "../../types/types";
import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import { useSocket } from "../../context/SocketContext";
import deliveryIconImage from "../../assets/Delivery_man.jpg";
import homeIconImage from "../../assets/Home.jpg";

declare module "leaflet" {
      namespace Routing {
            function control(option: any): any;
            function osrmv1(option?: any): any;
      }
}

const riderIcon = new L.Icon({
      iconUrl: deliveryIconImage,
      iconSize: [50, 50],
      iconAnchor: [25, 50],
      popupAnchor: [0, -45],
});

const homeIcon = new L.Icon({
      iconUrl: homeIconImage,
      iconSize: [50, 50],
      iconAnchor: [25, 50],
      popupAnchor: [0, -45],
});

const ACTIVE_TRACKING_STATUSES = ["rider_assigned", "picked_up"];

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
                  router: L.Routing.osrmv1({
                        serviceUrl: "https://router.project-osrm.org/route/v1",
                        useHints: false,
                        timeout: 10000,
                  }),
            }).addTo(map);

            return () => {
                  try {
                        control.getPlan().setWaypoints([]);
                        map.removeControl(control);
                  } catch (_) {}
            };
      }, [from, to, map]);

      return null;
};

const MovingRiderMarker = ({ position }: { position: [number, number] }) => {
      const map = useMap();
      const markerRef = useRef<L.Marker | null>(null);

      useEffect(() => {
            if (!markerRef.current) {
                  markerRef.current = L.marker(position, { icon: riderIcon })
                        .addTo(map)
                        .bindPopup('<span class="font-medium">Rider Location</span>');
            } else {
                  markerRef.current.setLatLng(position);
            }
      }, [position, map]);

      useEffect(() => {
            return () => {
                  markerRef.current?.remove();
                  markerRef.current = null;
            };
      }, []);

      return null;
};

const MapCenterUpdater = ({ center }: { center: [number, number] }) => {
      const map = useMap();
      const hasRecentered = useRef(false);

      useEffect(() => {
            if (!hasRecentered.current) {
                  map.setView(center, map.getZoom());
                  hasRecentered.current = true;
            }
      }, [center, map]);

      return null;
};

const CustomerTrackingMap = ({ order }: { order: IOrder }) => {
      const { socket } = useSocket();
      const [riderLocation, setRiderLocation] = useState<[number, number] | null>(null);

      const isActive = ACTIVE_TRACKING_STATUSES.includes(order.status);
      const hasDeliveryCoords =
            order.deliveryAddress.latitude != null && order.deliveryAddress.longitude != null;

      useEffect(() => {
            setRiderLocation(null);
      }, [order._id]);

      useEffect(() => {
            if (!socket || !isActive) return;

            const handleLocation = ({ latitude, longitude }: { latitude: number; longitude: number }) => {
                  setRiderLocation([latitude, longitude]);
            };

            socket.on("rider:location", handleLocation);
            return () => {
                  socket.off("rider:location", handleLocation);
            };
      }, [socket, isActive]);

      if (!isActive || !hasDeliveryCoords) return null;

      const deliveryLocation: [number, number] = [
            order.deliveryAddress.latitude!,
            order.deliveryAddress.longitude!,
      ];

      const mapCenter = riderLocation ?? deliveryLocation;

      return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-3">
                  <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-700">Live Rider Tracking</p>
                        {!riderLocation && (
                              <span className="text-xs text-gray-400 animate-pulse">
                                    Waiting for rider location…
                              </span>
                        )}
                  </div>
                  <MapContainer center={mapCenter} zoom={14} className="w-full h-87.5 rounded-lg">
                        <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {riderLocation && (
                              <>
                                    <MovingRiderMarker position={riderLocation} />
                                    <MapCenterUpdater center={riderLocation} />
                                    <Routing from={riderLocation} to={deliveryLocation} />
                              </>
                        )}
                        <Marker position={deliveryLocation} icon={homeIcon}>
                              <Popup>
                                    <span className="font-medium">Your Delivery Location</span>
                              </Popup>
                        </Marker>
                  </MapContainer>
            </div>
      );
};

export default CustomerTrackingMap;