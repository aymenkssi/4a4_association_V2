import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { useApp } from "../context/AppContext";
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, AreaChart, Area,
} from "recharts";
import { Mail, Users, Calendar, Newspaper, Image, Eye, Globe, AlertCircle, TrendingUp, FileText, Video, RotateCcw } from "lucide-react";
import { toast } from "sonner";

// Country code → flag emoji
const flag = (code) => {
    if (!code || code.length !== 2 || code === "??" || code === "LO") return code === "LO" ? "🖥️" : "🌍";
    return String.fromCodePoint(...code.toUpperCase().split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
};

const KPI = ({ icon: Icon, label, value, sub, color, alert, testId }) => (
    <div className={`bg-white rounded-2xl p-5 border ${alert ? "border-brand-red/40 ring-2 ring-brand-red/20" : "border-gray-100"} relative`} data-testid={testId}>
        {alert && <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-brand-red animate-pulse" />}
        <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>
                <Icon size={20} className="text-white" />
            </div>
            <span className="text-xs font-display font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
        </div>
        <div className="text-3xl font-display font-bold text-brand-dark">{value}</div>
        {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
);

const Dashboard = () => {
    const { tr } = useApp();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [resetting, setResetting] = useState(false);

    const load = () => {
        setLoading(true);
        api.get("/admin/analytics").then((r) => setData(r.data)).catch(() => setData(null)).finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const resetStats = async () => {
        if (!window.confirm("Réinitialiser TOUTES les statistiques de visites (impossible à annuler) ?")) return;
        setResetting(true);
        try {
            const r = await api.delete("/admin/analytics");
            toast.success(`${r.data.deleted_visits} visites supprimées`);
            load();
        } catch (e) {
            toast.error("Erreur lors de la réinitialisation");
        } finally {
            setResetting(false);
        }
    };

    if (loading) return <div className="text-gray-500" data-testid="admin-dashboard-loading">Chargement…</div>;
    if (!data) return <div className="text-brand-red" data-testid="admin-dashboard-error">Erreur de chargement</div>;

    const i = data.indicators;
    const monthShort = (ym) => {
        const [y, m] = ym.split("-");
        const names = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
        return `${names[parseInt(m, 10) - 1]} ${y.slice(2)}`;
    };
    const timeline = (data.timeline || []).map((t) => ({ ...t, m: monthShort(t.month) }));
    const dayShort = (d) => {
        const dt = new Date(d);
        return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}`;
    };
    const daily = (data.daily_visits || []).map((d) => ({ ...d, d: dayShort(d.date) }));

    const maxCountry = (data.countries || []).reduce((m, c) => Math.max(m, c.count), 0) || 1;

    return (
        <div data-testid="admin-dashboard" className="space-y-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="font-display font-bold text-3xl text-brand-dark">{tr("admin.dashboard")}</h1>
                    <p className="text-gray-500">Statistiques en temps réel — données des 30 derniers jours</p>
                </div>
                <button
                    onClick={resetStats}
                    disabled={resetting}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-display font-semibold text-brand-red border-2 border-brand-red hover:bg-brand-red hover:text-white transition-colors disabled:opacity-60"
                    data-testid="dashboard-reset-stats"
                    title="Supprimer toutes les visites enregistrées"
                >
                    <RotateCcw size={14} />
                    {resetting ? "…" : "Réinitialiser les visites"}
                </button>
            </div>

            {/* Visitor KPIs (highlight) */}
            <section>
                <h2 className="text-sm font-display font-semibold text-gray-600 uppercase tracking-wider mb-3">Visiteurs</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPI icon={Eye} label="Aujourd'hui" value={i.visits_today} color="#39B8B2" testId="kpi-visits-today" />
                    <KPI icon={TrendingUp} label="7 derniers jours" value={i.visits_7d} color="#E6DD08" testId="kpi-visits-7d" />
                    <KPI icon={Eye} label="30 derniers jours" value={i.visits_30d} sub={`${i.unique_visitors_30d} visiteurs uniques`} color="#B63CCC" testId="kpi-visits-30d" />
                    <KPI icon={Globe} label="Total cumulé" value={i.total_visits} sub={`${data.countries?.length || 0} pays`} color="#D91012" testId="kpi-visits-total" />
                </div>
            </section>

            {/* Content KPIs */}
            <section>
                <h2 className="text-sm font-display font-semibold text-gray-600 uppercase tracking-wider mb-3">Contenu & engagement</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPI
                        icon={Mail}
                        label="Messages non lus"
                        value={i.unread_messages}
                        sub={`/ ${i.total_messages} au total`}
                        color="#39B8B2"
                        alert={i.unread_messages > 0}
                        testId="kpi-unread-messages"
                    />
                    <KPI
                        icon={Users}
                        label="Adhésions en attente"
                        value={i.pending_members}
                        sub={`/ ${i.total_members} au total`}
                        color="#B63CCC"
                        alert={i.pending_members > 0}
                        testId="kpi-pending-members"
                    />
                    <KPI
                        icon={Calendar}
                        label="Événements à venir"
                        value={i.upcoming_events}
                        sub={`/ ${i.total_events} au total`}
                        color="#E6DD08"
                        testId="kpi-upcoming-events"
                    />
                    <KPI
                        icon={Newspaper}
                        label="Actualités"
                        value={i.published_news}
                        sub={`${i.draft_news} brouillons`}
                        color="#D91012"
                        testId="kpi-news"
                    />
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                    <KPI icon={Image} label="Photos en galerie" value={i.gallery_images} color="#39B8B2" testId="kpi-gallery-images" />
                    <KPI icon={Video} label="Vidéos en galerie" value={i.gallery_videos} color="#B63CCC" testId="kpi-gallery-videos" />
                </div>
            </section>

            {/* Visits chart */}
            <section className="bg-white rounded-2xl border border-gray-100 p-6" data-testid="chart-daily-visits">
                <h3 className="font-display font-bold text-brand-dark mb-1">Visites quotidiennes</h3>
                <p className="text-xs text-gray-500 mb-4">30 derniers jours</p>
                <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={daily}>
                        <defs>
                            <linearGradient id="gradVisits" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#39B8B2" stopOpacity={0.6} />
                                <stop offset="100%" stopColor="#39B8B2" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="d" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #eee" }} />
                        <Area type="monotone" dataKey="visits" stroke="#39B8B2" strokeWidth={2.5} fill="url(#gradVisits)" name="Visites" />
                    </AreaChart>
                </ResponsiveContainer>
            </section>

            {/* Countries */}
            <section className="bg-white rounded-2xl border border-gray-100 p-6" data-testid="chart-countries">
                <h3 className="font-display font-bold text-brand-dark mb-1">Pays d'origine des visiteurs</h3>
                <p className="text-xs text-gray-500 mb-4">30 derniers jours · top 15</p>
                {(data.countries || []).length === 0 ? (
                    <p className="text-gray-500 text-sm">Pas encore de données de visiteurs. Naviguez sur le site public pour générer du trafic.</p>
                ) : (
                    <div className="space-y-2">
                        {data.countries.map((c, idx) => {
                            const pct = Math.round((c.count / maxCountry) * 100);
                            const colors = ["#39B8B2", "#E6DD08", "#B63CCC", "#D91012"];
                            return (
                                <div key={idx} className="flex items-center gap-3" data-testid={`country-row-${c.code}`}>
                                    <span className="text-xl" aria-hidden>{flag(c.code)}</span>
                                    <span className="w-32 text-sm font-display text-brand-dark truncate">{c.name}</span>
                                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: colors[idx % 4] }} />
                                    </div>
                                    <span className="text-xs text-gray-500 w-10 text-right">{c.count}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Top pages */}
            <section className="bg-white rounded-2xl border border-gray-100 p-6" data-testid="chart-top-pages">
                <h3 className="font-display font-bold text-brand-dark mb-1">Pages les plus visitées</h3>
                <p className="text-xs text-gray-500 mb-4">30 derniers jours</p>
                {(data.top_pages || []).length === 0 ? (
                    <p className="text-gray-500 text-sm">Pas encore de données.</p>
                ) : (
                    <ul className="space-y-2">
                        {data.top_pages.map((p, idx) => (
                            <li key={idx} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-0" data-testid={`top-page-${idx}`}>
                                <span className="font-mono text-gray-700">{p.path}</span>
                                <span className="font-display font-semibold text-brand-turquoise">{p.count}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* Monthly evolution */}
            <section className="bg-white rounded-2xl border border-gray-100 p-6" data-testid="chart-monthly-evolution">
                <h3 className="font-display font-bold text-brand-dark mb-1">Évolution sur 12 mois</h3>
                <p className="text-xs text-gray-500 mb-4">Adhésions, messages, actualités, visites</p>
                <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={timeline}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="m" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #eee" }} />
                        <Legend />
                        <Line type="monotone" dataKey="members" stroke="#39B8B2" strokeWidth={2.5} name="Adhésions" dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="messages" stroke="#B63CCC" strokeWidth={2.5} name="Messages" dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="news" stroke="#E6DD08" strokeWidth={2.5} name="Actualités" dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="visits" stroke="#D91012" strokeWidth={2.5} name="Visites" dot={{ r: 3 }} />
                    </LineChart>
                </ResponsiveContainer>
            </section>

            {/* Monthly bar chart split */}
            <section className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6" data-testid="chart-monthly-members">
                    <h3 className="font-display font-bold text-brand-dark mb-1">Adhésions par mois</h3>
                    <p className="text-xs text-gray-500 mb-4">12 derniers mois</p>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={timeline}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                            <XAxis dataKey="m" stroke="#9ca3af" tick={{ fontSize: 10 }} />
                            <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} allowDecimals={false} />
                            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #eee" }} />
                            <Bar dataKey="members" fill="#39B8B2" radius={[8, 8, 0, 0]} name="Adhésions" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-6" data-testid="chart-monthly-messages">
                    <h3 className="font-display font-bold text-brand-dark mb-1">Messages par mois</h3>
                    <p className="text-xs text-gray-500 mb-4">12 derniers mois</p>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={timeline}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                            <XAxis dataKey="m" stroke="#9ca3af" tick={{ fontSize: 10 }} />
                            <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} allowDecimals={false} />
                            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #eee" }} />
                            <Bar dataKey="messages" fill="#B63CCC" radius={[8, 8, 0, 0]} name="Messages" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
