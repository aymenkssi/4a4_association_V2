import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import { Plus, Trash2, Edit, X, Save } from "lucide-react";
import MediaPicker from "./MediaPicker";
import RichText from "./RichText";

const empty = { title_fr: "", title_en: "", excerpt_fr: "", excerpt_en: "", body_fr: "", body_en: "", image_url: "", published: true };

const NewsAdmin = () => {
    const [items, setItems] = useState([]);
    const [editing, setEditing] = useState(null);

    const load = async () => {
        try { const r = await api.get("/news?only_published=false"); setItems(r.data || []); } catch (e) {}
    };
    useEffect(() => { load(); }, []);

    const save = async (e) => {
        e.preventDefault();
        try {
            if (editing.id) await api.put(`/news/${editing.id}`, editing);
            else await api.post("/news", editing);
            toast.success("Enregistré");
            setEditing(null);
            load();
        } catch (e) { toast.error("Erreur"); }
    };

    const remove = async (id) => {
        if (!window.confirm("Confirmer la suppression ?")) return;
        await api.delete(`/news/${id}`);
        load();
    };

    return (
        <div data-testid="admin-news">
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-display font-bold text-3xl text-brand-dark">Actualités</h1>
                <button onClick={() => setEditing({ ...empty })} className="btn-primary" data-testid="admin-news-new"><Plus size={16} /> Nouveau</button>
            </div>

            <div className="grid gap-3">
                {items.map((n) => (
                    <div key={n.id} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between" data-testid={`admin-news-${n.id}`}>
                        <div>
                            <div className="font-display font-bold text-brand-dark">{n.title_fr}</div>
                            <div className="text-sm text-gray-500 line-clamp-1">{n.excerpt_fr}</div>
                            <div className="text-xs text-gray-400">{n.published ? "Publié" : "Brouillon"}</div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setEditing(n)} className="p-2 text-brand-turquoise hover:bg-gray-100 rounded-lg" data-testid={`edit-news-${n.id}`}><Edit size={16} /></button>
                            <button onClick={() => remove(n.id)} className="p-2 text-brand-red hover:bg-red-50 rounded-lg" data-testid={`delete-news-${n.id}`}><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
                {items.length === 0 && <p className="text-gray-500">Aucune actualité</p>}
            </div>

            {editing && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setEditing(null)}>
                    <form onClick={(e) => e.stopPropagation()} onSubmit={save} className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-3" data-testid="admin-news-form">
                        <div className="flex items-center justify-between">
                            <h2 className="font-display font-bold text-xl">{editing.id ? "Modifier" : "Nouvelle"} actualité</h2>
                            <button type="button" onClick={() => setEditing(null)}><X /></button>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <label className="block"><span className="text-xs font-semibold">Titre FR</span><input required value={editing.title_fr} onChange={(e) => setEditing({ ...editing, title_fr: e.target.value })} className="w-full border rounded-lg px-3 py-2" data-testid="news-title-fr" /></label>
                            <label className="block"><span className="text-xs font-semibold">Titre EN</span><input required value={editing.title_en} onChange={(e) => setEditing({ ...editing, title_en: e.target.value })} className="w-full border rounded-lg px-3 py-2" data-testid="news-title-en" /></label>
                        </div>
                        <label className="block"><span className="text-xs font-semibold">Extrait FR</span><textarea rows={2} value={editing.excerpt_fr} onChange={(e) => setEditing({ ...editing, excerpt_fr: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></label>
                        <label className="block"><span className="text-xs font-semibold">Extrait EN</span><textarea rows={2} value={editing.excerpt_en} onChange={(e) => setEditing({ ...editing, excerpt_en: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></label>
                        <div>
                            <span className="text-xs font-semibold">Corps FR (éditeur enrichi)</span>
                            <RichText value={editing.body_fr} onChange={(v) => setEditing({ ...editing, body_fr: v })} testId="news-body-fr" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold">Corps EN (rich editor)</span>
                            <RichText value={editing.body_en} onChange={(v) => setEditing({ ...editing, body_en: v })} testId="news-body-en" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold">Image</span>
                            <MediaPicker value={editing.image_url} onChange={(v) => setEditing({ ...editing, image_url: v })} testId="news-image" />
                        </div>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} /> Publié</label>
                        <button type="submit" className="btn-primary w-full justify-center" data-testid="news-save"><Save size={16} /> Enregistrer</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default NewsAdmin;
