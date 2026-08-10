import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { Trash2, Mail, Phone } from "lucide-react";

const MembersAdmin = () => {
    const [items, setItems] = useState([]);
    const load = async () => { try { const r = await api.get("/members"); setItems(r.data || []); } catch (e) {} };
    useEffect(() => { load(); }, []);
    const remove = async (id) => { if (!window.confirm("Confirmer la suppression ?")) return; await api.delete(`/members/${id}`); load(); };
    return (
        <div data-testid="admin-members">
            <h1 className="font-display font-bold text-3xl text-brand-dark mb-6">Membres ({items.length})</h1>
            <div className="grid gap-3">
                {items.map((m) => (
                    <div key={m.id} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-start justify-between gap-4" data-testid={`member-${m.id}`}>
                        <div>
                            <div className="font-display font-bold text-brand-dark">{m.first_name} {m.last_name}</div>
                            <div className="text-sm text-gray-500 flex flex-wrap gap-3 mt-1">
                                <span className="inline-flex items-center gap-1"><Mail size={14} /> {m.email}</span>
                                {m.phone && <span className="inline-flex items-center gap-1"><Phone size={14} /> {m.phone}</span>}
                            </div>
                            {m.address && <div className="text-xs text-gray-500 mt-1">{m.address}</div>}
                            {m.interests?.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{m.interests.map((i) => <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-brand-turquoise/10 text-brand-turquoise">{i}</span>)}</div>}
                            {m.message && <p className="text-sm text-gray-600 mt-2 italic">"{m.message}"</p>}
                            <div className="text-xs text-gray-400 mt-2">{new Date(m.created_at).toLocaleString("fr-FR")}</div>
                        </div>
                        <button onClick={() => remove(m.id)} className="p-2 text-brand-red hover:bg-red-50 rounded-lg flex-shrink-0" data-testid={`delete-member-${m.id}`}><Trash2 size={16} /></button>
                    </div>
                ))}
                {items.length === 0 && <p className="text-gray-500">Aucune adhésion</p>}
            </div>
        </div>
    );
};

export default MembersAdmin;
