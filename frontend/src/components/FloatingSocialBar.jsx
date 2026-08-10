import React, { useEffect, useState } from "react";
import { Facebook, Instagram, Twitter, Linkedin, Youtube, MessageCircle, Heart } from "lucide-react";
import { useApp } from "../context/AppContext";

const TiktokIcon = ({ size = 18, ...p }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...p}>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.61a8.16 8.16 0 0 0 4.77 1.52V6.69h-1.84z" />
    </svg>
);

const PALETTE = ["#39B8B2", "#E6DD08", "#B63CCC", "#D91012", "#39B8B2", "#E6DD08", "#B63CCC"];

const PLATFORMS = [
    { key: "facebook_url", Icon: Facebook, label: "Facebook" },
    { key: "instagram_url", Icon: Instagram, label: "Instagram" },
    { key: "twitter_url", Icon: Twitter, label: "X / Twitter" },
    { key: "linkedin_url", Icon: Linkedin, label: "LinkedIn" },
    { key: "youtube_url", Icon: Youtube, label: "YouTube" },
    { key: "tiktok_url", Icon: TiktokIcon, label: "TikTok" },
    { key: "whatsapp_url", Icon: MessageCircle, label: "WhatsApp" },
];

const FloatingSocialBar = () => {
    const { settings, tr } = useApp();
    const [open, setOpen] = useState(true);
    const position = settings?.social_bar_position || "right";

    // Hide if explicitly disabled
    if (position === "hidden") return null;

    const items = PLATFORMS.map((p, i) => ({ ...p, url: settings?.[p.key], color: PALETTE[i % PALETTE.length] })).filter((p) => p.url);
    if (items.length === 0) return null;

    const isRight = position === "right";

    return (
        <div
            className={`fixed top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center ${isRight ? "right-3" : "left-3"}`}
            data-testid="floating-social-bar"
            data-position={position}
        >
            {/* Toggle handle */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="bg-white rounded-full w-10 h-10 shadow-lg flex items-center justify-center mb-2 hover:scale-110 transition-transform"
                aria-label={open ? "Masquer" : "Afficher"}
                data-testid="floating-social-toggle"
            >
                <Heart size={18} className="text-brand-red" fill="#D91012" />
            </button>

            {/* The icons */}
            <div className={`relative flex flex-col items-center gap-3 transition-all duration-500 ${open ? "opacity-100 max-h-[600px]" : "opacity-0 max-h-0 overflow-hidden pointer-events-none"}`}>
                {/* Hand-drawn vertical wavy line behind */}
                <svg
                    className={`absolute top-2 bottom-2 ${isRight ? "right-1/2 translate-x-1/2" : "left-1/2 -translate-x-1/2"} w-8 -z-0 opacity-40`}
                    viewBox="0 0 20 200"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                >
                    <path d="M10 0 Q 18 25 10 50 T 10 100 T 10 150 T 10 200" stroke="#39B8B2" strokeWidth="2" strokeDasharray="4,4" fill="none" strokeLinecap="round" />
                </svg>

                {items.map((it, i) => {
                    const Icon = it.Icon;
                    return (
                        <a
                            key={it.key}
                            href={it.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={it.label}
                            data-testid={`floating-social-${it.key.replace("_url", "")}`}
                            className="group relative z-10"
                            style={{ animationDelay: `${i * 80}ms` }}
                        >
                            <div
                                className="w-11 h-11 rounded-full shadow-md flex items-center justify-center text-white transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-0.5"
                                style={{
                                    backgroundColor: it.color,
                                    borderRadius: i % 2 === 0 ? "60% 40% 50% 50% / 50% 60% 40% 50%" : "50% 50% 40% 60% / 60% 40% 60% 40%",
                                }}
                            >
                                <Icon size={18} />
                            </div>
                            {/* tooltip */}
                            <span
                                className={`absolute top-1/2 -translate-y-1/2 ${isRight ? "right-full mr-3" : "left-full ml-3"} whitespace-nowrap bg-brand-dark text-white text-xs font-display px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}
                            >
                                {it.label}
                            </span>
                        </a>
                    );
                })}

                {/* Bottom "Suivez-nous" label */}
                <div className="mt-2 px-2 py-1 rounded-full bg-white shadow-md font-hand text-brand-turquoise text-sm leading-none">
                    {tr ? tr("contact.followUs") : "Suivez-nous"}&nbsp;!
                </div>
            </div>
        </div>
    );
};

export default FloatingSocialBar;
