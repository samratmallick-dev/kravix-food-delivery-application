export interface LocationData {
      latitude: number;
      longitude: number;
      formattedAddress: string;
      city: string;
}

class LocationService {
      private static instance: LocationService;

      private constructor() {}

      public static getInstance(): LocationService {
            if (!LocationService.instance) {
                  LocationService.instance = new LocationService();
            }
            return LocationService.instance;
      }

      public isSupported(): boolean {
            return typeof window !== "undefined" && "geolocation" in navigator;
      }

      public async getPermissionState(): Promise<PermissionState | "unsupported"> {
            if (!this.isSupported()) return "unsupported";
            try {
                  if (navigator.permissions && navigator.permissions.query) {
                        const res = await navigator.permissions.query({ name: "geolocation" as PermissionName });
                        return res.state;
                  }
            } catch (e) {
                  console.warn("Permissions API not supported or failed:", e);
            }
            return "prompt";
      }

      public async getCurrentLocation(): Promise<LocationData> {
            if (!this.isSupported()) {
                  throw new Error("UNSUPPORTED");
            }

            return new Promise<LocationData>((resolve, reject) => {
                  const options: PositionOptions = {
                        enableHighAccuracy: true,
                        timeout: 15000,
                        maximumAge: 300000,
                  };

                  let settled = false;
                  let watchId: number | null = null;
                  let watchFallbackTimer: ReturnType<typeof setTimeout> | null = null;

                  const cleanup = () => {
                        if (watchId !== null) {
                              navigator.geolocation.clearWatch(watchId);
                              watchId = null;
                        }
                        if (watchFallbackTimer !== null) {
                              clearTimeout(watchFallbackTimer);
                              watchFallbackTimer = null;
                        }
                  };

                  const onSuccess = async (position: GeolocationPosition) => {
                        if (settled) return;
                        settled = true;
                        cleanup();
                        const { latitude, longitude } = position.coords;
                        try {
                              const data = await this.reverseGeocode(latitude, longitude);
                              resolve(data);
                        } catch {
                              resolve({
                                    latitude,
                                    longitude,
                                    formattedAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                                    city: "Your Location",
                              });
                        }
                  };

                  const onError = (error: GeolocationPositionError) => {
                        if (settled) return;
                        settled = true;
                        cleanup();
                        console.error("LocationService error:", error.code, error.message);
                        switch (error.code) {
                              case error.PERMISSION_DENIED:
                                    reject(new Error("PERMISSION_DENIED"));
                                    break;
                              case error.POSITION_UNAVAILABLE:
                                    reject(new Error("POSITION_UNAVAILABLE"));
                                    break;
                              case error.TIMEOUT:
                                    reject(new Error("TIMEOUT"));
                                    break;
                              default:
                                    reject(new Error("UNKNOWN"));
                        }
                  };

                  navigator.geolocation.getCurrentPosition(onSuccess, (primaryErr) => {
                        if (settled) return;
                        console.warn("getCurrentPosition failed, trying watchPosition fallback:", primaryErr.code);
                        watchId = navigator.geolocation.watchPosition(onSuccess, onError, options);
                        watchFallbackTimer = setTimeout(() => {
                              if (!settled) onError(primaryErr);
                        }, 16000);
                  }, options);
            });
      }

      public async reverseGeocode(latitude: number, longitude: number): Promise<LocationData> {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            let response: Response;
            try {
                  response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
                        { headers: { "User-Agent": "Kravix/1.0" }, signal: controller.signal }
                  );
            } finally {
                  clearTimeout(timeoutId);
            }
            if (response!.status === 429) {
                  throw new Error("RATE_LIMITED");
            }
            if (!response!.ok) {
                  throw new Error("REVERSE_GEOCODE_FAILED");
            }
            const data = await response!.json();
            const resolvedCity =
                  data.address.city ||
                  data.address.town ||
                  data.address.village ||
                  data.address.suburb ||
                  data.address.city_district ||
                  data.address.county ||
                  "Your Location";
            const formattedAddress = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

            return {
                  latitude,
                  longitude,
                  formattedAddress,
                  city: resolvedCity,
            };
      }
}

export const locationService = LocationService.getInstance();
