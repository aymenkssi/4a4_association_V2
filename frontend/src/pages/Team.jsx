import React, { useEffect, useState } from "react";
import api, { mediaUrl } from "../lib/api";
import { useApp } from "../context/AppContext";
import { UserRound, X } from "lucide-react";
import SEO from "../components/SEO";

const ImageLightbox = ({ src, alt, onClose }) => (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in-0"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
    >
        <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/40 rounded-full p-2"
            aria-label="Fermer"
        >
            <X size={24} />
        </button>
        <img
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
        />
    </div>
);

const MemberCard = ({ m, onImageClick }) => {
    if (m.display_mode === "image" && m.detail_image_url) {
        return (
            <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 card-lift" data-testid={`team-member-${m.id}`}>
                <img
                    src={mediaUrl(m.detail_image_url)}
                    alt={m.name}
                    className="w-full h-auto object-contain cursor-zoom-in transition-transform duration-200 hover:scale-105"
                    onClick={() => onImageClick(mediaUrl(m.detail_image_url), m.name)}
                />
            </div>
        );
    }
    return (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 card-lift text-center" data-testid={`team-member-${m.id}`}>
            <div className="w-28 h-28 mx-auto rounded-full overflow-hidden bg-brand-bg flex items-center justify-center mb-4">
                {m.photo_url ? (
                    <img
                        src={mediaUrl(m.photo_url)}
                        alt={m.name}
                        className="w-full h-full object-cover cursor-zoom-in transition-transform duration-200 hover:scale-105"
                        onClick={() => onImageClick(mediaUrl(m.photo_url), m.name)}
                    />
                ) : (
                    <UserRound className="text-gray-300" size={48} />
                )}
            </div>
            <h3 className="font-display font-bold text-xl text-brand-dark">{m.name}</h3>
            {m.role && <div className="text-brand-turquoise font-display font-semibold text-sm mb-2">{m.role}</div>}
            {m.bio && <p className="text-gray-600 leading-relaxed text-sm">{m.bio}</p>}
        </div>
    );
};

const Team = () => {
    const { lang } = useApp();
    const fr = lang === "fr";
    const [items, setItems] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [lightbox, setLightbox] = useState(null); // { src, alt } | null

    useEffect(() => {
        api.get("/team").then((r) => setItems(r.data || [])).catch(() => {}).finally(() => setLoaded(true));
    }, []);

    const staff = items.filter((m) => m.nature === "staff");
    const intervenants = items.filter((m) => m.nature === "intervenant");

    const openLightbox = (src, alt) => setLightbox({ src, alt });
    const closeLightbox = () => setLightbox(null);

    const section = (title, list) =>
        list.length > 0 && (
            <div className="mb-16">
                <h2 className="text-2xl lg:text-3xl font-display font-bold text-brand-dark mb-8">
                    <span className="hand-underline">{title}</span>
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {list.map((m) => <MemberCard key={m.id} m={m} onImageClick={openLightbox} />)}
                </div>
            </div>
        );

    return (
        <div data-testid="team-page" className="bg-white">
            <SEO title={fr ? "Équipe" : "Team"} />
            <section className="bg-brand-bg py-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl lg:text-6xl font-display font-bold text-brand-dark">
                        <span className="hand-underline hand-underline-red">{fr ? "Notre équipe" : "Our team"}</span>
                    </h1>
                    <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-lg">
                        {fr ? "Le staff et les intervenants qui font vivre l'association au quotidien." : "The staff and contributors who bring the association to life every day."}
                    </p>
                </div>
            </section>

            <section className="py-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {loaded && items.length === 0 ? (
                        <p className="text-gray-500 text-center" data-testid="team-empty">{fr ? "L'équipe sera bientôt présentée ici." : "The team will be presented here soon."}</p>
                    ) : (
                        <>
                            {section(fr ? "Staff" : "Staff", staff)}
                            {section(fr ? "Intervenants" : "Contributors", intervenants)}
                        </>
                    )}
                </div>
            </section>

            {lightbox && <ImageLightbox src={lightbox.src} alt={lightbox.alt} onClose={closeLightbox} />}
        </div>
    );
};

export default Team;
