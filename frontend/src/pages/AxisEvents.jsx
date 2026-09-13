import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { mediaUrl } from "../lib/api";
import { useApp } from "../context/AppContext";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import SEO from "../components/SEO";
import { AXIS_COLORS } from "../constants/axes";

const AxisEvents = () => {
    const { index } = useParams();
    const { lang } = useApp();
    const fr = lang === "fr";
    const i = parseInt(index, 10);
    const [axes, setAxes] = useState([]);
    const [events, setEvents] = useState([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        Promise.all([api.get("/pages/actions"), api.get("/events")])
            .then(([p, e]) => {
                setAxes(p.data?.content?.[lang]?.axes || []);
                setEvents(e.data || []);
            })
            .catch(() => {})
            .finally(() => setLoaded(true));
    }, [lang]);

    const axis = axes[i];
    const color = AXIS_COLORS[i % AXIS_COLORS.length];

    const axisEvents = useMemo(() => {
        if (!axis) return [];
        const now = new Date();
        return events
            .filter((e) => e.category === axis.title && new Date(e.date) >= now)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [events, axis]);

    return (
        <div data-testid="axis-events-page" className="bg-white min-h-screen">
            <SEO title={axis ? axis.title : fr ? "Événements par axe" : "Events by axis"} />
            <section className="py-16" style={{ backgroundColor: `${color}12` }}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link to="/nos-actions" className="inline-flex items-center gap-2 text-gray-500 hover:text-brand-dark font-display font-semibold text-sm mb-6" data-testid="axis-back-link">
                        <ArrowLeft size={16} /> {fr ? "Retour aux axes" : "Back to axes"}
                    </Link>
                    <div className="flex items-center gap-4">
                        {!isNaN(i) && (
                            <span className="w-14 h-14 rounded-2xl flex items-center justify-center font-display font-bold text-white text-2xl flex-shrink-0" style={{ backgroundColor: color }}>
                                {i + 1}
                            </span>
                        )}
                        <div>
                            <div className="text-sm font-display font-bold uppercase tracking-wider" style={{ color }}>{fr ? "Événements" : "Events"}</div>
                            <h1 className="text-3xl lg:text-5xl font-display font-bold text-brand-dark" data-testid="axis-title">{axis ? axis.title : (fr ? "Axe introuvable" : "Axis not found")}</h1>
                        </div>
                    </div>
                    {axis?.text && <p className="text-gray-600 max-w-2xl mt-4 text-lg leading-relaxed">{axis.text}</p>}
                </div>
            </section>

            <section className="py-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {!loaded ? null : axisEvents.length === 0 ? (
                        <div className="bg-brand-bg rounded-3xl p-12 text-center border border-gray-100" data-testid="axis-no-events">
                            <p className="text-gray-500 text-lg">{fr ? "Pas d'événement en cours" : "No event currently"}</p>
                            <Link to="/evenements" className="btn-primary mt-6 inline-flex" data-testid="axis-see-all-events">{fr ? "Voir tous les événements" : "See all events"}</Link>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {axisEvents.map((ev) => (
                                <Link
                                    to="/evenements"
                                    key={ev.id}
                                    className="bg-white rounded-3xl overflow-hidden border border-gray-100 card-lift flex flex-col"
                                    style={{ borderTop: `4px solid ${color}` }}
                                    data-testid={`axis-event-${ev.id}`}
                                >
                                    {ev.image_url && <div className="aspect-video overflow-hidden"><img src={mediaUrl(ev.image_url)} alt="" className="w-full h-full object-cover" /></div>}
                                    <div className="p-6 flex flex-col flex-1">
                                        <div className="flex items-center gap-2 font-display font-semibold text-sm mb-2" style={{ color }}>
                                            <Calendar size={16} />
                                            {new Date(ev.date).toLocaleDateString(fr ? "fr-FR" : "en-US", { day: "2-digit", month: "long", year: "numeric" })}
                                        </div>
                                        <h3 className="font-display font-bold text-xl text-brand-dark mb-2">{fr ? ev.title_fr : ev.title_en}</h3>
                                        {ev.location && <div className="flex items-center gap-1 text-gray-500 text-sm mb-2"><MapPin size={14} />{ev.location}</div>}
                                        <p className="text-gray-600 leading-relaxed text-sm flex-1">{fr ? ev.description_fr : ev.description_en}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default AxisEvents;
