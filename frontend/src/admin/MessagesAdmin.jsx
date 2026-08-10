import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { Trash2, Eye, EyeOff } from "lucide-react";

const MessagesAdmin = () => {
    const [items, setItems] = useState([]);
    const load = async () => { try { const r = await api.get("/messages"); setItems(r.data || []); } catch (e) {} };
    useEffect(() => { load(); }, []);
    const remove = async (id) => { if (!window.confirm("Confirmer la suppression ?")) return; await api.delete(`/messages/${id}`); load(); };
    const toggleRead = async (id) => { await api.patch(`/messages/${id}/read`); load(); };
    return (
        <div data-testid="admin-messages">
            <h1 className="font-display font-bold text-3xl text-brand-dark mb-6">Messages ({items.length})</h1>
            <div className="grid gap-3">
                {items.map((m) => (
                    <div key={m.id} className={`bg-white rounded-2xl p-4 border ${m.read ? "border-gray-100" : "border-brand-turquoise/40"}`} data-testid={`message-${m.id}`}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="font-display font-bold text-brand-dark">{m.subject || "(sans sujet)"}</div>
                                <div className="text-sm text-gray-600">{m.name} &lt;{m.email}&gt;</div>
                                <div className="text-xs text-gray-400 mt-1">{new Date(m.created_at).toLocaleString("fr-FR")}</div>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => toggleRead(m.id)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Marquer comme lu" data-testid={`read-message-${m.id}`}>
                                    {m.read ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                                <button onClick={() => remove(m.id)} className="p-2 text-brand-red hover:bg-red-50 rounded-lg" data-testid={`delete-message-${m.id}`}><Trash2 size={16} /></button>
                            </div>
                        </div>
                        <p className="text-gray-700 mt-3 whitespace-pre-line">{m.message}</p>
                    </div>
                ))}
                {items.length === 0 && <p className="text-gray-500">Aucun message</p>}
            </div>
        </div>
    );
};

export default MessagesAdmin;
