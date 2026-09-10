import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { LogIn } from "lucide-react";
import { toast } from "sonner";
import SEO from "../components/SEO";

const UserLogin = () => {
    const { login, lang } = useApp();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fr = lang === "fr";
    const from = location.state?.from || "/evenements";

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const u = await login(email, password);
            toast.success(fr ? "Bienvenue !" : "Welcome!");
            navigate(u.role === "admin" ? "/admin" : from);
        } catch (err) {
            const msg = err?.response?.data?.detail;
            setError(typeof msg === "string" ? msg : fr ? "Email ou mot de passe incorrect" : "Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-brand-bg min-h-[70vh] flex items-center justify-center px-4 py-16" data-testid="user-login-page">
            <SEO title={fr ? "Connexion" : "Login"} />
            <form onSubmit={submit} className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md" data-testid="user-login-form">
                <h1 className="font-display font-bold text-3xl text-brand-dark mb-1">{fr ? "Connexion" : "Login"}</h1>
                <p className="text-gray-500 text-sm mb-6">{fr ? "Accédez à votre compte pour vous inscrire aux événements." : "Sign in to register for events."}</p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-display font-semibold mb-1">Email</label>
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" data-testid="user-login-email" />
                    </div>
                    <div>
                        <label className="block text-sm font-display font-semibold mb-1">{fr ? "Mot de passe" : "Password"}</label>
                        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" data-testid="user-login-password" />
                    </div>
                    {error && <p className="text-brand-red text-sm" data-testid="user-login-error">{error}</p>}
                    <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-60" data-testid="user-login-submit">
                        <LogIn size={16} /> {loading ? "..." : fr ? "Se connecter" : "Sign in"}
                    </button>
                </div>
                <p className="text-sm text-gray-600 mt-6 text-center">
                    {fr ? "Pas encore de compte ?" : "No account yet?"}{" "}
                    <Link to="/inscription" state={{ from }} className="text-brand-turquoise font-semibold hover:underline" data-testid="user-login-to-register">{fr ? "Créer un compte" : "Create an account"}</Link>
                </p>
            </form>
        </div>
    );
};

export default UserLogin;
