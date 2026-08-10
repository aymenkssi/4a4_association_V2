import React, { useEffect, useState } from "react";
import api, { mediaUrl } from "../lib/api";
import { useApp } from "../context/AppContext";
import { Calendar, MapPin } from "lucide-react";
import SEO from "../components/SEO";

const Events = () => {
    const { lang, tr } = useApp();
    const [items, setItems] = useState([]);
    useEffect(() => { api.get("/events").then((r) => setItems(r.data || [])).catch(() => {}); }, []);

    const now = new Date();
    const upcoming = items.filter((e) => new Date(e.date) >= now);
    const past = items.filter((e) => new Date(e.date) < now).reverse();

    const renderItem = (ev) => (
        <article key={ev.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 card-lift" data-testid={`event-${ev.id}`}>
            {ev.image_url && <div className="aspect-video overflow-hidden"><img src={mediaUrl(ev.image_url)} alt="" className="w-full h-full object-cover" /></div>}
            <div className="p-6">
                <div className="flex items-center gap-2 text-brand-turquoise font-display font-semibold text-sm mb-2">
                    <Calendar size={16} />
                    {new Date(ev.date).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { day: "2-digit", month: "long", year: "numeric" })}
                </div>
                <h3 className="font-display font-bold text-2xl text-brand-dark mb-2">{lang === "fr" ? ev.title_fr : ev.title_en}</h3>
                {ev.location && <div className="flex items-center gap-1 text-gray-500 text-sm mb-2"><MapPin size={14} />{ev.location}</div>}
                <p className="text-gray-600 leading-relaxed">{lang === "fr" ? ev.description_fr : ev.description_en}</p>
            </div>
        </article>
    );

    return (
        <div data-testid="events-page" className="bg-white">
            <SEO title={tr("nav.events")} />
            <section className="bg-brand-bg py-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl lg:text-6xl font-display font-bold text-brand-dark">
                        <span className="hand-underline hand-underline-red">{tr("nav.events")}</span>
                    </h1>
                </div>
            </section>

            <section className="py-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                    <div>
                        <h2 className="text-2xl font-display font-bold text-brand-turquoise mb-6">{lang === "fr" ? "À venir" : "Upcoming"}</h2>
                        {upcoming.length === 0 ? (
                            <p className="text-gray-500">{tr("common.noResults")}</p>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{upcoming.map(renderItem)}</div>
                        )}
                    </div>
                    {past.length > 0 && (
                        <div>
                            <h2 className="text-2xl font-display font-bold text-brand-purple mb-6">{lang === "fr" ? "Événements passés" : "Past events"}</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{past.map(renderItem)}</div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Events;
