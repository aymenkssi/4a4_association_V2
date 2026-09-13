import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { useApp } from "../context/AppContext";
import SEO from "../components/SEO";

const StaticPage = ({ slug }) => {
    const { lang } = useApp();
    const [page, setPage] = useState(null);
    useEffect(() => { api.get(`/pages/${slug}`).then((r) => setPage(r.data)).catch(() => {}); }, [slug]);
    const c = page?.content?.[lang] || {};
    return (
        <div data-testid={`static-${slug}`} className="bg-white">
            <SEO title={c.title} />
            <section className="bg-brand-bg py-12">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl lg:text-5xl font-display font-bold text-brand-dark">{c.title}</h1>
                </div>
            </section>
            <section className="py-12">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-lg">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{c.body}</p>
                </div>
            </section>
        </div>
    );
};

export default StaticPage;
