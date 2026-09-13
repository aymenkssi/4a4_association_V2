import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { useApp } from "../context/AppContext";
import { Heart, BookOpen, Users, Sprout } from "lucide-react";
import SEO from "../components/SEO";
import ActivityBlob from "../components/ActivityBlob";

const VALUE_ICONS = [BookOpen, Heart, Users, Sprout];

const About = () => {
    const { lang } = useApp();
    const [page, setPage] = useState(null);

    useEffect(() => {
        api.get("/pages/about").then((r) => setPage(r.data)).catch(() => {});
    }, []);

    const c = page?.content?.[lang] || {};

    return (
        <div data-testid="about-page" className="bg-white">
            <SEO title={c.title} />
            <section className="bg-brand-bg py-16 lg:py-24">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="font-hand text-2xl text-brand-purple mb-2">{c.lead}</div>
                    <h1 className="text-4xl lg:text-6xl font-display font-bold text-brand-dark mb-6">
                        <span className="hand-underline">{c.title?.split(" ")[0]}</span> {c.title?.split(" ").slice(1).join(" ")}
                    </h1>
                </div>
            </section>

            <section className="py-16">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-10">
                        <div>
                            <h2 className="text-3xl font-display font-bold text-brand-turquoise mb-4">{c.history_title}</h2>
                            <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">{c.history}</p>
                        </div>
                        <div>
                            <h2 className="text-3xl font-display font-bold text-brand-red mb-4">{c.mission_title}</h2>
                            <p className="text-gray-700 leading-relaxed text-lg">{c.mission}</p>
                        </div>
                    </div>
                    <aside className="bg-brand-bg rounded-3xl p-8">
                        <h3 className="font-display font-bold text-brand-dark mb-4">{c.team_title}</h3>
                        <ul className="space-y-3">
                            {(c.team || []).map((m, i) => (
                                <li key={i} className="flex items-center gap-3" data-testid={`team-${i}`}>
                                    <div className="w-10 h-10 rounded-full bg-brand-purple flex items-center justify-center text-white font-display font-bold">
                                        {m.name?.[0]}
                                    </div>
                                    <div>
                                        <div className="font-display font-semibold text-brand-dark">{m.name}</div>
                                        <div className="text-xs text-gray-500">{m.role}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </aside>
                </div>
            </section>

            <section className="py-16 bg-brand-bg">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl lg:text-4xl font-display font-bold text-brand-dark mb-10 text-center">
                        <span className="hand-underline hand-underline-yellow">{c.values_title}</span>
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-6">
                        {(c.values || []).map((v, i) => {
                            const Icon = VALUE_ICONS[i % VALUE_ICONS.length];
                            const colors = ["#39B8B2", "#E6DD08", "#B63CCC", "#D91012"];
                            return (
                                <div key={i} className="bg-white rounded-3xl p-6 card-lift" data-testid={`value-${i}`}>
                                    <div className="w-14 h-14 blob flex items-center justify-center mb-3" style={{ backgroundColor: colors[i % 4] }}>
                                        <Icon size={24} className="text-white" />
                                    </div>
                                    <h3 className="font-display font-bold text-xl text-brand-dark mb-2">{v.title}</h3>
                                    <p className="text-gray-600">{v.text}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {(c.core_values || []).length > 0 && (
                <section className="py-16 bg-white">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <div className="font-hand text-2xl text-brand-turquoise mb-2">Ce qui nous anime au quotidien</div>
                            <h2 className="text-3xl lg:text-4xl font-display font-bold text-brand-dark">
                                <span className="hand-underline">{c.core_values_title}</span>
                            </h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                            {c.core_values.map((v, i) => (
                                <div key={v.key || i} className="text-center" data-testid={`core-value-${v.key || i}`}>
                                    <div className="flex justify-center mb-3">
                                        <ActivityBlob keyName={v.key} color={v.color} idx={i} size={90} />
                                    </div>
                                    <h3 className="font-display font-bold text-base mb-1" style={{ color: v.color }}>{v.title}</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">{v.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default About;
