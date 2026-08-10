import React from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { LayoutDashboard, FileText, Calendar, Newspaper, Image, Users, MessageSquare, Settings, LogOut, ArrowLeft } from "lucide-react";
import Logo from "../components/Logo";

const sections = [
    { to: "/admin", key: "dashboard", icon: LayoutDashboard, end: true },
    { to: "/admin/pages", key: "pages", icon: FileText },
    { to: "/admin/events", key: "events", icon: Calendar },
    { to: "/admin/news", key: "news", icon: Newspaper },
    { to: "/admin/gallery", key: "gallery", icon: Image },
    { to: "/admin/members", key: "members", icon: Users },
    { to: "/admin/messages", key: "messages", icon: MessageSquare },
    { to: "/admin/settings", key: "settings", icon: Settings },
];

const AdminLayout = () => {
    const { tr, logout, user, authChecked } = useApp();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (authChecked && !user) navigate("/admin/login");
    }, [authChecked, user, navigate]);

    if (!authChecked) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!user) return null;

    return (
        <div className="min-h-screen flex bg-gray-50" data-testid="admin-layout">
            <aside className="w-64 bg-white border-r border-gray-100 flex flex-col">
                <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                    <Logo size={40} />
                    <div>
                        <div className="font-display font-bold text-brand-dark text-sm">4à4 dix-huit</div>
                        <div className="text-xs text-gray-500">Administration</div>
                    </div>
                </div>
                <nav className="p-3 flex-1 space-y-1">
                    {sections.map((s) => {
                        const Icon = s.icon;
                        return (
                            <NavLink
                                key={s.key}
                                to={s.to}
                                end={s.end}
                                data-testid={`admin-nav-${s.key}`}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-display font-medium transition-colors ${
                                        isActive ? "bg-brand-turquoise text-white" : "text-gray-700 hover:bg-gray-100"
                                    }`
                                }
                            >
                                <Icon size={18} />
                                {tr(`admin.${s.key}`)}
                            </NavLink>
                        );
                    })}
                </nav>
                <div className="p-3 border-t border-gray-100 space-y-1">
                    <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100" data-testid="admin-back-site">
                        <ArrowLeft size={16} /> {tr("admin.backToSite")}
                    </Link>
                    <button onClick={() => { logout(); navigate("/admin/login"); }} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-brand-red hover:bg-red-50 w-full" data-testid="admin-logout">
                        <LogOut size={16} /> {tr("nav.logout")}
                    </button>
                </div>
            </aside>
            <main className="flex-1 p-8 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
