import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Logo from "../components/Logo";
import { Lock } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
    const { login, tr } = useApp();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await login(email, password);
            toast.success("Bienvenue");
            navigate("/admin");
        } catch (e) {
            const msg = e?.response?.data?.detail || tr("admin.badCreds");
            setError(typeof msg === "string" ? msg : tr("admin.badCreds"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-bg p-6" data-testid="login-page">
            <form onSubmit={submit} className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md" data-testid="login-form">
                <div className="flex flex-col items-center mb-6">
                    <Logo size={72} />
                    <h1 className="font-display font-bold text-2xl mt-3 text-brand-dark">{tr("admin.login")}</h1>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-display font-semibold mb-1">Email</label>
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" data-testid="login-email" />
                    </div>
                    <div>
                        <label className="block text-sm font-display font-semibold mb-1">{tr("admin.password")}</label>
                        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" data-testid="login-password" />
                    </div>
                    {error && <p className="text-brand-red text-sm" data-testid="login-error">{error}</p>}
                    <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-60" data-testid="login-submit">
                        <Lock size={16} /> {loading ? "..." : tr("admin.connect")}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Login;
