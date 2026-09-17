import React, { useEffect, useState } from "react";
import api, { mediaUrl } from "../lib/api";
import { toast } from "sonner";
import { Plus, Trash2, Edit, X, Save, UserRound } from "lucide-react";
import MediaPicker from "./MediaPicker";

const empty = { name: "", role: "", nature: "staff", photo_url: "", display_mode: "bio", bio: "", detail_image_url: "", order: 0 };

const NATURE_LABEL = { staff: "Staff", intervenant: "Intervenant" };

const TeamAdmin = () => {
    const [items, setItems] = useState([]);
    const [editing, setEditing] = useState(null);

    const load = async () => {
        try {
            const r = await api.get("/team");
            setItems(r.data || []);
        } catch (e) {}
    };
    useEffect(() => { load(); }, []);

    const save = async (e) => {
        e.preventDefault();
        try {
            if (editing.id) await api.put(`/team/${editing.id}`, editing);
            else await api.post("/team", editing);
            toast.success("Enregistré");
            setEditing(null);
            load();
        } catch (e) { toast.error("Erreur"); }
    };

    const remove = async (id) => {
        if (!window.confirm("Confirmer la suppression ?")) return;
        await api.delete(`/team/${id}`);
        load();
    };

    const staff = items.filter((m) => m.nature === "staff");
    const intervenants = items.filter((m) => m.nature === "intervenant");

    const renderGroup = (title, list) => (
        <div className="mb-8">
            <h2 className="font-display font-bold text-lg text-brand-dark mb-3">{title} <span className="text-gray-400 text-sm">({list.length})</span></h2>
            {list.length === 0 ? (
                <p className="text-gray-400 text-sm">Aucun membre.</p>
            ) : (
                <div className="grid gap-3">
                    {list.map((m) => (
                        <div key={m.id} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-4" data-testid={`admin-team-${m.id}`}>
                            <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                                {m.photo_url ? <img src={mediaUrl(m.photo_url)} alt="" className="w-full h-full object-cover" /> : <UserRound className="text-gray-400" size={24} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-display font-bold text-brand-dark">{m.name}</div>
                                <div className="text-sm text-gray-500">{m.role}</div>
                                {m.bio && <div className="text-xs text-gray-400 truncate">{m.bio}</div>}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setEditing(m)} className="p-2 text-brand-turquoise hover:bg-gray-100 rounded-lg" data-testid={`edit-team-${m.id}`}><Edit size={16} /></button>
                                <button onClick={() => remove(m.id)} className="p-2 text-brand-red hover:bg-red-50 rounded-lg" data-testid={`delete-team-${m.id}`}><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div data-testid="admin-team">
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-display font-bold text-3xl text-brand-dark">Équipe</h1>
                <button onClick={() => setEditing({ ...empty })} className="btn-primary" data-testid="admin-team-new"><Plus size={16} /> Ajouter un membre</button>
            </div>

            {items.length === 0 && <p className="text-gray-500 mb-6">Aucun membre pour le moment. Ajoutez le staff et les intervenants.</p>}
            {renderGroup("Staff", staff)}
            {renderGroup("Intervenants", intervenants)}

            {editing && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setEditing(null)}>
                    <form onClick={(e) => e.stopPropagation()} onSubmit={save} className="bg-white rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-3" data-testid="admin-team-form">
                        <div className="flex items-center justify-between">
                            <h2 className="font-display font-bold text-xl">{editing.id ? "Modifier" : "Nouveau"} membre</h2>
                            <button type="button" onClick={() => setEditing(null)}><X /></button>
                        </div>
                        <label className="block"><span className="text-xs font-semibold">Nom</span><input required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" data-testid="team-name" /></label>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <label className="block">
                                <span className="text-xs font-semibold">Nature</span>
                                <select value={editing.nature} onChange={(e) => setEditing({ ...editing, nature: e.target.value })} className="w-full border rounded-lg px-3 py-2 bg-white" data-testid="team-nature">
                                    <option value="staff">Staff</option>
                                    <option value="intervenant">Intervenant</option>
                                </select>
                            </label>
                            <label className="block"><span className="text-xs font-semibold">Rôle / Fonction</span><input value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} placeholder="Ex : Coordinatrice, Prof. de musique" className="w-full border rounded-lg px-3 py-2" data-testid="team-role" /></label>
                        </div>
                        <div>
                            <span className="text-xs font-semibold">Photo</span>
                            <MediaPicker value={editing.photo_url} onChange={(v) => setEditing({ ...editing, photo_url: v })} accept="image/*" testId="team-photo" />
                            {editing.photo_url && <img src={mediaUrl(editing.photo_url)} alt="" className="mt-2 w-20 h-20 object-cover rounded-full border border-gray-200" />}
                        </div>
                        <label className="block">
                            <span className="text-xs font-semibold">Type de fiche</span>
                            <select value={editing.display_mode || "bio"} onChange={(e) => setEditing({ ...editing, display_mode: e.target.value })} className="w-full border rounded-lg px-3 py-2 bg-white" data-testid="team-display-mode">
                                <option value="bio">Description (texte)</option>
                                <option value="image">Image détaillée (contient tous les détails)</option>
                            </select>
                        </label>
                        {(editing.display_mode || "bio") === "image" ? (
                            <div>
                                <span className="text-xs font-semibold">Image détaillée</span>
                                <MediaPicker value={editing.detail_image_url} onChange={(v) => setEditing({ ...editing, detail_image_url: v })} accept="image/*" testId="team-detail-image" />
                                {editing.detail_image_url && <img src={mediaUrl(editing.detail_image_url)} alt="" className="mt-2 w-full max-h-64 object-contain rounded-lg border border-gray-200 bg-gray-50" />}
                            </div>
                        ) : (
                            <label className="block"><span className="text-xs font-semibold">Mini bio</span><textarea rows={3} value={editing.bio} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} className="w-full border rounded-lg px-3 py-2" data-testid="team-bio" /></label>
                        )}
                        <label className="block"><span className="text-xs font-semibold">Ordre d'affichage</span><input type="number" value={editing.order ?? 0} onChange={(e) => setEditing({ ...editing, order: parseInt(e.target.value, 10) || 0 })} className="w-full border rounded-lg px-3 py-2" data-testid="team-order" /></label>
                        <button type="submit" className="btn-primary w-full justify-center" data-testid="team-save"><Save size={16} /> Enregistrer</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default TeamAdmin;
