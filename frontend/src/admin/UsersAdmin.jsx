import React, { useEffect, useMemo, useState } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import { Mail, MailCheck, Users as UsersIcon, Shield } from "lucide-react";

const UsersAdmin = () => {
    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState("all"); // all | subscribers

    const load = async () => {
        try {
            const r = await api.get("/admin/users");
            setUsers(r.data || []);
        } catch (e) { toast.error("Erreur de chargement"); }
    };
    useEffect(() => { load(); }, []);

    const subscribers = useMemo(() => users.filter((u) => u.newsletter), [users]);
    const shown = filter === "subscribers" ? subscribers : users;

    const toggle = async (u) => {
        const next = !u.newsletter;
        setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, newsletter: next } : x)));
        try {
            await api.patch(`/admin/users/${u.id}/newsletter`, { newsletter: next });
        } catch (e) {
            toast.error("Erreur");
            setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, newsletter: !next } : x)));
        }
    };

    return (
        <div data-testid="admin-users">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="font-display font-bold text-3xl text-brand-dark">Utilisateurs</h1>
                    <p className="text-gray-500 text-sm">Comptes créés sur le site et abonnements newsletter</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white rounded-2xl px-4 py-2 border border-gray-100 flex items-center gap-2" data-testid="users-total">
                        <UsersIcon size={18} className="text-brand-turquoise" />
                        <span className="font-display font-bold text-brand-dark">{users.length}</span>
                        <span className="text-xs text-gray-500 ml-1">comptes</span>
                    </div>
                    <div className="bg-white rounded-2xl px-4 py-2 border border-gray-100 flex items-center gap-2" data-testid="users-subscribers">
                        <MailCheck size={18} className="text-brand-purple" />
                        <span className="font-display font-bold text-brand-dark">{subscribers.length}</span>
                        <span className="text-xs text-gray-500 ml-1">abonnés newsletter</span>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 mb-4">
                <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-full text-sm font-display ${filter === "all" ? "bg-brand-turquoise text-white" : "bg-gray-100 text-gray-600"}`} data-testid="users-filter-all">Tous</button>
                <button onClick={() => setFilter("subscribers")} className={`px-3 py-1.5 rounded-full text-sm font-display ${filter === "subscribers" ? "bg-brand-purple text-white" : "bg-gray-100 text-gray-600"}`} data-testid="users-filter-subscribers">Abonnés newsletter</button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-gray-400 border-b border-gray-100">
                            <th className="py-3 px-4 font-display font-semibold">Nom</th>
                            <th className="py-3 px-4 font-display font-semibold">Email</th>
                            <th className="py-3 px-4 font-display font-semibold">Téléphone</th>
                            <th className="py-3 px-4 font-display font-semibold">Rôle</th>
                            <th className="py-3 px-4 font-display font-semibold">Inscrit le</th>
                            <th className="py-3 px-4 font-display font-semibold">Newsletter</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shown.map((u) => (
                            <tr key={u.id} className="border-b border-gray-50 last:border-0" data-testid={`user-row-${u.id}`}>
                                <td className="py-3 px-4 text-brand-dark font-medium">{u.name || "—"}</td>
                                <td className="py-3 px-4"><a href={`mailto:${u.email}`} className="text-brand-turquoise hover:underline">{u.email}</a></td>
                                <td className="py-3 px-4 text-gray-600">{u.phone || "—"}</td>
                                <td className="py-3 px-4">
                                    {u.role === "admin" ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-brand-dark text-white"><Shield size={11} /> admin</span>
                                    ) : (
                                        <span className="text-xs text-gray-500">membre</span>
                                    )}
                                </td>
                                <td className="py-3 px-4 text-gray-500">{u.created_at ? new Date(u.created_at).toLocaleDateString("fr-FR") : "—"}</td>
                                <td className="py-3 px-4">
                                    <button
                                        onClick={() => toggle(u)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-display font-semibold transition-colors ${u.newsletter ? "bg-brand-purple text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                                        data-testid={`user-newsletter-toggle-${u.id}`}
                                    >
                                        {u.newsletter ? <MailCheck size={13} /> : <Mail size={13} />}
                                        {u.newsletter ? "Abonné" : "Non abonné"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {shown.length === 0 && (
                            <tr><td colSpan={6} className="py-8 text-center text-gray-400">Aucun utilisateur</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UsersAdmin;
