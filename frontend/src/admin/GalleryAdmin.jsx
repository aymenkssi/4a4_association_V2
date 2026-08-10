import React, { useEffect, useState } from "react";
import api, { mediaUrl } from "../lib/api";
import { toast } from "sonner";
import { Plus, Trash2, X, Save } from "lucide-react";
import MediaPicker from "./MediaPicker";

const empty = { title_fr: "", title_en: "", media_type: "image", media_url: "", category: "general" };

const GalleryAdmin = () => {
    const [items, setItems] = useState([]);
    const [editing, setEditing] = useState(null);

    const load = async () => {
        try { const r = await api.get("/gallery"); setItems(r.data || []); } catch (e) {}
    };
    useEffect(() => { load(); }, []);

    const save = async (e) => {
        e.preventDefault();
        try {
            await api.post("/gallery", editing);
            toast.success("Ajouté");
            setEditing(null);
            load();
        } catch (e) { toast.error("Erreur"); }
    };

    const remove = async (id) => {
        if (!window.confirm("Confirmer la suppression ?")) return;
        await api.delete(`/gallery/${id}`);
        load();
    };

    return (
        <div data-testid="admin-gallery">
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-display font-bold text-3xl text-brand-dark">Galerie</h1>
                <button onClick={() => setEditing({ ...empty })} className="btn-primary" data-testid="admin-gallery-new"><Plus size={16} /> Ajouter un média</button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {items.map((it) => (
                    <div key={it.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden relative group" data-testid={`admin-gallery-${it.id}`}>
                        {it.media_type === "video" ? (
                            <div className="aspect-square bg-gradient-to-br from-brand-purple to-brand-turquoise flex items-center justify-center text-white">Vidéo</div>
                        ) : (
                            <img src={mediaUrl(it.media_url)} alt="" className="w-full aspect-square object-cover" />
                        )}
                        <div className="p-2 text-xs text-gray-500 capitalize">{it.category}</div>
                        <button onClick={() => remove(it.id)} className="absolute top-2 right-2 bg-white/90 hover:bg-brand-red hover:text-white text-brand-red p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`delete-gallery-${it.id}`}><Trash2 size={14} /></button>
                    </div>
                ))}
                {items.length === 0 && <p className="text-gray-500 col-span-full">Aucun média</p>}
            </div>

            {editing && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setEditing(null)}>
                    <form onClick={(e) => e.stopPropagation()} onSubmit={save} className="bg-white rounded-3xl p-6 w-full max-w-xl space-y-3" data-testid="admin-gallery-form">
                        <div className="flex items-center justify-between">
                            <h2 className="font-display font-bold text-xl">Ajouter un média</h2>
                            <button type="button" onClick={() => setEditing(null)}><X /></button>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <label className="block"><span className="text-xs font-semibold">Titre FR</span><input value={editing.title_fr} onChange={(e) => setEditing({ ...editing, title_fr: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></label>
                            <label className="block"><span className="text-xs font-semibold">Titre EN</span><input value={editing.title_en} onChange={(e) => setEditing({ ...editing, title_en: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></label>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <label className="block"><span className="text-xs font-semibold">Type</span>
                                <select value={editing.media_type} onChange={(e) => setEditing({ ...editing, media_type: e.target.value })} className="w-full border rounded-lg px-3 py-2" data-testid="gallery-type">
                                    <option value="image">Image</option>
                                    <option value="video">Vidéo</option>
                                </select>
                            </label>
                            <label className="block"><span className="text-xs font-semibold">Catégorie</span>
                                <input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} placeholder="musique, jardinage..." className="w-full border rounded-lg px-3 py-2" data-testid="gallery-category" />
                            </label>
                        </div>
                        <div>
                            <span className="text-xs font-semibold">Média (URL ou téléversement)</span>
                            <MediaPicker
                                value={editing.media_url}
                                onChange={(v) => setEditing({ ...editing, media_url: v })}
                                accept={editing.media_type === "video" ? "video/*" : "image/*"}
                                testId="gallery-media"
                            />
                            {editing.media_type === "video" && <p className="text-xs text-gray-500 mt-1">Pour YouTube/Vimeo, collez l'URL de la vidéo.</p>}
                        </div>
                        <button type="submit" disabled={!editing.media_url} className="btn-primary w-full justify-center disabled:opacity-60" data-testid="gallery-save"><Save size={16} /> Ajouter</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default GalleryAdmin;
