import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { useApp } from "../context/AppContext";
import { toast } from "sonner";
import { Save, Key, Mail, Loader2 } from "lucide-react";
import { SOCIAL_KEYS, SOCIAL_LABELS } from "../components/SocialIcons";
import MediaPicker from "./MediaPicker";

const SettingsAdmin = () => {
    const { settings, loadSettings } = useApp();
    const [form, setForm] = useState(settings);
    const [pw, setPw] = useState({ current_password: "", new_password: "" });
    const [saving, setSaving] = useState(false);
    const [testEmail, setTestEmail] = useState("");
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    useEffect(() => { setForm(settings); }, [settings]);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put("/settings", form);
            toast.success("Paramètres enregistrés");
            loadSettings();
        } catch (e) { toast.error("Erreur"); } finally { setSaving(false); }
    };

    const changePw = async (e) => {
        e.preventDefault();
        try {
            await api.post("/auth/change-password", pw);
            toast.success("Mot de passe modifié");
            setPw({ current_password: "", new_password: "" });
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Erreur");
        }
    };

    const sendTestEmail = async (e) => {
        e.preventDefault();
        setTesting(true);
        setTestResult(null);
        try {
            const r = await api.post("/test-email", {
                to: testEmail,
                subject: "Test d'envoi — 4à4 dix-huit",
                message: "Ceci est un email de test envoyé depuis l'administration du site 4à4 dix-huit.",
            });
            setTestResult(r.data);
            if (r.data.sent) toast.success(`Email envoyé à ${testEmail}`);
            else toast.error("Échec : voir détails ci-dessous");
        } catch (err) {
            setTestResult({ sent: false, error: err?.response?.data?.detail || err.message });
            toast.error("Erreur d'envoi");
        } finally {
            setTesting(false);
        }
    };

    return (
        <div data-testid="admin-settings" className="space-y-8">
            <h1 className="font-display font-bold text-3xl text-brand-dark">Paramètres</h1>

            <form onSubmit={save} className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 max-w-3xl">
                <h2 className="font-display font-bold text-lg border-b pb-2">Logo & identité</h2>
                <div>
                    <span className="text-xs font-semibold">Logo du site</span>
                    <MediaPicker value={form.logo_url || ""} onChange={(v) => set("logo_url", v)} accept="image/*" testId="settings-logo" />
                    {form.logo_url && <img src={form.logo_url.startsWith("http") || form.logo_url.startsWith("/") ? form.logo_url : `/${form.logo_url}`} alt="" className="mt-2 w-16 h-16 object-contain bg-gray-50 rounded-lg p-1" />}
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                    <label className="block"><span className="text-xs font-semibold">Titre site (FR)</span><input value={form.site_title_fr || ""} onChange={(e) => set("site_title_fr", e.target.value)} className="w-full border rounded-lg px-3 py-2" data-testid="settings-title-fr" /></label>
                    <label className="block"><span className="text-xs font-semibold">Titre site (EN)</span><input value={form.site_title_en || ""} onChange={(e) => set("site_title_en", e.target.value)} className="w-full border rounded-lg px-3 py-2" data-testid="settings-title-en" /></label>
                </div>
                <label className="block"><span className="text-xs font-semibold">URL publique du site (pour le SEO/sitemap)</span><input value={form.site_url || ""} onChange={(e) => set("site_url", e.target.value)} placeholder="https://4a4dixhuit.org" className="w-full border rounded-lg px-3 py-2" data-testid="settings-site-url" /></label>
                <label className="block"><span className="text-xs font-semibold">Meta description (FR)</span><textarea rows={2} value={form.meta_description_fr || ""} onChange={(e) => set("meta_description_fr", e.target.value)} className="w-full border rounded-lg px-3 py-2" data-testid="settings-meta-fr" /></label>
                <label className="block"><span className="text-xs font-semibold">Meta description (EN)</span><textarea rows={2} value={form.meta_description_en || ""} onChange={(e) => set("meta_description_en", e.target.value)} className="w-full border rounded-lg px-3 py-2" data-testid="settings-meta-en" /></label>

                <h2 className="font-display font-bold text-lg border-b pb-2 pt-4">Contact & don</h2>
                <label className="block"><span className="text-xs font-semibold">Lien HelloAsso (don)</span><input value={form.helloasso_url || ""} onChange={(e) => set("helloasso_url", e.target.value)} className="w-full border rounded-lg px-3 py-2" data-testid="settings-helloasso" /></label>
                <label className="block"><span className="text-xs font-semibold">Email contact</span><input value={form.contact_email || ""} onChange={(e) => set("contact_email", e.target.value)} className="w-full border rounded-lg px-3 py-2" data-testid="settings-email" /></label>
                <label className="block"><span className="text-xs font-semibold">Téléphone</span><input value={form.contact_phone || ""} onChange={(e) => set("contact_phone", e.target.value)} className="w-full border rounded-lg px-3 py-2" data-testid="settings-phone" /></label>
                <label className="block"><span className="text-xs font-semibold">Adresse</span><input value={form.address || ""} onChange={(e) => set("address", e.target.value)} className="w-full border rounded-lg px-3 py-2" data-testid="settings-address" /></label>

                <h2 className="font-display font-bold text-lg border-b pb-2 pt-4">Réseaux sociaux</h2>
                <p className="text-xs text-gray-500 -mt-2">Laissez vide les réseaux que vous ne souhaitez pas afficher.</p>
                <label className="block">
                    <span className="text-xs font-semibold">Position de la barre flottante</span>
                    <select
                        value={form.social_bar_position || "right"}
                        onChange={(e) => set("social_bar_position", e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                        data-testid="settings-social-bar-position"
                    >
                        <option value="right">À droite</option>
                        <option value="left">À gauche</option>
                        <option value="hidden">Masquée</option>
                    </select>
                </label>
                {SOCIAL_KEYS.map((k) => (
                    <label key={k} className="block">
                        <span className="text-xs font-semibold">{SOCIAL_LABELS[k]}</span>
                        <input
                            value={form[k] || ""}
                            onChange={(e) => set(k, e.target.value)}
                            placeholder={`https://...`}
                            className="w-full border rounded-lg px-3 py-2"
                            data-testid={`settings-${k.replace("_url", "")}`}
                        />
                    </label>
                ))}

                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60" data-testid="settings-save"><Save size={16} /> Enregistrer</button>
            </form>

            <form onSubmit={changePw} className="bg-white rounded-3xl border border-gray-100 p-6 space-y-3 max-w-3xl">
                <h2 className="font-display font-bold text-lg flex items-center gap-2"><Key size={18} /> Changer le mot de passe</h2>
                <label className="block"><span className="text-xs font-semibold">Mot de passe actuel</span><input type="password" required value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} className="w-full border rounded-lg px-3 py-2" data-testid="settings-pw-current" /></label>
                <label className="block"><span className="text-xs font-semibold">Nouveau mot de passe</span><input type="password" required minLength={8} value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} className="w-full border rounded-lg px-3 py-2" data-testid="settings-pw-new" /></label>
                <button type="submit" className="btn-secondary" data-testid="settings-pw-save"><Save size={16} /> Mettre à jour</button>
            </form>

            <form onSubmit={sendTestEmail} className="bg-white rounded-3xl border border-gray-100 p-6 space-y-3 max-w-3xl">
                <h2 className="font-display font-bold text-lg flex items-center gap-2"><Mail size={18} /> Tester l'envoi d'email (Resend)</h2>
                <p className="text-xs text-gray-500">
                    Vérifie que l'intégration email fonctionne. ⚠️ En mode test Resend (sans domaine vérifié), seul l'email du compte Resend peut recevoir.
                </p>
                <label className="block">
                    <span className="text-xs font-semibold">Destinataire</span>
                    <input
                        type="email"
                        required
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="contact@4a4dixhuit.org"
                        className="w-full border rounded-lg px-3 py-2"
                        data-testid="settings-test-email-to"
                    />
                </label>
                <button type="submit" disabled={testing} className="btn-primary disabled:opacity-60" data-testid="settings-test-email-send">
                    {testing ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                    {testing ? "Envoi…" : "Envoyer l'email de test"}
                </button>
                {testResult && (
                    <div className={`rounded-xl p-3 text-sm ${testResult.sent ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`} data-testid="settings-test-email-result">
                        {testResult.sent ? (
                            <>✅ <strong>Email envoyé</strong> à {testResult.to} depuis {testResult.from} <span className="text-xs opacity-70">(id: {testResult.id})</span></>
                        ) : (
                            <>❌ <strong>Échec</strong> ({testResult.status || "?"}) : <span className="text-xs">{testResult.error}</span></>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
};

export default SettingsAdmin;
