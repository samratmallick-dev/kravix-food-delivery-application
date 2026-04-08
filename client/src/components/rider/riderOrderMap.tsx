import type { IOrder } from "../../types/types";
import { useState, useEffect } from "react";
import {
      MapContainer,
      TileLayer,
      Marker,
      Popup,
      useMap
} from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import axios from "axios";
import { realtimeSocketBaseUrl } from "../common/constant";
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

interface Props {
      order: IOrder;
}

const Routing = ({
      from,
      to,
}: {
      from: [number, number];
      to: [number, number];
}) => {
      const map = useMap();

      useEffect(() => {
            const control = L.Routing.control({
                  waypoints: [L.latLng(from), L.latLng(to)],
                  lineOptions: {
                        style: [{ color: "#E27444", weight: 5 }],
                  },
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

const RiderOrderMap = ({ order }: Props) => {
      const [riderLocation, setRiderLocation] = useState<[number, number] | null>(null);

      useEffect(() => {
            if (order.deliveryAddress.latitude == null || order.deliveryAddress.longitude == null) {
                  return;
            }

            const fetchLocation = () => {
                  navigator.geolocation.getCurrentPosition(
                        (pos) => {
                              const latitude = pos.coords.latitude;
                              const longitude = pos.coords.longitude;

                              setRiderLocation([latitude, longitude]);

                              axios.post(
                                    `${realtimeSocketBaseUrl}/api/v1/socket/events`,
                                    {
                                          event: "rider:location",
                                          room: `User:${order.userId}`,
                                          payload: { latitude, longitude },
                                    },
                                    {
                                          headers: {
                                                "x-internal-key": import.meta.env.VITE_INTERNAL_KEY,
                                          },
                                    }
                              ).catch((err) => console.error("Failed to emit rider location:", err));
                        },
                        (err) => console.error("Geolocation error:", err),
                        {
                              enableHighAccuracy: true,
                              maximumAge: 5000,
                              timeout: 10000,
                        }
                  );
            };

            fetchLocation();

            const locationInterval = setInterval(fetchLocation, 10000);

            return () => clearInterval(locationInterval);
      }, [order.userId, order.deliveryAddress.latitude, order.deliveryAddress.longitude]);

      if (order.deliveryAddress.latitude == null || order.deliveryAddress.longitude == null) {
            return null;
      }

      const deliveryLocation: [number, number] = [
            order.deliveryAddress.latitude,
            order.deliveryAddress.longitude,
      ];

      if (!riderLocation) return null;

      return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-3">
                  <MapContainer
                        center={riderLocation}
                        zoom={14}
                        className="w-full h-87.5 rounded-lg"
                  >
                        <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={riderLocation} icon={riderIcon}>
                              <Popup>
                                    <span className="font-medium">Your Location (Rider)</span>
                              </Popup>
                        </Marker>
                        <Marker position={deliveryLocation} icon={homeIcon}>
                              <Popup>
                                    <span className="font-medium">Delivery Location</span>
                              </Popup>
                        </Marker>
                        <Routing from={riderLocation} to={deliveryLocation} />
                  </MapContainer>
            </div>
      );
};

export default RiderOrderMap;