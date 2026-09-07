import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { useApp } from "../context/AppContext";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import SEO from "../components/SEO";

const INTERESTS = ["music", "gardening", "cooking", "yoga", "judo", "theater"];

const INTEREST_LABELS = {
    fr: { music: "Musique", gardening: "Jardinage", cooking: "Cuisine", yoga: "Yoga", judo: "Judo", theater: "Théâtre" },
    en: { music: "Music", gardening: "Gardening", cooking: "Cooking", yoga: "Yoga", judo: "Judo", theater: "Theater" },
};

const Member = () => {
    const { lang, tr } = useApp();
    const [page, setPage] = useState(null);
    const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", address: "", interests: [], message: "" });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => { api.get("/pages/member").then((r) => setPage(r.data)).catch(() => {}); }, []);

    const c = page?.content?.[lang] || {};

    const toggle = (k) => {
        setForm((f) => ({ ...f, interests: f.interests.includes(k) ? f.interests.filter((x) => x !== k) : [...f.interests, k] }));
    };

    const submit = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            await api.post("/members", form);
            setSent(true);
            toast.success(tr("common.success"));
            setForm({ first_name: "", last_name: "", email: "", phone: "", address: "", interests: [], message: "" });
        } catch (e) {
            toast.error(tr("common.error"));
        } finally {
            setSending(false);
        }
    };

    return (
        <div data-testid="member-page" className="bg-white">
            <SEO title={c.title} />
            <section className="bg-brand-bg py-16">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="font-hand text-2xl text-brand-purple mb-2">{c.lead}</div>
                    <h1 className="text-4xl lg:text-6xl font-display font-bold text-brand-dark mb-4">
                        <span className="hand-underline">{c.title?.split(" ")[0]}</span> {c.title?.split(" ").slice(1).join(" ")}
                    </h1>
                    <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">{c.intro}</p>
                </div>
            </section>

            <section className="py-16">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-5 gap-10">
                    <aside className="lg:col-span-2 space-y-3">
                        {(c.benefits || []).map((b, i) => (
                            <div key={i} className="flex gap-3 bg-brand-bg rounded-2xl p-4" data-testid={`benefit-${i}`}>
                                <CheckCircle2 className="text-brand-turquoise flex-shrink-0" size={22} />
                                <span className="text-gray-700">{b}</span>
                            </div>
                        ))}
                    </aside>

                    <form onSubmit={submit} className="lg:col-span-3 bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-4" data-testid="member-form">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-display font-semibold mb-1">{tr("member.firstName")} *</label>
                                <input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" data-testid="member-firstname" />
                            </div>
                            <div>
                                <label className="block text-sm font-display font-semibold mb-1">{tr("member.lastName")} *</label>
                                <input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" data-testid="member-lastname" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-display font-semibold mb-1">{tr("contact.email")} *</label>
                            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" data-testid="member-email" />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-display font-semibold mb-1">{tr("member.phone")}</label>
                                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" data-testid="member-phone" />
                            </div>
                            <div>
                                <label className="block text-sm font-display font-semibold mb-1">{tr("member.address")}</label>
                                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" data-testid="member-address" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-display font-semibold mb-2">{tr("member.interests")}</label>
                            <div className="flex flex-wrap gap-2">
                                {INTERESTS.map((k) => (
                                    <button type="button" key={k} onClick={() => toggle(k)} className={`px-3 py-1.5 rounded-full text-sm font-display ${form.interests.includes(k) ? "bg-brand-turquoise text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`} data-testid={`member-interest-${k}`}>
                                        {(INTEREST_LABELS[lang] || INTEREST_LABELS.fr)[k]}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-display font-semibold mb-1">{tr("member.message")}</label>
                            <textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" data-testid="member-message" />
                        </div>
                        <button type="submit" disabled={sending} className="btn-primary w-full justify-center disabled:opacity-60" data-testid="member-submit">
                            {sending ? tr("common.sending") : tr("member.submit")}
                        </button>
                        {sent && <p className="text-brand-turquoise font-display font-semibold text-center" data-testid="member-success">{tr("common.success")}</p>}
                    </form>
                </div>
            </section>
        </div>
    );
};

export default Member;
