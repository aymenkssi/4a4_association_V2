import React from "react";
import { useApp } from "../context/AppContext";

// Logo: uses settings.logo_url if set (image), else falls back to inline SVG
export const Logo = ({ size = 56, className = "" }) => {
    const { settings } = useApp();
    const url = settings?.logo_url;
    if (url) {
        return (
            <img
                src={url.startsWith("http") || url.startsWith("/") ? url : `/${url}`}
                alt="4à4 dix-huit"
                width={size}
                height={size}
                className={`object-contain ${className}`}
                style={{ width: size, height: size }}
            />
        );
    }
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width={size} height={size} aria-label="4à4 dix-huit" className={className}>
            <rect x="4" y="4" width="52" height="52" rx="6" fill="#39B8B2" />
            <rect x="60" y="4" width="56" height="52" rx="6" fill="#E6DD08" />
            <rect x="4" y="60" width="52" height="56" rx="6" fill="#B63CCC" />
            <rect x="60" y="60" width="56" height="56" rx="6" fill="#D91012" />
            <path d="M30 84 L48 84 L48 70 L66 70 L66 56 L86 56" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

export default Logo;
