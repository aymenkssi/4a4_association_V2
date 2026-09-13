import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { useApp } from "../context/AppContext";
import ActivityBlob from "../components/ActivityBlob";
import SEO from "../components/SEO";

const Actions = () => {
    const { lang } = useApp();
    const [page, setPage] = useState(null);
    useEffect(() => { api.get("/pages/actions").then((r) => setPage(r.data)).catch(() => {}); }, []);
    const c = page?.content?.[lang] || {};
    const activities = c.activities || [];
    const axes = c.axes || [];

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
                    <h2 className="text-3xl lg:text-4xl font-display font-bold text-brand-dark text-center mb-12">
                        <Link to="/evenements" className="hand-underline hand-underline-red hover:text-brand-red transition-colors" data-testid="axes-title-link">{c.axes_title}</Link>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {axes.map((ax, i) => {
                            const colors = ["#39B8B2", "#E6DD08", "#B63CCC", "#D91012"];
                            return (
                                <div key={i} className="bg-white rounded-3xl p-7 flex gap-5 card-lift" data-testid={`axis-${i}`}>
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-display font-bold text-white text-lg flex-shrink-0" style={{ backgroundColor: colors[i % 4] }}>
                                        {i + 1}
                                    </div>
                                    <div>
                                        <h3 className="font-display font-bold text-xl text-brand-dark mb-2">{ax.title}</h3>
                                        <p className="text-gray-600 leading-relaxed">{ax.text}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
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
