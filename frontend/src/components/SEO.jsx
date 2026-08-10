import React from "react";
import { Helmet } from "react-helmet-async";
import { useApp } from "../context/AppContext";

const SEO = ({ title, description, image, type = "website" }) => {
    const { lang, settings } = useApp();
    const siteTitle = settings?.[`site_title_${lang}`] || "4à4 dix-huit";
    const fullTitle = title ? `${title} — ${siteTitle}` : siteTitle;
    const desc = description || settings?.[`meta_description_${lang}`] || "";
    const url = settings?.site_url || "";
    const img = image || (settings?.logo_url?.startsWith("http") ? settings.logo_url : url + (settings?.logo_url || "/logo.png"));

    return (
        <Helmet>
            <html lang={lang} />
            <title>{fullTitle}</title>
            <meta name="description" content={desc} />
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={desc} />
            {img && <meta property="og:image" content={img} />}
            {url && <meta property="og:url" content={url} />}
            <meta property="og:site_name" content={siteTitle} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={desc} />
            {img && <meta name="twitter:image" content={img} />}
        </Helmet>
    );
};

export default SEO;
