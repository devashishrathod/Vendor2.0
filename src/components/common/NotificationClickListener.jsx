import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NOTIFICATION_OPEN_PATH } from "@/utils/notificationLinks";

/**
 * An OS notification clicked while the panel is already open: the service
 * worker focuses this tab and posts `{ type: "NOTIFICATION_CLICK", url }`.
 * Route there in-app (no reload); NotificationOpenRoute picks the page.
 */
export default function NotificationClickListener() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return undefined;
    const handleMessage = (event) => {
      const url = event.data?.type === "NOTIFICATION_CLICK" ? event.data.url : null;
      if (typeof url === "string" && url.startsWith(NOTIFICATION_OPEN_PATH)) navigate(url);
    };
    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () => navigator.serviceWorker.removeEventListener("message", handleMessage);
  }, [navigate]);

  return null;
}
