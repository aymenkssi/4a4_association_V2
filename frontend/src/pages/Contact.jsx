import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { useApp } from "../context/AppContext";
import { MapPin, Phone, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import SEO from "../components/SEO";

const Contact = () => {
    const { lang, tr, settings } = useApp();
    const [page, setPage] = useState(null);
    const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
    const [sending, setSending] = useState(false);

    useEffect(() => { api.get("/pages/contact").then((r) => setPage(r.data)).catch(() => {}); }, []);
    const c = page?.content?.[lang] || {};

    const submit = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            await api.post("/messages", form);
            toast.success(tr("common.success"));
            setForm({ name: "", email: "", subject: "", message: "" });
        } catch (e) {
            toast.error(tr("common.error"));
        } finally {
            setSending(false);
        }
    };

    return (
        <div data-testid="contact-page" className="bg-white">
            <SEO title={c.title} />
            <section className="bg-brand-bg py-16">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="font-hand text-2xl text-brand-turquoise mb-2">{c.lead}</div>
                    <h1 className="text-4xl lg:text-6xl font-display font-bold text-brand-dark mb-4">
                        <span className="hand-underline">{c.title}</span>
                    </h1>
                </div>
            </section>

            <section className="py-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-5 gap-10">
                    <aside className="lg:col-span-2 space-y-4">
                        <p className="text-gray-700 leading-relaxed">{c.intro}</p>
                        <div className="bg-brand-bg rounded-3xl p-6 space-y-4">
                            <div className="flex items-start gap-3"><MapPin className="text-brand-turquoise mt-0.5 flex-shrink-0" /><div><div className="font-display font-semibold text-brand-dark text-sm">{tr("contact.ourAddress")}</div><div className="text-gray-600 text-sm">{settings.address}</div></div></div>
                            <div className="flex items-start gap-3"><Phone className="text-brand-turquoise mt-0.5 flex-shrink-0" /><div><div className="font-display font-semibold text-brand-dark text-sm">{tr("contact.ourPhone")}</div><a href={`tel:${settings.contact_phone}`} className="text-gray-600 text-sm hover:text-brand-turquoise">{settings.contact_phone}</a></div></div>
                            <div className="flex items-start gap-3"><Mail className="text-brand-turquoise mt-0.5 flex-shrink-0" /><div><div className="font-display font-semibold text-brand-dark text-sm">{tr("contact.ourEmail")}</div><a href={`mailto:${settings.contact_email}`} className="text-gray-600 text-sm hover:text-brand-turquoise">{settings.contact_email}</a></div></div>
                        </div>
                    </aside>

                    <form onSubmit={submit} className="lg:col-span-3 bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-4" data-testid="contact-form">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-display font-semibold mb-1">{tr("contact.name")} *</label>
                                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" data-testid="contact-name" />
                            </div>
                            <div>
                                <label className="block text-sm font-display font-semibold mb-1">{tr("contact.email")} *</label>
                                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" data-testid="contact-email" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-display font-semibold mb-1">{tr("contact.subject")}</label>
                            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" data-testid="contact-subject" />
                        </div>
                        <div>
                            <label className="block text-sm font-display font-semibold mb-1">{tr("contact.message")} *</label>
                            <textarea required rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" data-testid="contact-message" />
                        </div>
                        <button type="submit" disabled={sending} className="btn-primary w-full justify-center disabled:opacity-60" data-testid="contact-submit">
                            {sending ? tr("common.sending") : <><Send size={18} />{tr("common.submit")}</>}
                        </button>
                    </form>
                </div>
            </section>
        </div>
    );
};

export default Contact;
