import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Cookie } from "lucide-react";
import { useApp } from "../context/AppContext";

const CookieConsent = () => {
    const { lang } = useApp();
    const [visible, setVisible] = useState(() => !localStorage.getItem("cookie_consent"));
    const fr = lang === "fr";

    if (!visible) return null;

    const decide = (choice) => {
        localStorage.setItem("cookie_consent", choice);
        window.dispatchEvent(new Event("cookie-consent-changed"));
        setVisible(false);
    };

    return (
        <div className="fixed bottom-4 inset-x-4 sm:left-auto sm:right-6 sm:max-w-md z-[60] animate-in fade-in slide-in-from-bottom-4 duration-500" data-testid="cookie-consent">
            <div className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-2xl p-5">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-turquoise/10 flex items-center justify-center flex-shrink-0">
                        <Cookie size={20} className="text-brand-turquoise" />
                    </div>
                    <div>
                        <h3 className="font-display font-bold text-brand-dark mb-1">{fr ? "Respect de votre vie privée" : "Your privacy matters"}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {fr
                                ? "Nous utilisons des mesures d'audience anonymes pour améliorer le site. Aucune donnée personnelle n'est revendue. "
                                : "We use anonymous audience measurement to improve the site. No personal data is ever sold. "}
                            <Link to="/confidentialite" className="text-brand-turquoise font-semibold hover:underline" data-testid="cookie-privacy-link">
                                {fr ? "En savoir plus" : "Learn more"}
                            </Link>
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 mt-4">
                    <button onClick={() => decide("refused")} className="flex-1 px-4 py-2 rounded-full border border-gray-200 text-gray-600 font-display font-semibold text-sm hover:bg-gray-50 transition-colors" data-testid="cookie-refuse">
                        {fr ? "Refuser" : "Decline"}
                    </button>
                    <button onClick={() => decide("accepted")} className="flex-1 px-4 py-2 rounded-full bg-brand-turquoise text-white font-display font-semibold text-sm hover:opacity-90 transition-opacity" data-testid="cookie-accept">
                        {fr ? "Accepter" : "Accept"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieConsent;
