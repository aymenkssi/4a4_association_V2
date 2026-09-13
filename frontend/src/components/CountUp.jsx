import React, { useEffect, useRef, useState } from "react";

// Animated counter that triggers when scrolled into view
const CountUp = ({ value, duration = 1800, className = "", style }) => {
    const ref = useRef(null);
    const [display, setDisplay] = useState("0");
    const startedRef = useRef(false);

    // Parse "86", "20+", "1.2k", "100%"...
    const parsed = React.useMemo(() => {
        const str = String(value || "");
        const match = str.match(/(-?\d+[\d.,]*)/);
        if (!match) return { prefix: str, num: null, suffix: "" };
        const numStr = match[1].replace(",", ".");
        const num = parseFloat(numStr);
        if (isNaN(num)) return { prefix: str, num: null, suffix: "" };
        const idx = str.indexOf(match[1]);
        return {
            prefix: str.slice(0, idx),
            num,
            suffix: str.slice(idx + match[1].length),
            decimals: (numStr.split(".")[1] || "").length,
        };
    }, [value]);

    useEffect(() => {
        if (parsed.num === null) {
            setDisplay(String(value || ""));
            return;
        }
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !startedRef.current) {
                        startedRef.current = true;
                        const start = performance.now();
                        const animate = (now) => {
                            const t = Math.min((now - start) / duration, 1);
                            // ease-out cubic
                            const eased = 1 - Math.pow(1 - t, 3);
                            const current = parsed.num * eased;
                            const formatted = parsed.decimals > 0 ? current.toFixed(parsed.decimals) : Math.round(current).toString();
                            setDisplay(`${parsed.prefix}${formatted}${parsed.suffix}`);
                            if (t < 1) requestAnimationFrame(animate);
                        };
                        requestAnimationFrame(animate);
                    }
                });
            },
            { threshold: 0.25 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [parsed, duration, value]);

    return (
        <span ref={ref} className={className} style={style} data-testid="count-up">
            {display}
        </span>
    );
};

export default CountUp;
