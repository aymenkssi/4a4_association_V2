import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { useApp } from "../context/AppContext";
import { Heart, Receipt, ExternalLink } from "lucide-react";
import SEO from "../components/SEO";

const Donate = () => {
    const { lang, tr, settings } = useApp();
    const [page, setPage] = useState(null);
    useEffect(() => { api.get("/pages/donate").then((r) => setPage(r.data)).catch(() => {}); }, []);
    const c = page?.content?.[lang] || {};

    return (
        <div data-testid="donate-page" className="bg-white">
            <SEO title={c.title} />
            <section className="bg-brand-bg py-16">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="font-hand text-2xl text-brand-red mb-2">{c.lead}</div>
                    <h1 className="text-4xl lg:text-6xl font-display font-bold text-brand-dark mb-4">
                        <span className="hand-underline hand-underline-red">{c.title?.split(" ")[0]}</span> {c.title?.split(" ").slice(1).join(" ")}
                    </h1>
                </div>
            </section>

            <section className="py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white border border-gray-100 rounded-3xl p-10 shadow-lg text-center mb-10">
                        <div className="w-20 h-20 rounded-full bg-brand-red flex items-center justify-center mx-auto mb-5">
                            <Heart size={36} className="text-white" />
                        </div>
                        <p className="text-gray-700 leading-relaxed text-lg mb-8">{c.intro}</p>
                        <a href={settings.helloasso_url} target="_blank" rel="noopener noreferrer" className="btn-action text-lg" data-testid="donate-helloasso">
                            <Heart size={20} /> {tr("donate.cta")} <ExternalLink size={16} />
                        </a>
                        <p className="text-sm text-gray-500 mt-3">{tr("donate.secure")}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-brand-bg rounded-3xl p-6">
                            <Receipt className="text-brand-turquoise mb-3" size={28} />
                            <h3 className="font-display font-bold text-lg text-brand-dark mb-2">{lang === "fr" ? "Réduction d'impôt" : "Tax deduction"}</h3>
                            <p className="text-gray-600 text-sm">{c.tax_info}</p>
                        </div>
                        <div className="bg-brand-bg rounded-3xl p-6">
                            <h3 className="font-display font-bold text-lg text-brand-dark mb-3">{lang === "fr" ? "Votre don finance" : "Your donation funds"}</h3>
                            <ul className="space-y-2 text-gray-600 text-sm">
                                {(c.uses || []).map((u, i) => (<li key={i} className="flex gap-2"><span className="text-brand-turquoise">●</span>{u}</li>))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Donate;
