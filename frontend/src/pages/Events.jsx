import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { mediaUrl } from "../lib/api";
import { useApp } from "../context/AppContext";
import { Calendar, MapPin, Users, Check, Ticket } from "lucide-react";
import { toast } from "sonner";
import SEO from "../components/SEO";

const Events = () => {
    const { lang, tr, user } = useApp();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [myRegs, setMyRegs] = useState([]);
    const [busy, setBusy] = useState(null);
    const fr = lang === "fr";

    const loadEvents = useCallback(() => {
        api.get("/events").then((r) => setItems(r.data || [])).catch(() => {});
    }, []);

    const loadMyRegs = useCallback(() => {
        if (!user) { setMyRegs([]); return; }
        api.get("/events/my-registrations").then((r) => setMyRegs(r.data || [])).catch(() => {});
    }, [user]);

    useEffect(() => { loadEvents(); }, [loadEvents]);
    useEffect(() => { loadMyRegs(); }, [loadMyRegs]);

    const doRegister = async (ev) => {
        if (!user) {
            toast.info(fr ? "Connectez-vous pour vous inscrire." : "Please log in to register.");
            navigate("/connexion", { state: { from: "/evenements" } });
            return;
        }
        setBusy(ev.id);
        try {
            await api.post(`/events/${ev.id}/register`);
            toast.success(fr ? "Inscription confirmée ! Un email vous a été envoyé." : "Registration confirmed! An email was sent to you.");
            setMyRegs((m) => [...m, ev.id]);
            loadEvents();
        } catch (err) {
            const msg = err?.response?.data?.detail;
            toast.error(typeof msg === "string" ? msg : fr ? "Erreur lors de l'inscription." : "Registration failed.");
        } finally {
            setBusy(null);
        }
    };

    const doUnregister = async (ev) => {
        setBusy(ev.id);
        try {
            await api.delete(`/events/${ev.id}/register`);
            toast.success(fr ? "Désinscription effectuée." : "Unregistered.");
            setMyRegs((m) => m.filter((id) => id !== ev.id));
            loadEvents();
        } catch (err) {
            toast.error(fr ? "Erreur." : "Error.");
        } finally {
            setBusy(null);
        }
    };

    const now = new Date();
    const upcoming = items.filter((e) => new Date(e.date) >= now);
    const past = items.filter((e) => new Date(e.date) < now).reverse();

    const renderRegistration = (ev) => {
        const registered = myRegs.includes(ev.id);
        const full = ev.spots_left !== null && ev.spots_left !== undefined && ev.spots_left <= 0;
        return (
            <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between gap-2 mb-3 text-sm">
                    {ev.spots_left === null || ev.spots_left === undefined ? (
                        <span className="text-gray-400 flex items-center gap-1"><Users size={14} /> {ev.registered_count || 0} {fr ? "inscrit(s)" : "registered"}</span>
                    ) : (
                        <span className={`flex items-center gap-1 font-semibold ${full ? "text-brand-red" : "text-brand-turquoise"}`} data-testid={`event-spots-${ev.id}`}>
                            <Users size={14} /> {full ? (fr ? "Complet" : "Full") : `${ev.spots_left} ${fr ? "places restantes" : "spots left"}`}
                        </span>
                    )}
                </div>
                {registered ? (
                    <div className="flex items-center gap-2">
                        <span className="flex-1 inline-flex items-center justify-center gap-1.5 bg-brand-turquoise/10 text-brand-turquoise font-display font-semibold py-2.5 rounded-full text-sm" data-testid={`event-registered-${ev.id}`}>
                            <Check size={16} /> {fr ? "Vous êtes inscrit(e)" : "You're registered"}
                        </span>
                        <button onClick={() => doUnregister(ev)} disabled={busy === ev.id} className="text-xs text-gray-500 hover:text-brand-red px-3 py-2.5 rounded-full border border-gray-200 disabled:opacity-50" data-testid={`event-unregister-${ev.id}`}>
                            {fr ? "Se désinscrire" : "Cancel"}
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => doRegister(ev)}
                        disabled={busy === ev.id || full}
                        className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        data-testid={`event-register-${ev.id}`}
                    >
                        <Ticket size={16} /> {busy === ev.id ? "..." : full ? (fr ? "Complet" : "Full") : fr ? "S'inscrire" : "Register"}
                    </button>
                )}
                {!user && !registered && !full && (
                    <p className="text-xs text-gray-400 mt-2 text-center" data-testid={`event-login-hint-${ev.id}`}>{fr ? "Un compte est nécessaire pour s'inscrire." : "An account is required to register."}</p>
                )}
            </div>
        );
    };

    const renderItem = (ev, isPast) => (
        <article key={ev.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 card-lift flex flex-col" data-testid={`event-${ev.id}`}>
            {ev.image_url && <div className="aspect-video overflow-hidden"><img src={mediaUrl(ev.image_url)} alt="" className="w-full h-full object-cover" /></div>}
            <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 text-brand-turquoise font-display font-semibold text-sm mb-2">
                    <Calendar size={16} />
                    {new Date(ev.date).toLocaleDateString(fr ? "fr-FR" : "en-US", { day: "2-digit", month: "long", year: "numeric" })}
                </div>
                <h3 className="font-display font-bold text-2xl text-brand-dark mb-2">{fr ? ev.title_fr : ev.title_en}</h3>
                {ev.location && <div className="flex items-center gap-1 text-gray-500 text-sm mb-2"><MapPin size={14} />{ev.location}</div>}
                <p className="text-gray-600 leading-relaxed flex-1">{fr ? ev.description_fr : ev.description_en}</p>
                {!isPast && renderRegistration(ev)}
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
                    {!user && (
                        <p className="text-gray-600 mt-4">{fr ? "Créez un compte pour vous inscrire à nos événements." : "Create an account to register for our events."}</p>
                    )}
                </div>
            </section>

            <section className="py-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                    <div>
                        <h2 className="text-2xl font-display font-bold text-brand-turquoise mb-6">{fr ? "À venir" : "Upcoming"}</h2>
                        {upcoming.length === 0 ? (
                            <p className="text-gray-500">{tr("common.noResults")}</p>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{upcoming.map((e) => renderItem(e, false))}</div>
                        )}
                    </div>
                    {past.length > 0 && (
                        <div>
                            <h2 className="text-2xl font-display font-bold text-brand-purple mb-6">{fr ? "Événements passés" : "Past events"}</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{past.map((e) => renderItem(e, true))}</div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Events;
