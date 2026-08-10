import React from "react";
import { Facebook, Instagram, Twitter, Linkedin, Youtube, MessageCircle } from "lucide-react";

// TikTok icon (no lucide native)
const TiktokIcon = ({ size = 18, ...p }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...p}>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.61a8.16 8.16 0 0 0 4.77 1.52V6.69h-1.84z" />
    </svg>
);

const ICONS = {
    facebook_url: Facebook,
    instagram_url: Instagram,
    twitter_url: Twitter,
    linkedin_url: Linkedin,
    youtube_url: Youtube,
    tiktok_url: TiktokIcon,
    whatsapp_url: MessageCircle,
};

const LABELS = {
    facebook_url: "Facebook",
    instagram_url: "Instagram",
    twitter_url: "X / Twitter",
    linkedin_url: "LinkedIn",
    youtube_url: "YouTube",
    tiktok_url: "TikTok",
    whatsapp_url: "WhatsApp",
};

export const SOCIAL_KEYS = Object.keys(ICONS);

export const SocialIcons = ({ settings, size = 18, className = "" }) => {
    return (
        <div className={`flex flex-wrap gap-3 ${className}`} data-testid="social-icons">
            {SOCIAL_KEYS.map((k) => {
                const url = settings?.[k];
                if (!url) return null;
                const Icon = ICONS[k];
                return (
                    <a
                        key={k}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={LABELS[k]}
                        data-testid={`social-${k.replace("_url", "")}`}
                        className="w-10 h-10 rounded-full bg-white/10 hover:bg-brand-turquoise flex items-center justify-center transition-colors text-white"
                    >
                        <Icon size={size} />
                    </a>
                );
            })}
        </div>
    );
};

export { LABELS as SOCIAL_LABELS };
export default SocialIcons;
