import { useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import api from "../lib/api";

// Tracks public route changes; skips /admin/*. Only runs if the visitor
// accepted analytics via the cookie consent banner (RGPD compliant).
const VisitorTracker = () => {
    const location = useLocation();

    const track = useCallback(() => {
        if (location.pathname.startsWith("/admin")) return;
        if (localStorage.getItem("cookie_consent") !== "accepted") return;
        api.post("/track", { path: location.pathname, referrer: document.referrer || "" }).catch(() => {});
    }, [location.pathname]);

    useEffect(() => { track(); }, [track]);

    useEffect(() => {
        const handler = () => track();
        window.addEventListener("cookie-consent-changed", handler);
        return () => window.removeEventListener("cookie-consent-changed", handler);
    }, [track]);

    return null;
};

export default VisitorTracker;
