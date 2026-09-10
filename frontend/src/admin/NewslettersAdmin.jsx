import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import { Send, Mails, Clock } from "lucide-react";
import RichText from "./RichText";

const NewslettersAdmin = () => {
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [sending, setSending] = useState(false);
    const [history, setHistory] = useState([]);
    const [subCount, setSubCount] = useState(0);

    const load = async () => {
        try {
            const [h, c] = await Promise.all([
                api.get("/newsletters"),
                api.get("/newsletters/subscribers-count"),
            ]);
            setHistory(h.data || []);
            setSubCount(c.data?.count || 0);
        } catch (e) { /* ignore */ }
    };
    useEffect(() => { load(); }, []);

    const isEmpty = (html) => !html || html.replace(/<[^>]*>/g, "").trim() === "";

    const send = async () => {
        if (!subject.trim() || isEmpty(body)) {
            toast.error("Renseignez un sujet et un contenu.");
            return;
        }
        if (!window.confirm(`Envoyer cette newsletter à ${subCount} abonné(s) ?`)) return;
        setSending(true);
        try {
            const r = await api.post("/newsletters", { subject: subject.trim(), body_html: body });
            toast.success(`Newsletter envoyée à ${r.data.recipients_count} abonné(s)`);
            setSubject("");
            setBody("");
            load();
        } catch (e) {
            const msg = e?.response?.data?.detail;
            toast.error(typeof msg === "string" ? msg : "Erreur lors de l'envoi");
        } finally {
            setSending(false);
        }
    };

    return (
        <div data-testid="admin-newsletters">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="font-display font-bold text-3xl text-brand-dark">Newsletters</h1>
                    <p className="text-gray-500 text-sm">Rédigez et envoyez une newsletter aux abonnés</p>
                </div>
                <div className="bg-white rounded-2xl px-4 py-2 border border-gray-100 flex items-center gap-2" data-testid="newsletter-subcount">
                    <Mails size={18} className="text-brand-purple" />
                    <span className="font-display font-bold text-brand-dark">{subCount}</span>
                    <span className="text-xs text-gray-500 ml-1">abonné(s)</span>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 mb-8">
                <label className="block mb-3">
                    <span className="text-xs font-display font-semibold text-gray-600 uppercase tracking-wider">Sujet</span>
                    <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 mt-1" placeholder="Ex : Programme du mois de septembre" data-testid="newsletter-subject" />
                </label>
                <div className="mb-4">
                    <span className="text-xs font-display font-semibold text-gray-600 uppercase tracking-wider">Contenu</span>
                    <div className="mt-1">
                        <RichText value={body} onChange={setBody} placeholder="Rédigez votre newsletter…" testId="newsletter-body" />
                    </div>
                </div>
                <button onClick={send} disabled={sending} className="btn-primary justify-center disabled:opacity-60" data-testid="newsletter-send">
                    <Send size={16} /> {sending ? "Envoi en cours…" : `Envoyer à ${subCount} abonné(s)`}
                </button>
            </div>

            <h2 className="font-display font-bold text-xl text-brand-dark mb-4">Historique des envois</h2>
            <div className="space-y-3">
                {history.map((n) => (
                    <div key={n.id} className="bg-white rounded-2xl p-4 border border-gray-100" data-testid={`newsletter-history-${n.id}`}>
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="font-display font-bold text-brand-dark">{n.subject}</div>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="inline-flex items-center gap-1"><Mails size={13} /> {n.recipients_count} destinataire(s)</span>
                                <span className="inline-flex items-center gap-1"><Clock size={13} /> {new Date(n.created_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</span>
                            </div>
                        </div>
                        <div className="text-sm text-gray-500 mt-2 line-clamp-2" dangerouslySetInnerHTML={{ __html: n.body_html }} />
                    </div>
                ))}
                {history.length === 0 && <p className="text-gray-400 text-sm">Aucune newsletter envoyée pour le moment.</p>}
            </div>
        </div>
    );
};

export default NewslettersAdmin;
