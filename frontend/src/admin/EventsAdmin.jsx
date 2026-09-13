import React, { useEffect, useMemo, useState } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import { Plus, Trash2, Edit, X, Save, CalendarClock, CheckCircle2, Clock, CalendarDays, FileText, Users } from "lucide-react";
import MediaPicker from "./MediaPicker";

const empty = { title_fr: "", title_en: "", description_fr: "", description_en: "", date: "", location: "", image_url: "", capacity: 0, published: true };

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

const relTime = (dateStr) => {
    const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
    const day = Math.round((d - startOfToday()) / 86400000);
    if (day === 0) return "aujourd'hui";
    if (day === 1) return "demain";
    if (day === -1) return "hier";
    if (day > 0) return `dans ${day} jours`;
    return `il y a ${Math.abs(day)} jours`;
};

const EventsAdmin = () => {
    const [items, setItems] = useState([]);
    const [editing, setEditing] = useState(null);
    const [participants, setParticipants] = useState(null);

    const viewParticipants = async (ev) => {
        try {
            const r = await api.get(`/events/${ev.id}/registrations`);
            setParticipants({ event: ev, list: r.data || [] });
        } catch (e) { toast.error("Erreur de chargement des participants"); }
    };

    const load = async () => {
        try {
            const r = await api.get("/events?only_published=false");
            setItems(r.data || []);
        } catch (e) {}
    };
    useEffect(() => { load(); }, []);

    const planning = useMemo(() => {
        const today = startOfToday();
        const sorted = [...items].sort((a, b) => new Date(a.date) - new Date(b.date));
        const upcoming = sorted.filter((e) => new Date(e.date) >= today);
        const past = sorted.filter((e) => new Date(e.date) < today);
        const drafts = items.filter((e) => !e.published);
        const timeline = [...upcoming, ...[...past].reverse()];
        return { upcoming, past, drafts, timeline, next: upcoming.find((e) => e.published) || upcoming[0] };
    }, [items]);

    const statusOf = (dateStr) => {
        const day = Math.round((new Date(dateStr) - startOfToday()) / 86400000);
        if (day === 0) return { label: "Aujourd'hui", color: "#E6DD08", dot: "#E6DD08" };
        if (day > 0) return { label: "À venir", color: "#39B8B2", dot: "#39B8B2" };
        return { label: "Passé", color: "#9CA3AF", dot: "#9CA3AF" };
    };

    const save = async (e) => {
        e.preventDefault();
        try {
            if (editing.id) await api.put(`/events/${editing.id}`, editing);
            else await api.post("/events", editing);
            toast.success("Enregistré");
            setEditing(null);
            load();
        } catch (e) { toast.error("Erreur"); }
    };

    const remove = async (id) => {
        if (!window.confirm("Confirmer la suppression ?")) return;
        await api.delete(`/events/${id}`);
        load();
    };

    return (
        <div data-testid="admin-events">
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-display font-bold text-3xl text-brand-dark">Événements</h1>
                <button onClick={() => setEditing({ ...empty })} className="btn-primary" data-testid="admin-events-new"><Plus size={16} /> Nouveau</button>
            </div>

            {/* Planning de suivi (auto) */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 mb-8" data-testid="events-planning">
                <div className="flex items-center gap-2 mb-1">
                    <CalendarClock size={20} className="text-brand-purple" />
                    <h2 className="font-display font-bold text-xl text-brand-dark">Planning de suivi</h2>
                </div>
                <p className="text-xs text-gray-400 mb-5">Mis à jour automatiquement selon les événements créés</p>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    {[
                        { key: "total", label: "Total", value: items.length, Icon: CalendarDays, color: "#B63CCC" },
                        { key: "upcoming", label: "À venir", value: planning.upcoming.length, Icon: Clock, color: "#39B8B2" },
                        { key: "past", label: "Passés", value: planning.past.length, Icon: CheckCircle2, color: "#9CA3AF" },
                        { key: "drafts", label: "Brouillons", value: planning.drafts.length, Icon: FileText, color: "#F59E0B" },
                    ].map(({ key, label, value, Icon, color }) => (
                        <div key={key} className="rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor: `${color}12` }} data-testid={`planning-stat-${key}`}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}22` }}>
                                <Icon size={20} style={{ color }} />
                            </div>
                            <div>
                                <div className="font-display font-bold text-2xl text-brand-dark leading-none">{value}</div>
                                <div className="text-xs text-gray-500 mt-1">{label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {planning.next && (
                    <div className="rounded-2xl p-4 mb-6 flex items-center justify-between bg-brand-turquoise/10 border border-brand-turquoise/20" data-testid="planning-next">
                        <div>
                            <div className="text-xs font-display font-bold text-brand-turquoise uppercase tracking-wider mb-1">Prochain événement</div>
                            <div className="font-display font-bold text-brand-dark">{planning.next.title_fr}</div>
                            <div className="text-sm text-gray-500">{new Date(planning.next.date).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })} · {planning.next.location}</div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                            <div className="font-display font-bold text-2xl text-brand-turquoise capitalize">{relTime(planning.next.date)}</div>
                        </div>
                    </div>
                )}

                {planning.timeline.length > 0 ? (
                    <div className="relative pl-6">
                        <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-gray-100" />
                        <div className="space-y-4">
                            {planning.timeline.map((ev) => {
                                const st = statusOf(ev.date);
                                return (
                                    <div key={ev.id} className="relative" data-testid={`planning-item-${ev.id}`}>
                                        <span className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow" style={{ backgroundColor: st.dot }} />
                                        <div className="flex items-center justify-between gap-3 flex-wrap">
                                            <div>
                                                <div className="font-display font-semibold text-brand-dark flex items-center gap-2">
                                                    {ev.title_fr}
                                                    {!ev.published && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Brouillon</span>}
                                                </div>
                                                <div className="text-sm text-gray-500">{new Date(ev.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}{ev.location ? ` · ${ev.location}` : ""}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-gray-400 capitalize">{relTime(ev.date)}</span>
                                                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${st.color}22`, color: st.color }}>{st.label}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-400 text-sm">Aucun événement pour le moment. Créez-en un pour alimenter le planning.</p>
                )}
            </div>

            <div className="grid gap-3">
                {items.map((ev) => (
                    <div key={ev.id} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between" data-testid={`admin-event-${ev.id}`}>
                        <div>
                            <div className="font-display font-bold text-brand-dark">{ev.title_fr}</div>
                            <div className="text-sm text-gray-500">{new Date(ev.date).toLocaleDateString("fr-FR")} · {ev.location}</div>
                            <div className="text-xs text-gray-400">{ev.published ? "Publié" : "Brouillon"} · {ev.registered_count || 0} inscrit(s){ev.capacity ? ` / ${ev.capacity} places` : " (illimité)"}</div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => viewParticipants(ev)} className="p-2 text-brand-purple hover:bg-purple-50 rounded-lg inline-flex items-center gap-1 text-sm" data-testid={`participants-event-${ev.id}`} title="Participants"><Users size={16} /> {ev.registered_count || 0}</button>
                            <button onClick={() => setEditing(ev)} className="p-2 text-brand-turquoise hover:bg-gray-100 rounded-lg" data-testid={`edit-event-${ev.id}`}><Edit size={16} /></button>
                            <button onClick={() => remove(ev.id)} className="p-2 text-brand-red hover:bg-red-50 rounded-lg" data-testid={`delete-event-${ev.id}`}><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
                {items.length === 0 && <p className="text-gray-500">Aucun événement</p>}
            </div>

            {editing && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setEditing(null)}>
                    <form onClick={(e) => e.stopPropagation()} onSubmit={save} className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-3" data-testid="admin-event-form">
                        <div className="flex items-center justify-between">
                            <h2 className="font-display font-bold text-xl">{editing.id ? "Modifier" : "Nouvel"} événement</h2>
                            <button type="button" onClick={() => setEditing(null)}><X /></button>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <label className="block"><span className="text-xs font-semibold">Titre FR</span><input required value={editing.title_fr} onChange={(e) => setEditing({ ...editing, title_fr: e.target.value })} className="w-full border rounded-lg px-3 py-2" data-testid="event-title-fr" /></label>
                            <label className="block"><span className="text-xs font-semibold">Titre EN</span><input required value={editing.title_en} onChange={(e) => setEditing({ ...editing, title_en: e.target.value })} className="w-full border rounded-lg px-3 py-2" data-testid="event-title-en" /></label>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <label className="block"><span className="text-xs font-semibold">Date</span><input type="datetime-local" required value={editing.date?.slice(0, 16)} onChange={(e) => setEditing({ ...editing, date: e.target.value })} className="w-full border rounded-lg px-3 py-2" data-testid="event-date" /></label>
                            <label className="block"><span className="text-xs font-semibold">Lieu</span><input value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} className="w-full border rounded-lg px-3 py-2" data-testid="event-location" /></label>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <label className="block"><span className="text-xs font-semibold">Places disponibles (0 = illimité)</span><input type="number" min="0" value={editing.capacity ?? 0} onChange={(e) => setEditing({ ...editing, capacity: parseInt(e.target.value, 10) || 0 })} className="w-full border rounded-lg px-3 py-2" data-testid="event-capacity" /></label>
                        </div>
                        <label className="block"><span className="text-xs font-semibold">Description FR</span><textarea rows={3} value={editing.description_fr} onChange={(e) => setEditing({ ...editing, description_fr: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></label>
                        <label className="block"><span className="text-xs font-semibold">Description EN</span><textarea rows={3} value={editing.description_en} onChange={(e) => setEditing({ ...editing, description_en: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></label>
                        <div>
                            <span className="text-xs font-semibold">Image</span>
                            <MediaPicker value={editing.image_url} onChange={(v) => setEditing({ ...editing, image_url: v })} testId="event-image" />
                        </div>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} /> Publié</label>
                        <button type="submit" className="btn-primary w-full justify-center" data-testid="event-save"><Save size={16} /> Enregistrer</button>
                    </form>
                </div>
            )}

            {participants && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setParticipants(null)}>
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="participants-modal">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="font-display font-bold text-xl text-brand-dark">Participants</h2>
                                <p className="text-sm text-gray-500">{participants.event.title_fr} · {participants.list.length}{participants.event.capacity ? ` / ${participants.event.capacity}` : ""} inscrit(s)</p>
                            </div>
                            <button type="button" onClick={() => setParticipants(null)} data-testid="participants-close"><X /></button>
                        </div>
                        {participants.list.length === 0 ? (
                            <p className="text-gray-500 text-sm">Aucun inscrit pour le moment.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-400 border-b border-gray-100">
                                            <th className="py-2 pr-3 font-display font-semibold">Nom</th>
                                            <th className="py-2 pr-3 font-display font-semibold">Email</th>
                                            <th className="py-2 pr-3 font-display font-semibold">Téléphone</th>
                                            <th className="py-2 font-display font-semibold">Inscrit le</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {participants.list.map((p) => (
                                            <tr key={p.id} className="border-b border-gray-50" data-testid={`participant-${p.id}`}>
                                                <td className="py-2 pr-3 text-brand-dark font-medium">{p.user_name || "—"}</td>
                                                <td className="py-2 pr-3"><a href={`mailto:${p.user_email}`} className="text-brand-turquoise hover:underline">{p.user_email}</a></td>
                                                <td className="py-2 pr-3 text-gray-600">{p.user_phone || "—"}</td>
                                                <td className="py-2 text-gray-500">{new Date(p.created_at).toLocaleDateString("fr-FR")}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventsAdmin;
