import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import SEO from "../components/SEO";

const Register = () => {
    const { register, lang } = useApp();
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
    const [rgpd, setRgpd] = useState(false);
    const [newsletter, setNewsletter] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fr = lang === "fr";
    const from = location.state?.from || "/evenements";
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        if (!rgpd) {
            setError(fr ? "Vous devez accepter la politique de confidentialité (RGPD)." : "You must accept the privacy policy (GDPR).");
            return;
        }
        setLoading(true);
        try {
            const u = await register({ ...form, rgpd_consent: rgpd, newsletter });
            toast.success(fr ? "Compte créé, bienvenue !" : "Account created, welcome!");
            navigate(u.role === "admin" ? "/admin" : from);
        } catch (err) {
            const msg = err?.response?.data?.detail;
            setError(typeof msg === "string" ? msg : fr ? "Une erreur est survenue." : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-brand-bg min-h-[70vh] flex items-center justify-center px-4 py-16" data-testid="register-page">
            <SEO title={fr ? "Créer un compte" : "Create an account"} />
            <form onSubmit={submit} className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md" data-testid="register-form">
                <h1 className="font-display font-bold text-3xl text-brand-dark mb-1">{fr ? "Créer un compte" : "Create an account"}</h1>
                <p className="text-gray-500 text-sm mb-6">{fr ? "Un compte est nécessaire pour s'inscrire aux événements." : "An account is required to register for events."}</p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-display font-semibold mb-1">{fr ? "Nom complet" : "Full name"}</label>
                        <input required value={form.name} onChange={set("name")} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" data-testid="register-name" />
                    </div>
                    <div>
                        <label className="block text-sm font-display font-semibold mb-1">Email</label>
                        <input type="email" required value={form.email} onChange={set("email")} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" data-testid="register-email" />
                    </div>
                    <div>
                        <label className="block text-sm font-display font-semibold mb-1">{fr ? "Téléphone" : "Phone"}</label>
                        <input required value={form.phone} onChange={set("phone")} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" data-testid="register-phone" />
                    </div>
                    <div>
                        <label className="block text-sm font-display font-semibold mb-1">{fr ? "Mot de passe" : "Password"}</label>
                        <input type="password" required minLength={6} value={form.password} onChange={set("password")} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" data-testid="register-password" />
                        <p className="text-xs text-gray-400 mt-1">{fr ? "6 caractères minimum" : "At least 6 characters"}</p>
                    </div>
                    <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={rgpd} onChange={(e) => setRgpd(e.target.checked)} className="mt-1" data-testid="register-rgpd" />
                        <span>
                            {fr ? "J'accepte que mes données soient traitées conformément à la " : "I agree that my data is processed in accordance with the "}
                            <Link to="/confidentialite" target="_blank" className="text-brand-turquoise font-semibold hover:underline">{fr ? "politique de confidentialité (RGPD)" : "privacy policy (GDPR)"}</Link>.
                        </span>
                    </label>
                    <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} className="mt-1" data-testid="register-newsletter" />
                        <span>{fr ? "Je souhaite recevoir la newsletter de l'association (actualités et événements)." : "I want to receive the association's newsletter (news and events)."}</span>
                    </label>
                    {error && <p className="text-brand-red text-sm" data-testid="register-error">{error}</p>}
                    <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-60" data-testid="register-submit">
                        <UserPlus size={16} /> {loading ? "..." : fr ? "Créer mon compte" : "Create my account"}
                    </button>
                </div>
                <p className="text-sm text-gray-600 mt-6 text-center">
                    {fr ? "Déjà un compte ?" : "Already have an account?"}{" "}
                    <Link to="/connexion" state={{ from }} className="text-brand-turquoise font-semibold hover:underline" data-testid="register-to-login">{fr ? "Se connecter" : "Sign in"}</Link>
                </p>
            </form>
        </div>
    );
};

export default Register;
