import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import { Save, Code, ListTree } from "lucide-react";
import MediaPicker from "./MediaPicker";

const PAGE_SLUGS = ["home", "about", "actions", "member", "donate", "contact", "legal", "privacy"];
const LANGS = [
    { code: "fr", label: "Français" },
    { code: "en", label: "English" },
];

const stringifyValue = (v) => {
    if (typeof v === "string") return v;
    return JSON.stringify(v, null, 2);
};

const parseValue = (original, raw) => {
    if (typeof original === "string") return raw;
    try {
        return JSON.parse(raw);
    } catch {
        return original;
    }
};

const PageEditor = () => {
    const [slug, setSlug] = useState("home");
    const [content, setContent] = useState({ fr: {}, en: {} });
    const [activeLang, setActiveLang] = useState("fr");
    const [mode, setMode] = useState("structured"); // structured | json
    const [jsonText, setJsonText] = useState("");
    const [saving, setSaving] = useState(false);

    const load = async () => {
        try {
            const r = await api.get(`/pages/${slug}`);
            const c = r.data.content || { fr: {}, en: {} };
            setContent(c);
            setJsonText(JSON.stringify(c, null, 2));
        } catch (e) {
            setContent({ fr: {}, en: {} });
            setJsonText("{}");
        }
    };
    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug]);

    const save = async () => {
        setSaving(true);
        try {
            let payload = content;
            if (mode === "json") {
                try {
                    payload = JSON.parse(jsonText);
                } catch {
                    toast.error("JSON invalide");
                    setSaving(false);
                    return;
                }
            }
            await api.put(`/pages/${slug}`, { content: payload });
            setContent(payload);
            setJsonText(JSON.stringify(payload, null, 2));
            toast.success("Page enregistrée");
        } catch (e) {
            toast.error("Erreur d'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    const updateField = (key, raw) => {
        const langContent = content[activeLang] || {};
        const original = langContent[key];
        const newVal = parseValue(original, raw);
        const newContent = { ...content, [activeLang]: { ...langContent, [key]: newVal } };
        setContent(newContent);
        setJsonText(JSON.stringify(newContent, null, 2));
    };

    const langContent = content[activeLang] || {};
    const keys = Object.keys(langContent);

    return (
        <div data-testid="admin-pages">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display font-bold text-3xl text-brand-dark">Pages</h1>
                    <p className="text-gray-500 text-sm">Modifiez le contenu de chaque page (FR / EN)</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-white border border-gray-200 rounded-full p-1 flex">
                        <button onClick={() => setMode("structured")} className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1 ${mode === "structured" ? "bg-brand-turquoise text-white" : "text-gray-600"}`} data-testid="admin-page-mode-structured"><ListTree size={14} /> Structuré</button>
                        <button onClick={() => setMode("json")} className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1 ${mode === "json" ? "bg-brand-turquoise text-white" : "text-gray-600"}`} data-testid="admin-page-mode-json"><Code size={14} /> JSON</button>
                    </div>
                    <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-60" data-testid="admin-page-save">
                        <Save size={16} /> {saving ? "..." : "Enregistrer"}
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
                <aside className="lg:col-span-1 space-y-1 bg-white rounded-2xl p-3 border border-gray-100 h-fit">
                    {PAGE_SLUGS.map((s) => (
                        <button key={s} onClick={() => setSlug(s)} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-display capitalize ${slug === s ? "bg-brand-turquoise text-white" : "text-gray-700 hover:bg-gray-50"}`} data-testid={`admin-page-tab-${s}`}>
                            {s}
                        </button>
                    ))}
                </aside>

                <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-gray-100">
                    <div className="flex gap-2 mb-4">
                        {LANGS.map((l) => (
                            <button key={l.code} onClick={() => setActiveLang(l.code)} className={`px-3 py-1.5 rounded-full text-xs font-display font-bold ${activeLang === l.code ? "bg-brand-purple text-white" : "bg-gray-100 text-gray-600"}`} data-testid={`admin-page-lang-${l.code}`}>
                                {l.label}
                            </button>
                        ))}
                    </div>

                    {mode === "structured" ? (
                        <div className="space-y-3">
                            {keys.map((k) => {
                                const v = langContent[k];
                                const isComplex = typeof v === "object" && v !== null;
                                const str = stringifyValue(v);
                                const isLong = isComplex || str.length > 80 || str.includes("\n");

                                // Friendly editor for arrays of flat objects (stats, values, axes, team, activities, benefits, uses)
                                const isFlatObjectArray =
                                    Array.isArray(v) && v.length > 0 && v.every((item) => item && typeof item === "object" && !Array.isArray(item) && Object.values(item).every((val) => typeof val !== "object"));

                                if (isFlatObjectArray) {
                                    const itemKeys = Object.keys(v[0]);
                                    const updateItem = (idx, key, val) => {
                                        const next = v.map((it, i) => (i === idx ? { ...it, [key]: val } : it));
                                        updateField(k, JSON.stringify(next));
                                    };
                                    const addItem = () => {
                                        const blank = Object.fromEntries(itemKeys.map((kk) => [kk, ""]));
                                        updateField(k, JSON.stringify([...v, blank]));
                                    };
                                    const removeItem = (idx) => {
                                        updateField(k, JSON.stringify(v.filter((_, i) => i !== idx)));
                                    };
                                    return (
                                        <div key={k} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="text-xs font-display font-semibold text-gray-700 uppercase tracking-wider">{k}</label>
                                                <button type="button" onClick={addItem} className="text-xs px-2 py-1 rounded-md bg-brand-turquoise text-white" data-testid={`page-field-${k}-add`}>+ Ajouter</button>
                                            </div>
                                            <div className="space-y-2">
                                                {v.map((item, idx) => (
                                                    <div key={idx} className="bg-white rounded-lg p-3 border border-gray-100 flex items-start gap-2" data-testid={`page-field-${k}-item-${idx}`}>
                                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            {itemKeys.map((ik) => (
                                                                <label key={ik} className="block">
                                                                    <span className="block text-[10px] font-semibold text-gray-500 uppercase">{ik}</span>
                                                                    <input
                                                                        value={item[ik] ?? ""}
                                                                        onChange={(e) => updateItem(idx, ik, e.target.value)}
                                                                        className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                                                                        data-testid={`page-field-${k}-${idx}-${ik}`}
                                                                    />
                                                                </label>
                                                            ))}
                                                        </div>
                                                        <button type="button" onClick={() => removeItem(idx)} className="text-brand-red text-xs mt-4" data-testid={`page-field-${k}-remove-${idx}`}>✕</button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={k}>
                                        <label className="block text-xs font-display font-semibold text-gray-600 mb-1 uppercase tracking-wider">
                                            {k}
                                            {isComplex && <span className="ml-2 text-gray-400 normal-case">(structure JSON)</span>}
                                        </label>
                                        {/[_-]?(image|photo|picture|logo|cover|banner|hero|thumbnail)([_-]?url)?$/i.test(k) ? (
                                            <div className="space-y-2">
                                                <MediaPicker
                                                    value={typeof v === "string" ? v : ""}
                                                    onChange={(nv) => updateField(k, nv)}
                                                    accept="image/*"
                                                    testId={`page-field-${k}`}
                                                />
                                                {typeof v === "string" && v && (
                                                    <img src={v.startsWith("http") || v.startsWith("/api/") ? (v.startsWith("/api/") ? `${process.env.REACT_APP_BACKEND_URL}${v}` : v) : v} alt="" className="w-32 h-20 object-cover rounded-lg border border-gray-200" />
                                                )}
                                            </div>
                                        ) : isLong ? (
                                            <textarea
                                                value={str}
                                                onChange={(e) => updateField(k, e.target.value)}
                                                rows={isComplex ? 8 : 4}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                                                data-testid={`page-field-${k}`}
                                            />
                                        ) : (
                                            <input
                                                value={str}
                                                onChange={(e) => updateField(k, e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                data-testid={`page-field-${k}`}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                            {keys.length === 0 && <p className="text-gray-500 text-sm">Aucun champ. Passez en mode JSON pour ajouter des champs.</p>}
                        </div>
                    ) : (
                        <textarea
                            value={jsonText}
                            onChange={(e) => setJsonText(e.target.value)}
                            rows={24}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono"
                            data-testid="page-json-editor"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default PageEditor;
