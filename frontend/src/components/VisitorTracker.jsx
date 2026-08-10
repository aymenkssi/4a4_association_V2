import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../lib/api";

// Tracks public route changes; skips /admin/*
const VisitorTracker = () => {
    const location = useLocation();
    useEffect(() => {
        if (location.pathname.startsWith("/admin")) return;
        // Fire and forget — never block the UI
        api.post("/track", { path: location.pathname, referrer: document.referrer || "" }).catch(() => {});
    }, [location.pathname]);
    return null;
};

export default VisitorTracker;
