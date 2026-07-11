import { useCallback, useEffect, useState } from "react";

type PermissionState = "granted" | "denied" | "prompt" | "unsupported";

export const usePermissions = () => {
  const [locationPerm, setLocationPerm] = useState<PermissionState>("prompt");

  const checkPermissions = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationPerm("unsupported");
      return;
    }
    try {
      const status = await navigator.permissions.query({ name: "geolocation" });
      setLocationPerm(status.state as PermissionState);
      status.onchange = () => setLocationPerm(status.state as PermissionState);
    } catch {
      setLocationPerm("prompt");
    }
  }, []);

  useEffect(() => { checkPermissions(); }, [checkPermissions]);

  return { locationPerm, checkPermissions };
};
