import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../lib/api";
import { translations, t } from "../lib/i18n";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
    const [lang, setLang] = useState(() => localStorage.getItem("lang") || "fr");
    const [user, setUser] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [settings, setSettings] = useState({
        helloasso_url: "https://www.helloasso.com/",
        contact_email: "contact@4a4dixhuit.org",
        contact_phone: "06 86 71 54 65",
        address: "14 rue du Simplon, 75018 Paris",
        facebook_url: "",
        instagram_url: "",
        twitter_url: "",
        linkedin_url: "",
        youtube_url: "",
        tiktok_url: "",
        whatsapp_url: "",
        social_bar_position: "right",
        site_title_fr: "4à4 dix-huit",
        site_title_en: "4à4 dix-huit",
        logo_url: "/logo.png",
        site_url: "https://4a4dixhuit.org",
        meta_description_fr: "",
        meta_description_en: "",
    });

    const changeLang = (l) => {
        setLang(l);
        localStorage.setItem("lang", l);
    };

    const tr = useCallback((path) => t(lang, path), [lang]);

    const loadSettings = useCallback(async () => {
        try {
            const r = await api.get("/settings");
            setSettings((s) => ({ ...s, ...r.data }));
        } catch (e) {
            // ignore
        }
    }, []);

    const checkAuth = useCallback(async () => {
        const token = localStorage.getItem("auth_token");
        if (!token) {
            setAuthChecked(true);
            return;
        }
        try {
            const r = await api.get("/auth/me");
            setUser(r.data);
        } catch (e) {
            localStorage.removeItem("auth_token");
        } finally {
            setAuthChecked(true);
        }
    }, []);

    useEffect(() => {
        loadSettings();
        checkAuth();
    }, [loadSettings, checkAuth]);

    const login = async (email, password) => {
        const r = await api.post("/auth/login", { email, password });
        localStorage.setItem("auth_token", r.data.token);
        setUser(r.data.user);
        return r.data.user;
    };

    const logout = () => {
        localStorage.removeItem("auth_token");
        setUser(null);
    };

    return (
        <AppContext.Provider
            value={{ lang, changeLang, tr, translations, user, authChecked, login, logout, settings, loadSettings, setSettings }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useApp must be used inside AppProvider");
    return ctx;
};
