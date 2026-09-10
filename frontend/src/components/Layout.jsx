import React, { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, Globe, Heart, MapPin, Phone, Mail, Lock, LayoutDashboard, LogOut } from "lucide-react";
import Logo from "./Logo";
import SocialIcons from "./SocialIcons";
import { useApp } from "../context/AppContext";

const navItems = [
    { to: "/", key: "home" },
    { to: "/a-propos", key: "about" },
    { to: "/nos-actions", key: "actions" },
    { to: "/evenements", key: "events" },
    { to: "/actualites", key: "news" },
    { to: "/galerie", key: "gallery" },
    { to: "/devenir-membre", key: "member" },
    { to: "/faire-un-don", key: "donate", action: true },
    { to: "/contact", key: "contact" },
];

export const Header = () => {
    const { tr, lang, changeLang, user, logout } = useApp();
    const [open, setOpen] = useState(false);
    const location = useLocation();

    React.useEffect(() => {
        setOpen(false);
    }, [location.pathname]);

    return (
        <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
                <Link to="/" className="flex items-center gap-3 flex-shrink-0" data-testid="nav-logo">
                    <Logo size={48} />
                    <div className="leading-tight whitespace-nowrap">
                        <div className="font-display font-bold text-lg text-brand-dark">4à4 dix-huit</div>
                        <div className="text-[11px] text-gray-500 uppercase tracking-wider">Amiraux · Simplon · Poissonniers</div>
                    </div>
                </Link>

                <nav className="hidden lg:flex items-center gap-1">
                    {navItems.map((n) => (
                        <NavLink
                            key={n.key}
                            to={n.to}
                            data-testid={`nav-${n.key}`}
                            className={({ isActive }) =>
                                `px-3 py-2 rounded-full text-sm font-display font-medium transition-colors whitespace-nowrap ${
                                    n.action
                                        ? "bg-brand-red text-white hover:bg-[#b80e10] ml-2"
                                        : isActive
                                          ? "text-brand-turquoise"
                                          : "text-brand-dark hover:text-brand-turquoise"
                                }`
                            }
                        >
                            {n.action && <Heart size={14} className="inline mr-1" />}
                            {tr(`nav.${n.key}`)}
                        </NavLink>
                    ))}
                    <button
                        onClick={() => changeLang(lang === "fr" ? "en" : "fr")}
                        className="ml-2 px-3 py-2 rounded-full border-2 border-brand-turquoise text-brand-turquoise hover:bg-brand-turquoise hover:text-white transition-colors text-sm font-display font-semibold inline-flex items-center gap-1"
                        data-testid="lang-toggle"
                        aria-label="Toggle language"
                    >
                        <Globe size={14} />
                        {lang.toUpperCase()}
                    </button>
                    {user ? (
                        <div className="ml-2 flex items-center gap-1.5">
                            {user.role === "admin" && (
                                <Link to="/admin" className="w-10 h-10 rounded-full bg-brand-dark text-white hover:bg-brand-turquoise transition-colors inline-flex items-center justify-center" data-testid="nav-admin-dashboard" title={tr("nav.admin")} aria-label={tr("nav.admin")}>
                                    <LayoutDashboard size={16} />
                                </Link>
                            )}
                            <span className="text-sm font-display font-semibold text-brand-dark px-1 hidden xl:inline" data-testid="nav-user-name">{(user.name || "").split(" ")[0]}</span>
                            <button onClick={logout} className="w-10 h-10 rounded-full border-2 border-gray-200 text-gray-600 hover:border-brand-red hover:text-brand-red transition-colors inline-flex items-center justify-center" data-testid="nav-logout" title={tr("nav.logout")} aria-label={tr("nav.logout")}>
                                <LogOut size={16} />
                            </button>
                        </div>
                    ) : (
                        <Link to="/connexion" className="ml-1 px-4 py-2 rounded-full bg-brand-dark text-white hover:bg-brand-turquoise transition-colors inline-flex items-center gap-2 text-sm font-display font-semibold" data-testid="nav-login">
                            <Lock size={14} /> {lang === "fr" ? "Connexion" : "Login"}
                        </Link>
                    )}
                </nav>

                <button
                    className="lg:hidden p-2 rounded-full hover:bg-gray-100"
                    onClick={() => setOpen((v) => !v)}
                    data-testid="mobile-menu-toggle"
                    aria-label="Menu"
                >
                    {open ? <X /> : <Menu />}
                </button>
            </div>

            {open && (
                <div className="lg:hidden border-t border-gray-100 bg-white">
                    <div className="px-4 py-3 flex flex-col gap-1">
                        {navItems.map((n) => (
                            <NavLink
                                key={n.key}
                                to={n.to}
                                data-testid={`mobile-nav-${n.key}`}
                                className={({ isActive }) =>
                                    `px-3 py-2 rounded-lg font-display font-medium ${
                                        n.action
                                            ? "bg-brand-red text-white"
                                            : isActive
                                              ? "text-brand-turquoise bg-brand-bg"
                                              : "text-brand-dark"
                                    }`
                                }
                            >
                                {tr(`nav.${n.key}`)}
                            </NavLink>
                        ))}
                        <button
                            onClick={() => changeLang(lang === "fr" ? "en" : "fr")}
                            className="mt-2 px-3 py-2 rounded-full border-2 border-brand-turquoise text-brand-turquoise font-display font-semibold inline-flex items-center justify-center gap-1"
                            data-testid="mobile-lang-toggle"
                        >
                            <Globe size={14} />
                            {lang === "fr" ? "English" : "Français"}
                        </button>
                        {user ? (
                            <>
                                {user.role === "admin" && (
                                    <Link to="/admin" className="mt-1 px-3 py-2 rounded-full bg-brand-dark text-white font-display font-semibold inline-flex items-center justify-center gap-2" data-testid="mobile-nav-admin-dashboard">
                                        <LayoutDashboard size={14} /> {tr("nav.admin")}
                                    </Link>
                                )}
                                <button onClick={logout} className="mt-1 px-3 py-2 rounded-full border-2 border-gray-200 text-brand-red font-display font-semibold inline-flex items-center justify-center gap-2" data-testid="mobile-nav-logout">
                                    <LogOut size={14} /> {tr("nav.logout")}
                                </button>
                            </>
                        ) : (
                            <Link to="/connexion" className="mt-1 px-3 py-2 rounded-full bg-brand-dark text-white font-display font-semibold inline-flex items-center justify-center gap-2" data-testid="mobile-nav-login">
                                <Lock size={14} /> {lang === "fr" ? "Connexion" : "Login"}
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export const Footer = () => {
    const { tr, settings } = useApp();
    return (
        <footer className="mt-20 bg-[#2a2a2a] text-gray-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid md:grid-cols-4 gap-10">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <Logo size={48} />
                        <div className="font-display text-white font-bold text-lg">4à4 dix-huit</div>
                    </div>
                    <p className="text-sm text-gray-400 italic">{tr("footer.tagline")}</p>
                </div>

                <div>
                    <h4 className="font-display text-white mb-3">{tr("footer.quickLinks")}</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link to="/a-propos" className="hover:text-brand-turquoise" data-testid="footer-about">{tr("nav.about")}</Link></li>
                        <li><Link to="/nos-actions" className="hover:text-brand-turquoise" data-testid="footer-actions">{tr("nav.actions")}</Link></li>
                        <li><Link to="/evenements" className="hover:text-brand-turquoise" data-testid="footer-events">{tr("nav.events")}</Link></li>
                        <li><Link to="/galerie" className="hover:text-brand-turquoise" data-testid="footer-gallery">{tr("nav.gallery")}</Link></li>
                        <li><Link to="/devenir-membre" className="hover:text-brand-turquoise" data-testid="footer-member">{tr("nav.member")}</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-display text-white mb-3">{tr("footer.association")}</h4>
                    <ul className="space-y-3 text-sm">
                        <li className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 text-brand-turquoise flex-shrink-0" /><span>{settings.address}</span></li>
                        <li className="flex items-center gap-2"><Phone size={16} className="text-brand-turquoise" /><a href={`tel:${settings.contact_phone}`} className="hover:text-brand-turquoise">{settings.contact_phone}</a></li>
                        <li className="flex items-center gap-2"><Mail size={16} className="text-brand-turquoise" /><a href={`mailto:${settings.contact_email}`} className="hover:text-brand-turquoise">{settings.contact_email}</a></li>
                    </ul>
                    <div className="flex gap-3 mt-4">
                        <SocialIcons settings={settings} />
                    </div>
                </div>

                <div>
                    <h4 className="font-display text-white mb-3">{tr("footer.legal")}</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link to="/mentions-legales" className="hover:text-brand-turquoise" data-testid="footer-legal">{tr("nav.legal")}</Link></li>
                        <li><Link to="/confidentialite" className="hover:text-brand-turquoise" data-testid="footer-privacy">{tr("nav.privacy")}</Link></li>
                        <li><Link to="/admin" className="hover:text-brand-turquoise text-xs text-gray-500" data-testid="footer-admin">{tr("nav.admin")}</Link></li>
                    </ul>
                    <a
                        href={settings.helloasso_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-6 inline-flex items-center gap-2 bg-brand-red hover:bg-[#b80e10] text-white px-4 py-2 rounded-full font-display font-semibold text-sm transition-colors"
                        data-testid="footer-donate"
                    >
                        <Heart size={14} />
                        {tr("nav.donate")}
                    </a>
                </div>
            </div>
            <div className="border-t border-white/10 text-xs text-gray-500 text-center py-4">
                © {new Date().getFullYear()} 4à4 dix-huit — {tr("footer.copyright")}
            </div>
        </footer>
    );
};

export const PublicLayout = ({ children }) => (
    <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
    </div>
);

export default PublicLayout;
