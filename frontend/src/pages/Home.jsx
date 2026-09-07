import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Heart, Sparkles, Users, Calendar, Palette, School, HeartHandshake } from "lucide-react";
import api, { mediaUrl } from "../lib/api";
import { useApp } from "../context/AppContext";
import ActivityBlob from "../components/ActivityBlob";
import SEO from "../components/SEO";
import CountUp from "../components/CountUp";

const FALLBACK_HERO = "https://images.pexels.com/photos/21530046/pexels-photo-21530046.jpeg";

const Home = () => {
    const { tr, lang, settings } = useApp();
    const [page, setPage] = useState(null);
    const [actionsPage, setActionsPage] = useState(null);
    const [news, setNews] = useState([]);
    const [events, setEvents] = useState([]);

    useEffect(() => {
        api.get("/pages/home").then((r) => setPage(r.data)).catch(() => {});
        api.get("/pages/actions").then((r) => setActionsPage(r.data)).catch(() => {});
        api.get("/news").then((r) => setNews((r.data || []).slice(0, 3))).catch(() => {});
        api.get("/events").then((r) => setEvents((r.data || []).slice(0, 3))).catch(() => {});
    }, []);

    const c = page?.content?.[lang] || {};
    const a = actionsPage?.content?.[lang] || {};
    const activities = a.activities || [];

    const missionsTitle = lang === "fr" ? "Nos missions" : "Our missions";
    const missions = (lang === "fr"
        ? [
            { icon: Palette, color: "#39B8B2", text: "Réduire les inégalités d'accès à la culture et à l'art pour améliorer la réussite scolaire." },
            { icon: School, color: "#E6DD08", text: "Lisibilité de l'école — favoriser l'ouverture des écoles sur le quartier." },
            { icon: HeartHandshake, color: "#B63CCC", text: "Faciliter l'accès et le lien avec les familles." },
        ]
        : [
            { icon: Palette, color: "#39B8B2", text: "Reduce inequalities in access to culture and art to improve academic success." },
            { icon: School, color: "#E6DD08", text: "School visibility — opening schools up to the neighborhood." },
            { icon: HeartHandshake, color: "#B63CCC", text: "Making access and connection with families easier." },
        ]);

    return (
        <div data-testid="home-page">
            <SEO />
            {/* Hero */}
            <section className="relative overflow-hidden bg-brand-bg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 lg:pt-20 lg:pb-32 grid lg:grid-cols-2 gap-10 items-center">
                    {/* Decorative scribbles */}
                    <svg className="absolute top-10 right-20 w-20 h-20 text-brand-yellow opacity-80" viewBox="0 0 100 100" fill="none">
                        <path d="M10 50 Q 30 10 50 50 T 90 50" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                    </svg>
                    <svg className="absolute bottom-20 left-10 w-16 h-16 text-brand-purple opacity-80 animate-float" viewBox="0 0 100 100" fill="none">
                        <path d="M20 80 L40 60 L60 80 L80 50" stroke="currentColor" strokeWidth="6" strokeDasharray="4,6" strokeLinecap="round" />
                    </svg>

                    <div className="relative z-10">
                        <div className="font-hand text-2xl text-brand-turquoise mb-3" data-testid="hero-tagline">
                            {c.hero_subtitle || tr("home.discover")}
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-display font-bold text-brand-dark leading-[1.05] mb-6">
                            <span className="hand-underline">{c.hero_title?.split(" ")[0] || "Au cœur"}</span>{" "}
                            {c.hero_title?.split(" ").slice(1).join(" ") || "du quartier"}
                        </h1>
                        <p className="text-lg text-gray-600 leading-relaxed max-w-xl mb-8">
                            {c.hero_description}
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Link to="/devenir-membre" className="btn-primary" data-testid="hero-cta-member">
                                <Users size={18} /> {c.cta_primary || tr("nav.member")}
                            </Link>
                            <a href={settings.helloasso_url} target="_blank" rel="noopener noreferrer" className="btn-action" data-testid="hero-cta-donate">
                                <Heart size={18} /> {c.cta_action || tr("nav.donate")}
                            </a>
                        </div>
                    </div>

                    <div className="relative h-[420px] lg:h-[520px]">
                        <div className="absolute top-0 right-0 w-3/4 h-3/4 blob bg-brand-turquoise/15 -z-0"></div>
                        <div className="absolute top-6 right-6 w-[80%] h-[80%] overflow-hidden rounded-[40%_60%_60%_40%/50%_50%_50%_50%] shadow-2xl">
                            <img src={mediaUrl(c.hero_image) || FALLBACK_HERO} alt="Communauté" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute bottom-0 left-0 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 max-w-[230px] animate-float">
                            <div className="w-12 h-12 rounded-full bg-brand-yellow flex items-center justify-center">
                                <Sparkles className="text-brand-dark" size={22} />
                            </div>
                            <div>
                                <div className="font-display font-bold text-brand-dark text-sm">20+ ans</div>
                                <div className="text-xs text-gray-500">d'engagement</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats / Intro */}
            <section className="py-16 lg:py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-start">
                        <div>
                            <h2 className="text-3xl lg:text-5xl font-display font-bold text-brand-dark mb-6">
                                <span className="hand-underline hand-underline-yellow">{c.intro_title?.split(" ").slice(0, 2).join(" ") || "Une association"}</span>{" "}
                                {c.intro_title?.split(" ").slice(2).join(" ") || "vivante depuis 2005"}
                            </h2>
                            <p className="text-gray-600 leading-relaxed text-lg">{c.intro_text}</p>
                            <Link to="/a-propos" className="btn-secondary mt-6" data-testid="home-about-link">
                                {tr("common.readMore")} <ArrowRight size={18} />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {(c.stats || []).map((s, i) => {
                                const colors = ["#39B8B2", "#E6DD08", "#B63CCC", "#D91012"];
                                return (
                                    <div key={i} className="bg-brand-bg rounded-3xl p-6 text-center card-lift" data-testid={`home-stat-${i}`}>
                                        <CountUp
                                            value={s.value}
                                            duration={1800 + i * 250}
                                            className="text-5xl font-display font-bold block"
                                            style={{ color: colors[i % 4] }}
                                        />
                                        <div className="text-sm text-gray-600 mt-2">{s.label}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* Missions */}
            <section className="py-16 lg:py-24 bg-white" data-testid="home-missions">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl lg:text-5xl font-display font-bold text-brand-dark">
                            <span className="hand-underline hand-underline-yellow">{missionsTitle.split(" ")[0]}</span>{" "}
                            {missionsTitle.split(" ").slice(1).join(" ")}
                        </h2>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {missions.map((m, i) => {
                            const Icon = m.icon;
                            return (
                                <div key={i} className="bg-brand-bg rounded-3xl p-8 card-lift" data-testid={`home-mission-${i}`}>
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: `${m.color}22` }}>
                                        <Icon size={28} style={{ color: m.color }} />
                                    </div>
                                    <p className="text-gray-700 leading-relaxed text-lg">{m.text}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Activities */}
            <section className="py-16 lg:py-24 bg-brand-bg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <div className="font-hand text-2xl text-brand-turquoise mb-2">{a.lead || "au cœur du quartier"}</div>
                        <h2 className="text-4xl lg:text-5xl font-display font-bold text-brand-dark">
                            <span className="hand-underline">{a.title?.split(" ")[0] || "Nos"}</span>{" "}
                            {a.title?.split(" ").slice(1).join(" ") || "actions"}
                        </h2>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activities.map((act, idx) => (
                            <div key={act.key} className="bg-white rounded-3xl p-8 card-lift" data-testid={`home-activity-${act.key}`}>
                                <ActivityBlob keyName={act.key} color={act.color} idx={idx} size={96} />
                                <h3 className="font-display font-bold text-2xl text-brand-dark mt-4 mb-2" style={{ color: act.color }}>{act.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{act.text}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-10">
                        <Link to="/nos-actions" className="btn-secondary" data-testid="home-actions-link">
                            {tr("common.seeAll")} <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Events + News */}
            {(events.length > 0 || news.length > 0) && (
                <section className="py-16 lg:py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12">
                        {events.length > 0 && (
                            <div>
                                <div className="flex items-baseline justify-between mb-6">
                                    <h2 className="text-3xl font-display font-bold text-brand-dark">
                                        <span className="hand-underline hand-underline-red">{tr("nav.events")}</span>
                                    </h2>
                                    <Link to="/evenements" className="text-brand-turquoise font-display font-semibold text-sm" data-testid="home-events-link">{tr("common.seeAll")} →</Link>
                                </div>
                                <div className="space-y-4">
                                    {events.map((ev) => (
                                        <Link key={ev.id} to="/evenements" className="block bg-brand-bg rounded-2xl p-5 card-lift" data-testid={`home-event-${ev.id}`}>
                                            <div className="flex items-start gap-4">
                                                <div className="bg-brand-turquoise text-white rounded-xl px-3 py-2 text-center min-w-[60px]">
                                                    <Calendar size={18} className="mx-auto mb-1" />
                                                    <div className="text-xs">{new Date(ev.date).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { day: "2-digit", month: "short" })}</div>
                                                </div>
                                                <div>
                                                    <h3 className="font-display font-bold text-brand-dark">{lang === "fr" ? ev.title_fr : ev.title_en}</h3>
                                                    {ev.location && <p className="text-sm text-gray-500">{ev.location}</p>}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                        {news.length > 0 && (
                            <div>
                                <div className="flex items-baseline justify-between mb-6">
                                    <h2 className="text-3xl font-display font-bold text-brand-dark">
                                        <span className="hand-underline hand-underline-yellow">{tr("nav.news")}</span>
                                    </h2>
                                    <Link to="/actualites" className="text-brand-turquoise font-display font-semibold text-sm" data-testid="home-news-link">{tr("common.seeAll")} →</Link>
                                </div>
                                <div className="space-y-4">
                                    {news.map((n) => (
                                        <Link key={n.id} to="/actualites" className="block bg-brand-bg rounded-2xl p-5 card-lift" data-testid={`home-news-${n.id}`}>
                                            <h3 className="font-display font-bold text-brand-dark mb-1">{lang === "fr" ? n.title_fr : n.title_en}</h3>
                                            <p className="text-sm text-gray-600 line-clamp-2">{lang === "fr" ? n.excerpt_fr : n.excerpt_en}</p>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* CTA */}
            <section className="py-16 bg-brand-turquoise relative overflow-hidden">
                <svg className="absolute top-4 left-10 w-24 h-24 text-white/20" viewBox="0 0 100 100" fill="none">
                    <path d="M10 90 L10 70 L30 70 L30 50 L50 50 L50 30 L90 30" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white relative z-10">
                    <h2 className="font-display text-3xl lg:text-5xl font-bold mb-4">Ensemble, faisons grandir le quartier</h2>
                    <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">{tr("footer.tagline")}</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Link to="/devenir-membre" className="bg-white text-brand-turquoise px-6 py-3 rounded-full font-display font-bold hover:bg-brand-yellow hover:text-brand-dark transition-colors" data-testid="cta-member">
                            {tr("nav.member")}
                        </Link>
                        <a href={settings.helloasso_url} target="_blank" rel="noopener noreferrer" className="bg-brand-red text-white px-6 py-3 rounded-full font-display font-bold hover:bg-[#b80e10] transition-colors inline-flex items-center gap-2" data-testid="cta-donate">
                            <Heart size={18} /> {tr("nav.donate")}
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
