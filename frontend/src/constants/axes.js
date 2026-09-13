// Palette des "Nos quatre axes" — même ordre/couleurs que la page Nos actions.
export const AXIS_COLORS = ["#39B8B2", "#E6DD08", "#B63CCC", "#D91012"];

// Construit une map { titre_axe: couleur } à partir de la liste d'axes (dans l'ordre).
export const buildAxisColorMap = (axes = []) => {
    const map = {};
    axes.forEach((ax, i) => {
        const title = typeof ax === "string" ? ax : ax?.title;
        if (title) map[title] = AXIS_COLORS[i % AXIS_COLORS.length];
    });
    return map;
};

// Retourne la couleur d'une catégorie, avec fallback neutre.
export const axisColor = (map, category) => (category && map[category]) || "#9CA3AF";
