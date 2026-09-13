import React, { useEffect, useMemo, useState } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import { Trash2, Mail, Phone, Check, X, Clock } from "lucide-react";

const STATUS_META = {
    pending: { label: "En attente", color: "#F59E0B" },
    approved: { label: "Validé", color: "#39B8B2" },
    rejected: { label: "Refusé", color: "#D91012" },
};

const MembersAdmin = () => {
    const [items, setItems] = useState([]);
    const [filter, setFilter] = useState("all");
    const [busy, setBusy] = useState(null);

    const load = async () => { try { const r = await api.get("/members"); setItems(r.data || []); } catch (e) {} };
    useEffect(() => { load(); }, []);

    const remove = async (id) => {
        if (!window.confirm("Confirmer la suppression ?")) return;
        await api.delete(`/members/${id}`);
        load();
    };

    const setStatus = async (m, status) => {
        setBusy(m.id);
        try {
            await api.patch(`/members/${m.id}/status`, { status });
            setItems((list) => list.map((x) => (x.id === m.id ? { ...x, status } : x)));
            toast.success(status === "approved" ? "Adhésion validée — email envoyé" : status === "rejected" ? "Demande refusée — email envoyé" : "Statut mis à jour");
        } catch (e) {
            toast.error("Erreur");
        } finally {
            setBusy(null);
        }
    };

    const counts = useMemo(() => ({
        all: items.length,
        pending: items.filter((m) => (m.status || "pending") === "pending").length,
        approved: items.filter((m) => m.status === "approved").length,
        rejected: items.filter((m) => m.status === "rejected").length,
    }), [items]);

    const shown = filter === "all" ? items : items.filter((m) => (m.status || "pending") === filter);

    return (
        <div data-testid="admin-members">
            <h1 className="font-display font-bold text-3xl text-brand-dark mb-1">Membres</h1>
            <p className="text-gray-500 text-sm mb-5">Validez ou refusez les demandes d'adhésion — l'adhérent est notifié par email.</p>

            <div className="flex gap-2 mb-6 flex-wrap">
                {[
                    { key: "all", label: `Toutes (${counts.all})` },
                    { key: "pending", label: `En attente (${counts.pending})`, color: "#F59E0B" },
                    { key: "approved", label: `Validées (${counts.approved})`, color: "#39B8B2" },
                    { key: "rejected", label: `Refusées (${counts.rejected})`, color: "#D91012" },
                ].map((f) => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`px-3 py-1.5 rounded-full text-sm font-display font-semibold transition-colors ${filter === f.key ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                        style={filter === f.key ? { backgroundColor: f.color || "#2a2a2a" } : {}}
                        data-testid={`members-filter-${f.key}`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <div className="grid gap-3">
                {shown.map((m) => {
                    const status = m.status || "pending";
                    const meta = STATUS_META[status] || STATUS_META.pending;
                    return (
                        <div key={m.id} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-start justify-between gap-4" data-testid={`member-${m.id}`}>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-display font-bold text-brand-dark">{m.first_name} {m.last_name}</span>
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${meta.color}22`, color: meta.color }} data-testid={`member-status-${m.id}`}>{meta.label}</span>
                                </div>
                                <div className="text-sm text-gray-500 flex flex-wrap gap-3 mt-1">
                                    <span className="inline-flex items-center gap-1"><Mail size={14} /> {m.email}</span>
                                    {m.phone && <span className="inline-flex items-center gap-1"><Phone size={14} /> {m.phone}</span>}
                                </div>
                                {m.address && <div className="text-xs text-gray-500 mt-1">{m.address}</div>}
                                {m.interests?.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{m.interests.map((i) => <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-brand-turquoise/10 text-brand-turquoise">{i}</span>)}</div>}
                                {m.message && <p className="text-sm text-gray-600 mt-2 italic">"{m.message}"</p>}
                                <div className="text-xs text-gray-400 mt-2">{new Date(m.created_at).toLocaleString("fr-FR")}</div>
                            </div>
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                <div className="flex gap-2">
                                    {status !== "approved" && (
                                        <button onClick={() => setStatus(m, "approved")} disabled={busy === m.id} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand-turquoise text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50" data-testid={`approve-member-${m.id}`}>
                                            <Check size={14} /> Valider
                                        </button>
                                    )}
                                    {status !== "rejected" && (
                                        <button onClick={() => setStatus(m, "rejected")} disabled={busy === m.id} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-brand-red text-brand-red text-xs font-semibold hover:bg-red-50 disabled:opacity-50" data-testid={`reject-member-${m.id}`}>
                                            <X size={14} /> Refuser
                                        </button>
                                    )}
                                    {status !== "pending" && (
                                        <button onClick={() => setStatus(m, "pending")} disabled={busy === m.id} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50" data-testid={`reset-member-${m.id}`}>
                                            <Clock size={14} /> En attente
                                        </button>
                                    )}
                                </div>
                                <button onClick={() => remove(m.id)} className="p-2 text-brand-red hover:bg-red-50 rounded-lg" data-testid={`delete-member-${m.id}`}><Trash2 size={16} /></button>
                            </div>
                        </div>
                    );
                })}
                {shown.length === 0 && <p className="text-gray-500">Aucune adhésion</p>}
            </div>
        </div>
    );
};

export default MembersAdmin;
