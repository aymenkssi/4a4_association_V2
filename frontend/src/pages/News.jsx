import React, { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import api, { mediaUrl } from "../lib/api";
import { useApp } from "../context/AppContext";
import SEO from "../components/SEO";

const News = () => {
    const { lang, tr } = useApp();
    const [items, setItems] = useState([]);
    const [active, setActive] = useState(null);
    useEffect(() => { api.get("/news").then((r) => setItems(r.data || [])).catch(() => {}); }, []);

    return (
        <div data-testid="news-page" className="bg-white">
            <SEO title={tr("nav.news")} />
            <section className="bg-brand-bg py-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl lg:text-6xl font-display font-bold text-brand-dark">
                        <span className="hand-underline hand-underline-yellow">{tr("nav.news")}</span>
                    </h1>
                </div>
            </section>

            <section className="py-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {items.length === 0 ? (
                        <p className="text-gray-500 text-center">{tr("common.noResults")}</p>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {items.map((n) => (
                                <article key={n.id} className="bg-white border border-gray-100 rounded-3xl overflow-hidden card-lift cursor-pointer" onClick={() => setActive(n)} data-testid={`news-${n.id}`}>
                                    {n.image_url && <div className="aspect-video overflow-hidden"><img src={mediaUrl(n.image_url)} alt="" className="w-full h-full object-cover" /></div>}
                                    <div className="p-6">
                                        <div className="text-xs text-brand-turquoise font-display font-semibold mb-2 uppercase tracking-wider">
                                            {new Date(n.created_at).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { day: "2-digit", month: "long", year: "numeric" })}
                                        </div>
                                        <h3 className="font-display font-bold text-xl text-brand-dark mb-2">{lang === "fr" ? n.title_fr : n.title_en}</h3>
                                        <p className="text-gray-600 line-clamp-3">{lang === "fr" ? n.excerpt_fr : n.excerpt_en}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {active && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setActive(null)}>
                    <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} data-testid="news-modal">
                        {active.image_url && <img src={mediaUrl(active.image_url)} alt="" className="w-full aspect-video object-cover rounded-t-3xl" />}
                        <div className="p-8">
                            <button onClick={() => setActive(null)} className="float-right text-gray-400 hover:text-brand-red" data-testid="news-modal-close">✕</button>
                            <div className="text-xs text-brand-turquoise font-display font-semibold mb-2 uppercase tracking-wider">
                                {new Date(active.created_at).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { day: "2-digit", month: "long", year: "numeric" })}
                            </div>
                            <h2 className="font-display font-bold text-3xl text-brand-dark mb-4">{lang === "fr" ? active.title_fr : active.title_en}</h2>
                            <div className="prose max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize((lang === "fr" ? active.body_fr || active.excerpt_fr : active.body_en || active.excerpt_en) || "") }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default News;
