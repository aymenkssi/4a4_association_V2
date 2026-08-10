import React, { useEffect, useRef, useState } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";

const MediaPicker = ({ value, onChange, accept = "image/*", testId = "media-picker" }) => {
    const fileRef = useRef();
    const [uploading, setUploading] = useState(false);

    const handleFile = async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", f);
            const r = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
            onChange(r.data.url);
            toast.success("Fichier téléversé");
        } catch (err) {
            toast.error("Échec du téléversement");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    return (
        <div className="space-y-2">
            <input type="text" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="URL externe ou téléverser ci-dessous" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" data-testid={`${testId}-url`} />
            <div className="flex gap-2">
                <input type="file" ref={fileRef} accept={accept} onChange={handleFile} className="hidden" />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-60" data-testid={`${testId}-upload`}>
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {uploading ? "Téléversement…" : "Téléverser un fichier"}
                </button>
                {value && <a href={value.startsWith("http") ? value : `${process.env.REACT_APP_BACKEND_URL}${value}`} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-turquoise self-center">Aperçu</a>}
            </div>
        </div>
    );
};

export default MediaPicker;
