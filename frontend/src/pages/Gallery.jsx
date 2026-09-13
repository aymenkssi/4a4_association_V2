import React, { useEffect, useState } from "react";
import api, { mediaUrl } from "../lib/api";
import { useApp } from "../context/AppContext";
import { Play, X } from "lucide-react";
import SEO from "../components/SEO";

const Gallery = () => {
    const { lang, tr } = useApp();
    const [items, setItems] = useState([]);
    const [active, setActive] = useState(null);
    const [filter, setFilter] = useState("all");

    useEffect(() => { api.get("/gallery").then((r) => setItems(r.data || [])).catch(() => {}); }, []);

    const cats = Array.from(new Set(items.map((i) => i.category))).filter(Boolean);
    const filtered = filter === "all" ? items : items.filter((i) => i.category === filter);

    const isVideoEmbed = (url) => /youtube\.com|youtu\.be|vimeo\.com/.test(url || "");

    return (
        <div data-testid="gallery-page" className="bg-white">
            <SEO title={lang === "fr" ? "Galerie" : "Gallery"} />
            <section className="bg-brand-bg py-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl lg:text-6xl font-display font-bold text-brand-dark">
                        <span className="hand-underline">{lang === "fr" ? "Galerie" : "Gallery"}</span>
                    </h1>
                </div>
            </section>

            <section className="py-12">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {cats.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2 mb-10">
                            <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded-full font-display font-medium text-sm ${filter === "all" ? "bg-brand-turquoise text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`} data-testid="gallery-filter-all">{tr("common.allActivities")}</button>
                            {cats.map((c) => (
                                <button key={c} onClick={() => setFilter(c)} className={`px-4 py-2 rounded-full font-display font-medium text-sm capitalize ${filter === c ? "bg-brand-turquoise text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`} data-testid={`gallery-filter-${c}`}>{c}</button>
                            ))}
                        </div>
                    )}

                    {filtered.length === 0 ? (
                        <p className="text-gray-500 text-center">{tr("common.noResults")}</p>
                    ) : (
                        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                            {filtered.map((it) => (
                                <button key={it.id} onClick={() => setActive(it)} className="block w-full break-inside-avoid rounded-2xl overflow-hidden card-lift relative group" data-testid={`gallery-${it.id}`}>
                                    {it.media_type === "video" ? (
                                        <div className="relative bg-brand-dark aspect-video flex items-center justify-center">
                                            {isVideoEmbed(it.media_url) ? (
                                                <div className="absolute inset-0 bg-gradient-to-br from-brand-purple to-brand-turquoise flex items-center justify-center">
                                                    <Play size={48} className="text-white" />
                                                </div>
                                            ) : (
                                                <video src={mediaUrl(it.media_url)} className="w-full h-full object-cover" />
                                            )}
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Play size={56} className="text-white" />
                                            </div>
                                        </div>
                                    ) : (
                                        <img src={mediaUrl(it.media_url)} alt={it.title_fr || ""} className="w-full h-auto" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {active && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setActive(null)}>
                    <button onClick={() => setActive(null)} className="absolute top-4 right-4 text-white" data-testid="gallery-close"><X size={32} /></button>
                    <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
                        {active.media_type === "video" ? (
                            isVideoEmbed(active.media_url) ? (
                                <iframe
                                    title="video"
                                    src={active.media_url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                                    className="w-full aspect-video rounded-2xl"
                                    allowFullScreen
                                />
                            ) : (
                                <video src={mediaUrl(active.media_url)} controls autoPlay className="w-full rounded-2xl" />
                            )
                        ) : (
                            <img src={mediaUrl(active.media_url)} alt="" className="w-full rounded-2xl" />
                        )}
                        {(active.title_fr || active.title_en) && (
                            <div className="text-white text-center mt-4 font-display">{lang === "fr" ? active.title_fr : active.title_en}</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Gallery;
