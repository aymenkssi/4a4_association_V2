import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api, { mediaUrl } from "../lib/api";
import { useApp } from "../context/AppContext";
import ActivityBlob from "../components/ActivityBlob";
import SEO from "../components/SEO";
import { AXIS_COLORS } from "../constants/axes";
import { Calendar, MapPin } from "lucide-react";

const Actions = () => {
    const { lang } = useApp();
    const [page, setPage] = useState(null);
    const [events, setEvents] = useState([]);
    const [selectedAxis, setSelectedAxis] = useState(null);
    const fr = lang === "fr";
    useEffect(() => { api.get("/pages/actions").then((r) => setPage(r.data)).catch(() => {}); }, []);
    useEffect(() => { api.get("/events").then((r) => setEvents(r.data || [])).catch(() => {}); }, []);
    const c = page?.content?.[lang] || {};
    const activities = c.activities || [];
    const axes = c.axes || [];

    const axisEvents = useMemo(() => {
        if (!selectedAxis) return [];
        const now = new Date();
        return events
            .filter((e) => e.category === selectedAxis.title && new Date(e.date) >= now)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [events, selectedAxis]);

    return (
        <div data-testid="actions-page" className="bg-white">
            <SEO title={c.title} />
            <section className="bg-brand-bg py-16 lg:py-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="font-hand text-2xl text-brand-turquoise mb-2">{c.lead}</div>
                    <h1 className="text-4xl lg:text-6xl font-display font-bold text-brand-dark mb-4">
                        <span className="hand-underline">{c.title?.split(" ")[0]}</span> {c.title?.split(" ").slice(1).join(" ")}
                    </h1>
                    <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">{c.intro}</p>
                </div>
            </section>

            <section className="py-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {activities.map((a, i) => (
                        <div key={a.key} className="bg-white border border-gray-100 rounded-3xl p-8 card-lift text-center" data-testid={`activity-${a.key}`}>
                            <div className="flex justify-center mb-4">
                                <ActivityBlob keyName={a.key} color={a.color} idx={i} size={130} />
                            </div>
                            <h3 className="font-display font-bold text-2xl mb-2" style={{ color: a.color }}>{a.title}</h3>
                            <p className="text-gray-600 leading-relaxed">{a.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="py-16 bg-brand-bg">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl lg:text-4xl font-display font-bold text-brand-dark text-center mb-3">
                        <Link to="/evenements" className="hand-underline hand-underline-red hover:text-brand-red transition-colors" data-testid="axes-title-link">{c.axes_title}</Link>
                    </h2>
                    <p className="text-center text-gray-500 mb-12">{fr ? "Cliquez sur un axe pour voir ses événements à venir." : "Click an axis to see its upcoming events."}</p>
                    <div className="grid md:grid-cols-2 gap-6">
                        {axes.map((ax, i) => {
                            const color = AXIS_COLORS[i % AXIS_COLORS.length];
                            const active = selectedAxis?.title === ax.title;
                            return (
                                <button
                                    type="button"
                                    key={i}
                                    onClick={() => setSelectedAxis(active ? null : { ...ax, color })}
                                    className={`bg-white rounded-3xl p-7 flex gap-5 card-lift text-left w-full transition-shadow ${active ? "ring-2 shadow-lg" : "hover:shadow-md"}`}
                                    style={active ? { "--tw-ring-color": color } : undefined}
                                    aria-pressed={active}
                                    data-testid={`axis-${i}`}
                                >
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-display font-bold text-white text-lg flex-shrink-0" style={{ backgroundColor: color }}>
                                        {i + 1}
                                    </div>
                                    <div>
                                        <h3 className="font-display font-bold text-xl text-brand-dark mb-2">{ax.title}</h3>
                                        <p className="text-gray-600 leading-relaxed">{ax.text}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {selectedAxis && (
                        <div className="mt-10" data-testid="axis-events-panel">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: selectedAxis.color }} />
                                <h3 className="font-display font-bold text-2xl text-brand-dark">
                                    {fr ? "Événements — " : "Events — "}{selectedAxis.title}
                                </h3>
                            </div>
                            {axisEvents.length === 0 ? (
                                <div className="bg-white rounded-3xl p-10 text-center border border-gray-100" data-testid="axis-no-events">
                                    <p className="text-gray-500 text-lg">{fr ? "Pas d'événement en cours" : "No event currently"}</p>
                                </div>
                            ) : (
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {axisEvents.map((ev) => (
                                        <Link
                                            to="/evenements"
                                            key={ev.id}
                                            className="bg-white rounded-3xl overflow-hidden border border-gray-100 card-lift flex flex-col"
                                            style={{ borderTop: `4px solid ${selectedAxis.color}` }}
                                            data-testid={`axis-event-${ev.id}`}
                                        >
                                            {ev.image_url && <div className="aspect-video overflow-hidden"><img src={mediaUrl(ev.image_url)} alt="" className="w-full h-full object-cover" /></div>}
                                            <div className="p-6 flex flex-col flex-1">
                                                <div className="flex items-center gap-2 font-display font-semibold text-sm mb-2" style={{ color: selectedAxis.color }}>
                                                    <Calendar size={16} />
                                                    {new Date(ev.date).toLocaleDateString(fr ? "fr-FR" : "en-US", { day: "2-digit", month: "long", year: "numeric" })}
                                                </div>
                                                <h4 className="font-display font-bold text-xl text-brand-dark mb-2">{fr ? ev.title_fr : ev.title_en}</h4>
                                                {ev.location && <div className="flex items-center gap-1 text-gray-500 text-sm mb-2"><MapPin size={14} />{ev.location}</div>}
                                                <p className="text-gray-600 leading-relaxed text-sm flex-1">{fr ? ev.description_fr : ev.description_en}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {(c.neighborhood_events || []).length > 0 && (
                <section className="py-16 bg-white">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <div className="font-hand text-2xl text-brand-purple mb-2">{c.neighborhood_subtitle}</div>
                            <h2 className="text-3xl lg:text-4xl font-display font-bold text-brand-dark">
                                <span className="hand-underline hand-underline-yellow">{c.neighborhood_title}</span>
                            </h2>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {c.neighborhood_events.map((ev, i) => (
                                <div key={ev.key || i} className="bg-brand-bg rounded-3xl p-8 card-lift text-center" data-testid={`neighborhood-event-${ev.key || i}`}>
                                    <div className="flex justify-center mb-4">
                                        <ActivityBlob keyName={ev.key} color={ev.color} idx={i} size={110} />
                                    </div>
                                    <h3 className="font-display font-bold text-xl mb-2" style={{ color: ev.color }}>{ev.title}</h3>
                                    <p className="text-gray-600 leading-relaxed text-sm">{ev.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default Actions;
