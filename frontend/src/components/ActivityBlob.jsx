import React from "react";
import {
    Music2, Music3, Music4, Drum, Guitar, Drama, Shield, Flower2, ChefHat, CakeSlice, Sprout, Sparkles, Palette, Brush,
    BookOpen, PersonStanding, Landmark, Building, Building2, Home, Trees, Store, Package, PartyPopper, Tent, School,
    MapPin, Sofa, Lamp, Trash2, Lightbulb, Smile, Star, Sun, Bird, Search, Heart, HandHeart, Users, Globe, MessageCircle,
} from "lucide-react";

// Comprehensive icon map for all keys from the brand icon set
const ICONS = {
    // Activities
    music: Music2,
    musique: Music2,
    orchestre: Music3,
    percussions: Drum,
    cuivres: Music4,
    ukulele: Guitar,
    theater: Drama,
    theatre: Drama,
    judo: Shield,
    yoga: Flower2,
    cooking: ChefHat,
    cuisine: ChefHat,
    patisserie: CakeSlice,
    gardening: Sprout,
    jardinage: Sprout,
    arts_terre: Sparkles,
    dessin: Brush,
    lecture: BookOpen,
    danse: PersonStanding,
    architecture: Landmark,
    // Vie du quartier
    place_du_village: Trees,
    happy_market: Store,
    vide_grenier: Package,
    passage_art: Sparkles,
    mon_premier_festival: Tent,
    fete_de_quartier: PartyPopper,
    quartier: MapPin,
    ecole: School,
    jardin_partage: Sprout,
    square: Trees,
    maison: Home,
    immeubles: Building,
    arbre: Trees,
    banc: Sofa,
    lampadaire: Lamp,
    poubelle: Trash2,
    // Valeurs
    creativite: Lightbulb,
    joie: Smile,
    reves: Star,
    espoir: Sparkles,
    liberte: Bird,
    optimisme: Sun,
    curiosite: Search,
    gratitude: Heart,
    // Liens sociaux
    famille: Users,
    parents: Users,
    enfants: Smile,
    benevoles: HandHeart,
    solidarite: Heart,
    partage: HandHeart,
    dialogue: MessageCircle,
    transmission: HandHeart,
    eco_citoyennete: Globe,
};

const SHAPES = ["blob", "blob-2", "blob-3"];

export const ActivityBlob = ({ keyName, color = "#39B8B2", size = 100, idx = 0, className = "" }) => {
    const Icon = ICONS[keyName] || Music2;
    const shape = SHAPES[idx % SHAPES.length];
    return (
        <div
            className={`relative inline-flex items-center justify-center ${shape} ${className}`}
            style={{ width: size, height: size, backgroundColor: color }}
            data-testid={`activity-blob-${keyName}`}
        >
            <Icon size={size * 0.46} strokeWidth={2.2} className="text-white drop-shadow" />
        </div>
    );
};

export default ActivityBlob;
