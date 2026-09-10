from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import hashlib
import logging
import asyncio
from html import escape
import bcrypt
import jwt
import requests
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, UploadFile, File, Form, Query, Header, BackgroundTasks
from fastapi.responses import Response as FastResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict

# ---------------- Config ----------------
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ['JWT_SECRET']
ADMIN_EMAIL = os.environ['ADMIN_EMAIL']
ADMIN_PASSWORD = os.environ['ADMIN_PASSWORD']
APP_NAME = os.environ.get('APP_NAME', '4a4dixhuit')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
CONTACT_EMAIL = os.environ.get('CONTACT_EMAIL', 'contact@4a4dixhuit.org')

JWT_ALGO = "HS256"
# Local on-disk storage (replaces the old Emergent object-store integration).
# UPLOAD_DIR should be a Docker volume mount so files persist across rebuilds.
UPLOAD_DIR = Path(os.environ.get('UPLOAD_DIR', '/app/uploads'))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="4a4dixhuit API")
api = APIRouter(prefix="/api")

# ---------------- Helpers ----------------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(hours=12), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

async def get_current_user(authorization: str = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(current: dict = Depends(get_current_user)) -> dict:
    if current.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé à l'administration")
    return current

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

# ---------------- Storage (local disk) ----------------
def _safe_local_path(path: str) -> Path:
    """Resolve `path` under UPLOAD_DIR and reject any attempt to escape it
    (e.g. via '..' segments)."""
    candidate = (UPLOAD_DIR / path).resolve()
    if UPLOAD_DIR.resolve() not in candidate.parents and candidate != UPLOAD_DIR.resolve():
        raise HTTPException(status_code=400, detail="Invalid file path")
    return candidate

def put_object(path: str, data: bytes, content_type: str) -> dict:
    dest = _safe_local_path(path)
    dest.parent.mkdir(parents=True, exist_ok=True)
    try:
        dest.write_bytes(data)
    except OSError as e:
        logger.error(f"Local storage write failed: {e}")
        raise HTTPException(status_code=500, detail="Storage not available")
    return {"path": path, "size": len(data)}

def get_object(path: str):
    src = _safe_local_path(path)
    if not src.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    try:
        data = src.read_bytes()
    except OSError as e:
        logger.error(f"Local storage read failed: {e}")
        raise HTTPException(status_code=500, detail="Storage not available")
    return data, "application/octet-stream"

# ---------------- Email ----------------
def send_email_sync(to: str, subject: str, html: str) -> dict:
    if not RESEND_API_KEY:
        logger.info(f"Email skipped (no key). To: {to}, Subject: {subject}")
        return {"sent": False, "reason": "no_api_key"}
    try:
        r = requests.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
            json={"from": SENDER_EMAIL, "to": [to], "subject": subject, "html": html},
            timeout=15,
        )
        if r.status_code >= 400:
            logger.error(f"Resend error {r.status_code}: {r.text}")
            return {"sent": False, "status": r.status_code, "error": r.text}
        return {"sent": True, "id": r.json().get("id")}
    except Exception as e:
        logger.error(f"Email send failed: {e}")
        return {"sent": False, "error": str(e)}

# ---------------- Models ----------------
class LoginIn(BaseModel):
    email: EmailStr
    password: str

class LoginOut(BaseModel):
    token: str
    user: Dict[str, Any]

class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str

class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    phone: str = ""
    password: str
    rgpd_consent: bool = False

# Pages: rich content per page, bilingual
class PageContent(BaseModel):
    fr: Dict[str, Any] = Field(default_factory=dict)
    en: Dict[str, Any] = Field(default_factory=dict)

class PageOut(BaseModel):
    slug: str
    content: PageContent
    updated_at: Optional[str] = None

class PageUpdateIn(BaseModel):
    content: PageContent

# Events
class EventIn(BaseModel):
    title_fr: str
    title_en: str
    description_fr: str = ""
    description_en: str = ""
    date: str  # ISO
    location: str = ""
    image_url: str = ""
    capacity: int = 0  # 0 = illimité
    published: bool = True

class EventOut(EventIn):
    id: str
    created_at: str

# News
class NewsIn(BaseModel):
    title_fr: str
    title_en: str
    excerpt_fr: str = ""
    excerpt_en: str = ""
    body_fr: str = ""
    body_en: str = ""
    image_url: str = ""
    published: bool = True

class NewsOut(NewsIn):
    id: str
    created_at: str

# Gallery
class GalleryItemIn(BaseModel):
    title_fr: str = ""
    title_en: str = ""
    media_type: str = "image"  # image|video
    media_url: str  # external url OR /api/files/{path}
    storage_path: Optional[str] = None
    category: str = "general"

class GalleryItemOut(GalleryItemIn):
    id: str
    created_at: str

# Members signup
class MemberIn(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str = ""
    address: str = ""
    interests: List[str] = []
    message: str = ""

class MemberOut(MemberIn):
    id: str
    created_at: str
    status: str = "pending"

# Contact messages
class ContactIn(BaseModel):
    name: str
    email: EmailStr
    subject: str = ""
    message: str

class ContactOut(ContactIn):
    id: str
    created_at: str
    read: bool = False

# Settings
class SettingsModel(BaseModel):
    helloasso_url: str = "https://www.helloasso.com/"
    contact_email: str = "contact@4a4dixhuit.org"
    contact_phone: str = "06 86 71 54 65"
    address: str = "14 rue du Simplon, 75018 Paris"
    facebook_url: str = "https://www.facebook.com/quatre.aquatre.5"
    instagram_url: str = "https://www.instagram.com/4a4dixhuit/"
    twitter_url: str = ""
    linkedin_url: str = ""
    youtube_url: str = ""
    tiktok_url: str = ""
    whatsapp_url: str = ""
    social_bar_position: str = "right"  # "right" | "left" | "hidden"
    site_title_fr: str = "4à4 dix-huit"
    site_title_en: str = "4à4 dix-huit"
    logo_url: str = "/logo.png"
    site_url: str = "https://4a4dixhuit.org"
    meta_description_fr: str = "4à4 dix-huit — Association de quartier Amiraux Simplon Championnet Poissonniers, Paris 18e. Musique, jardinage, cuisine, yoga, judo, théâtre."
    meta_description_en: str = "4à4 dix-huit — Neighborhood association in Paris 18th: music, gardening, cooking, yoga, judo, theater. Together, let's create bonds."

# ---------------- Default content ----------------
DEFAULT_PAGES: Dict[str, PageContent] = {
    "home": PageContent(
        fr={
            "hero_title": "Au cœur du quartier",
            "hero_subtitle": "Ensemble, créons du lien, partageons, transmettons !",
            "hero_description": "Depuis 2005, l'association 4à4 dix-huit fait grandir le quartier Amiraux–Simplon–Championnet–Poissonniers à travers la culture, l'éducation et la solidarité.",
            "hero_image": "https://images.pexels.com/photos/21530046/pexels-photo-21530046.jpeg",
            "cta_primary": "Devenir membre",
            "cta_action": "Faire un don",
            "intro_title": "Une association vivante depuis 2005",
            "intro_text": "Nous réduisons les inégalités d'accès à la culture, accompagnons les jeunes dans leur réussite scolaire et tissons des liens forts entre écoles, familles et habitants du 18e arrondissement de Paris.",
            "stats": [
                {"value": "86", "label": "enfants accompagnés"},
                {"value": "5", "label": "écoles partenaires"},
                {"value": "20+", "label": "années d'engagement"},
                {"value": "6", "label": "activités phares"},
            ],
            "missions_title": "Nos missions",
            "missions": [
                {"text": "Réduire les inégalités d'accès à la culture et à l'art pour améliorer la réussite scolaire."},
                {"text": "Lisibilité de l'école — favoriser l'ouverture des écoles sur le quartier."},
                {"text": "Faciliter l'accès et le lien avec les familles."},
            ],
            "actions_title": "Nos actions",
            "actions_lead": "au cœur du quartier",
            "activities": [
                {"key": "music", "title": "Musique", "text": "Orchestre à l'école, ateliers musicaux, éveil musical pour les plus jeunes.", "color": "#39B8B2"},
                {"key": "gardening", "title": "Jardinage", "text": "Jardins partagés, compostage et ateliers écocitoyens.", "color": "#E6DD08"},
                {"key": "cooking", "title": "Cuisine", "text": "Ateliers cuisine en famille et repas conviviaux.", "color": "#D91012"},
                {"key": "yoga", "title": "Yoga", "text": "Cours de yoga pour adultes, bien-être et sérénité.", "color": "#B63CCC"},
                {"key": "judo", "title": "Judo", "text": "Baby judo pour les enfants, confiance et respect.", "color": "#39B8B2"},
                {"key": "theater", "title": "Théâtre", "text": "Ateliers théâtre, expression et création collective.", "color": "#E6DD08"},
            ],
        },
        en={
            "hero_title": "At the heart of the neighborhood",
            "hero_subtitle": "Together, let's create bonds, share, transmit!",
            "hero_description": "Since 2005, the 4à4 dix-huit association has been growing the Amiraux–Simplon–Championnet–Poissonniers neighborhood through culture, education and solidarity.",
            "hero_image": "https://images.pexels.com/photos/21530046/pexels-photo-21530046.jpeg",
            "cta_primary": "Become a member",
            "cta_action": "Make a donation",
            "intro_title": "An active association since 2005",
            "intro_text": "We reduce inequalities in access to culture, support young people in their academic success, and build strong bonds between schools, families and residents of Paris' 18th arrondissement.",
            "stats": [
                {"value": "86", "label": "children supported"},
                {"value": "5", "label": "partner schools"},
                {"value": "20+", "label": "years of commitment"},
                {"value": "6", "label": "flagship activities"},
            ],
            "missions_title": "Our missions",
            "missions": [
                {"text": "Reduce inequalities in access to culture and art to improve academic success."},
                {"text": "School visibility — opening schools up to the neighborhood."},
                {"text": "Making access and connection with families easier."},
            ],
            "actions_title": "Our actions",
            "actions_lead": "at the heart of the neighborhood",
            "activities": [
                {"key": "music", "title": "Music", "text": "School orchestra, musical workshops, musical awakening for the youngest.", "color": "#39B8B2"},
                {"key": "gardening", "title": "Gardening", "text": "Shared gardens, composting and eco-citizen workshops.", "color": "#E6DD08"},
                {"key": "cooking", "title": "Cooking", "text": "Family cooking workshops and friendly meals.", "color": "#D91012"},
                {"key": "yoga", "title": "Yoga", "text": "Yoga classes for adults, wellbeing and serenity.", "color": "#B63CCC"},
                {"key": "judo", "title": "Judo", "text": "Baby judo for children, confidence and respect.", "color": "#39B8B2"},
                {"key": "theater", "title": "Theater", "text": "Theater workshops, expression and collective creation.", "color": "#E6DD08"},
            ],
        },
    ),
    "about": PageContent(
        fr={
            "title": "À propos de l'association",
            "lead": "4à4 dix-huit — Amiraux Simplon Championnet Poissonniers",
            "history_title": "Notre histoire",
            "history": "Créée en juillet 2005, l'association 4à4 dix-huit réunit au départ des équipes éducatives, des parents d'élèves et des habitants du quartier Amiraux/Simplon/Poissonniers (Paris 18e). Près de vingt ans plus tard, elle est la plus ancienne association encore active sur le territoire. Affiliée à la Fédération Léo Lagrange (agrément multisports n°75 S 258), elle agit pour réduire les inégalités d'accès à la culture, combattre le décrochage scolaire et favoriser la mixité sociale.",
            "mission_title": "Notre mission",
            "mission": "Faire du quartier un espace culturel vivant, inclusif et solidaire, où chaque enfant et chaque famille peut trouver sa place, développer ses talents, apprendre, créer et participer à la vie collective.",
            "values_title": "Nos valeurs",
            "values": [
                {"title": "Éducation pour tous", "text": "Garantir à chaque enfant un accès réel à des pratiques culturelles, artistiques, sportives et citoyennes de qualité."},
                {"title": "Culture émancipatrice", "text": "Les pratiques artistiques renforcent la confiance en soi et donnent du sens aux apprentissages."},
                {"title": "Alliances éducatives", "text": "Un espace de coopération entre équipes pédagogiques, familles, habitants, associations et services municipaux."},
                {"title": "Co-construction", "text": "Les projets sont conçus avec les jeunes, les familles et les partenaires du territoire."},
            ],
            "team_title": "L'équipe",
            "team": [
                {"name": "Catherine Névannen", "role": "Présidente"},
                {"name": "Joel Coezy", "role": "Trésorier"},
            ],
            "core_values_title": "Ce qui nous anime",
            "core_values": [
                {"key": "creativite", "title": "Créativité", "text": "Encourager l'imagination et l'expression artistique de chacun.", "color": "#E6DD08"},
                {"key": "joie", "title": "Joie", "text": "Cultiver le plaisir d'apprendre et de partager ensemble.", "color": "#39B8B2"},
                {"key": "reves", "title": "Rêves", "text": "Aider chaque enfant à oser rêver et bâtir son avenir.", "color": "#B63CCC"},
                {"key": "espoir", "title": "Espoir", "text": "Porter une vision positive de notre quartier et de ses habitants.", "color": "#39B8B2"},
                {"key": "liberte", "title": "Liberté", "text": "Offrir un espace d'expression sans jugement.", "color": "#E6DD08"},
                {"key": "optimisme", "title": "Optimisme", "text": "Croire en la force du collectif pour transformer le quotidien.", "color": "#D91012"},
                {"key": "curiosite", "title": "Curiosité", "text": "Éveiller l'envie de découvrir, d'apprendre et de questionner.", "color": "#B63CCC"},
                {"key": "gratitude", "title": "Gratitude", "text": "Reconnaître et célébrer ce qui nous unit.", "color": "#D91012"},
            ],
        },
        en={
            "title": "About the association",
            "lead": "4à4 dix-huit — Amiraux Simplon Championnet Poissonniers",
            "history_title": "Our history",
            "history": "Founded in July 2005, the 4à4 dix-huit association brings together educational teams, parents and residents of the Amiraux/Simplon/Poissonniers neighborhood (Paris 18th). Nearly twenty years later, it is the oldest association still active in the area. Affiliated with the Léo Lagrange Federation, it works to reduce inequalities in access to culture, combat school dropout and promote social diversity.",
            "mission_title": "Our mission",
            "mission": "Make the neighborhood a living, inclusive and solidary cultural space, where every child and family can find their place, develop their talents, learn, create and participate in collective life.",
            "values_title": "Our values",
            "values": [
                {"title": "Education for all", "text": "Guarantee every child real access to quality cultural, artistic, sports and civic practices."},
                {"title": "Emancipating culture", "text": "Artistic practices strengthen self-confidence and give meaning to learning."},
                {"title": "Educational alliances", "text": "A space for cooperation between teaching teams, families, residents, associations and municipal services."},
                {"title": "Co-construction", "text": "Projects are designed with young people, families and territory partners."},
            ],
            "team_title": "The team",
            "team": [
                {"name": "Catherine Névannen", "role": "President"},
                {"name": "Joel Coezy", "role": "Treasurer"},
            ],
            "core_values_title": "What drives us",
            "core_values": [
                {"key": "creativite", "title": "Creativity", "text": "Encourage everyone's imagination and artistic expression.", "color": "#E6DD08"},
                {"key": "joie", "title": "Joy", "text": "Cultivate the pleasure of learning and sharing together.", "color": "#39B8B2"},
                {"key": "reves", "title": "Dreams", "text": "Help every child dare to dream and build their future.", "color": "#B63CCC"},
                {"key": "espoir", "title": "Hope", "text": "Carry a positive vision of our neighborhood and its people.", "color": "#39B8B2"},
                {"key": "liberte", "title": "Freedom", "text": "Offer a space for expression without judgment.", "color": "#E6DD08"},
                {"key": "optimisme", "title": "Optimism", "text": "Believe in the power of the collective to transform daily life.", "color": "#D91012"},
                {"key": "curiosite", "title": "Curiosity", "text": "Awaken the desire to discover, learn and question.", "color": "#B63CCC"},
                {"key": "gratitude", "title": "Gratitude", "text": "Recognize and celebrate what unites us.", "color": "#D91012"},
            ],
        },
    ),
    "actions": PageContent(
        fr={
            "title": "Nos actions",
            "lead": "Au cœur du quartier",
            "intro": "Chaque activité contribue à l'épanouissement des enfants, des familles et des habitants. Ensemble, nous faisons grandir le quartier !",
            "activities": [
                {"key": "music", "title": "Musique", "text": "Orchestre à l'école, ateliers musicaux, éveil musical pour les plus jeunes.", "color": "#39B8B2"},
                {"key": "gardening", "title": "Jardinage", "text": "Jardins partagés, compostage et ateliers écocitoyens.", "color": "#E6DD08"},
                {"key": "cooking", "title": "Cuisine", "text": "Ateliers cuisine en famille et repas conviviaux.", "color": "#D91012"},
                {"key": "yoga", "title": "Yoga", "text": "Cours de yoga pour adultes, bien-être et sérénité.", "color": "#B63CCC"},
                {"key": "judo", "title": "Judo", "text": "Baby judo pour les enfants, confiance et respect.", "color": "#39B8B2"},
                {"key": "theater", "title": "Théâtre", "text": "Ateliers théâtre, expression et création collective.", "color": "#E6DD08"},
            ],
            "axes_title": "Nos quatre axes",
            "axes": [
                {"title": "Activités jeunesse", "text": "Périscolaire et scolaire : musique, danse latino, judo, théâtre, arts de la terre, orchestre à l'école."},
                {"title": "Actions familiales", "text": "Place du Village : couture, cuisine, jardinage, yoga famille, ateliers parents-enfants."},
                {"title": "Événements de quartier", "text": "Vide-greniers, Happy Market, Passage à l'Art, Mon Premier Festival."},
                {"title": "Soutien à la parentalité", "text": "Papothèques interculturelles et espaces de rencontre pour parents."},
            ],
            "neighborhood_title": "Vie du quartier",
            "neighborhood_subtitle": "Des rendez-vous qui animent le 18e",
            "neighborhood_events": [
                {"key": "place_du_village", "title": "Place du Village", "text": "Espace d'accueil et d'ateliers familiaux : couture, cuisine, jardinage, yoga.", "color": "#39B8B2"},
                {"key": "happy_market", "title": "Happy Market", "text": "Marché solidaire et créatif animé par les habitants.", "color": "#E6DD08"},
                {"key": "vide_grenier", "title": "Vide-grenier", "text": "Brocante de quartier pour donner une seconde vie aux objets.", "color": "#D91012"},
                {"key": "passage_art", "title": "Passage à l'Art", "text": "Parcours d'art éphémère dans les rues du quartier.", "color": "#B63CCC"},
                {"key": "mon_premier_festival", "title": "Mon Premier Festival", "text": "Festival jeune public en partenariat avec la Ville de Paris.", "color": "#E6DD08"},
                {"key": "fete_de_quartier", "title": "Fête de quartier", "text": "Le grand rendez-vous annuel, musiques et stands gourmands.", "color": "#39B8B2"},
            ],
        },
        en={
            "title": "Our actions",
            "lead": "At the heart of the neighborhood",
            "intro": "Each activity contributes to the growth of children, families and residents. Together, we make the neighborhood grow!",
            "activities": [
                {"key": "music", "title": "Music", "text": "School orchestra, musical workshops, musical awakening for the youngest.", "color": "#39B8B2"},
                {"key": "gardening", "title": "Gardening", "text": "Shared gardens, composting and eco-citizen workshops.", "color": "#E6DD08"},
                {"key": "cooking", "title": "Cooking", "text": "Family cooking workshops and friendly meals.", "color": "#D91012"},
                {"key": "yoga", "title": "Yoga", "text": "Yoga classes for adults, wellbeing and serenity.", "color": "#B63CCC"},
                {"key": "judo", "title": "Judo", "text": "Baby judo for children, confidence and respect.", "color": "#39B8B2"},
                {"key": "theater", "title": "Theater", "text": "Theater workshops, expression and collective creation.", "color": "#E6DD08"},
            ],
            "axes_title": "Our four axes",
            "axes": [
                {"title": "Youth activities", "text": "After-school and school programs: music, Latin dance, judo, theater, earth arts, school orchestra."},
                {"title": "Family actions", "text": "Place du Village: sewing, cooking, gardening, family yoga, parent-child workshops."},
                {"title": "Neighborhood events", "text": "Garage sales, Happy Market, Passage à l'Art, Mon Premier Festival."},
                {"title": "Parenting support", "text": "Intercultural 'papothèques' and meeting spaces for parents."},
            ],
            "neighborhood_title": "Neighborhood life",
            "neighborhood_subtitle": "Recurring gatherings that bring the 18th alive",
            "neighborhood_events": [
                {"key": "place_du_village", "title": "Place du Village", "text": "A drop-in space for family workshops: sewing, cooking, gardening, yoga.", "color": "#39B8B2"},
                {"key": "happy_market", "title": "Happy Market", "text": "A solidary creative market run by local residents.", "color": "#E6DD08"},
                {"key": "vide_grenier", "title": "Garage sale", "text": "Neighborhood flea market to give items a second life.", "color": "#D91012"},
                {"key": "passage_art", "title": "Passage à l'Art", "text": "An ephemeral art walk through the streets of the neighborhood.", "color": "#B63CCC"},
                {"key": "mon_premier_festival", "title": "Mon Premier Festival", "text": "A kids' film festival in partnership with the City of Paris.", "color": "#E6DD08"},
                {"key": "fete_de_quartier", "title": "Neighborhood party", "text": "The annual highlight — live music and food stands.", "color": "#39B8B2"},
            ],
        },
    ),
    "member": PageContent(
        fr={
            "title": "Devenir membre",
            "lead": "Rejoignez l'aventure du quartier",
            "intro": "Adhérer à 4à4 dix-huit, c'est soutenir l'éducation pour tous, participer à des ateliers et événements, et tisser des liens avec votre quartier. Remplissez le formulaire ci-dessous et nous reviendrons vers vous rapidement.",
            "benefits": [
                "Accès aux ateliers et activités à tarifs sociaux",
                "Participation aux événements de quartier",
                "Soutien à des projets éducatifs et culturels",
                "Faire partie d'une communauté solidaire",
            ],
        },
        en={
            "title": "Become a member",
            "lead": "Join the neighborhood adventure",
            "intro": "Joining 4à4 dix-huit means supporting education for all, taking part in workshops and events, and building bonds with your neighborhood. Fill out the form below and we will get back to you soon.",
            "benefits": [
                "Access to workshops and activities at social rates",
                "Participation in neighborhood events",
                "Support for educational and cultural projects",
                "Being part of a solidary community",
            ],
        },
    ),
    "donate": PageContent(
        fr={
            "title": "Faire un don",
            "lead": "Soutenez l'éducation pour tous",
            "intro": "Votre don nous permet de poursuivre nos actions culturelles, artistiques et solidaires auprès des enfants et des familles du quartier. Vous pouvez faire un don sécurisé via la plateforme HelloAsso.",
            "tax_info": "Votre don ouvre droit à une réduction d'impôt de 66% (dans la limite de 20% du revenu imposable).",
            "uses": [
                "Financer les ateliers culturels et artistiques",
                "Soutenir l'orchestre à l'école",
                "Organiser les événements de quartier",
                "Acheter du matériel pédagogique",
            ],
        },
        en={
            "title": "Make a donation",
            "lead": "Support education for all",
            "intro": "Your donation allows us to continue our cultural, artistic and solidary actions for the neighborhood's children and families. You can make a secure donation via the HelloAsso platform.",
            "tax_info": "Your donation is tax-deductible (66% in France, up to 20% of taxable income).",
            "uses": [
                "Fund cultural and artistic workshops",
                "Support the school orchestra",
                "Organize neighborhood events",
                "Purchase educational materials",
            ],
        },
    ),
    "contact": PageContent(
        fr={
            "title": "Contact",
            "lead": "Une question ? Écrivez-nous !",
            "intro": "Nous serons ravis d'échanger avec vous. Remplissez le formulaire ou contactez-nous directement.",
        },
        en={
            "title": "Contact",
            "lead": "A question? Write to us!",
            "intro": "We'll be happy to talk with you. Fill out the form or contact us directly.",
        },
    ),
    "legal": PageContent(
        fr={
            "title": "Mentions légales",
            "body": "Éditeur du site : Association 4à4 dix-huit, association loi 1901.\nSiège social : 14 rue du Simplon, 75018 Paris.\nTéléphone : 06 86 71 54 65.\nEmail : contact@4a4dixhuit.org.\nDirectrice de la publication : Catherine Névannen, présidente.\nHébergement : Emergent.\nLe site est affilié à la Fédération Léo Lagrange (agrément multisports n°75 S 258 du 13 avril 1982).\n\nPropriété intellectuelle : l'ensemble des contenus (textes, images, logos) est protégé par le droit d'auteur. Toute reproduction est interdite sans autorisation préalable.",
        },
        en={
            "title": "Legal notice",
            "body": "Site publisher: Association 4à4 dix-huit, French association under the 1901 law.\nHeadquarters: 14 rue du Simplon, 75018 Paris.\nPhone: 06 86 71 54 65.\nEmail: contact@4a4dixhuit.org.\nPublication Director: Catherine Névannen, President.\nHosting: Emergent.\n\nIntellectual property: All content (text, images, logos) is protected by copyright. Any reproduction is prohibited without prior authorization.",
        },
    ),
    "privacy": PageContent(
        fr={
            "title": "Politique de confidentialité",
            "body": "Nous accordons une grande importance à la protection de vos données personnelles, conformément au Règlement Général sur la Protection des Données (RGPD).\n\nDonnées collectées : nom, prénom, email, téléphone, adresse (uniquement lors d'une adhésion ou d'un contact). Ces données sont utilisées exclusivement pour gérer votre relation avec l'association.\n\nDurée de conservation : 3 ans après votre dernier contact.\n\nVos droits : accès, rectification, suppression, opposition. Pour exercer vos droits, écrivez à contact@4a4dixhuit.org.\n\nCookies : ce site n'utilise pas de cookies de suivi.",
        },
        en={
            "title": "Privacy policy",
            "body": "We attach great importance to the protection of your personal data, in accordance with the General Data Protection Regulation (GDPR).\n\nData collected: last name, first name, email, phone, address (only during membership or contact). This data is used exclusively to manage your relationship with the association.\n\nRetention period: 3 years after your last contact.\n\nYour rights: access, rectification, deletion, opposition. To exercise your rights, write to contact@4a4dixhuit.org.\n\nCookies: this site does not use tracking cookies.",
        },
    ),
}

# ---------------- Startup ----------------
@app.on_event("startup")
async def startup():
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.pages.create_index("slug", unique=True)
    await db.events.create_index("date")
    await db.news.create_index("created_at")
    await db.gallery.create_index("created_at")
    await db.members.create_index("created_at")
    await db.messages.create_index("created_at")
    await db.visits.create_index("created_at")
    await db.visits.create_index("visitor_hash")
    await db.ip_geo.create_index("ip", unique=True)
    await db.login_attempts.create_index("identifier", unique=True)
    await db.event_registrations.create_index([("event_id", 1), ("user_id", 1)], unique=True)

    # Seed admin (atomic upsert to avoid DuplicateKeyError race when
    # multiple worker processes run this startup hook concurrently)
    seed_result = await db.users.update_one(
        {"email": ADMIN_EMAIL.lower()},
        {
            "$setOnInsert": {
                "id": str(uuid.uuid4()),
                "email": ADMIN_EMAIL.lower(),
                "password_hash": hash_password(ADMIN_PASSWORD),
                "name": "Admin",
                "role": "admin",
                "created_at": now_iso(),
            }
        },
        upsert=True,
    )
    if seed_result.upserted_id:
        logger.info(f"Admin seeded: {ADMIN_EMAIL}")
    else:
        existing = await db.users.find_one({"email": ADMIN_EMAIL.lower()})
        if existing and not verify_password(ADMIN_PASSWORD, existing["password_hash"]):
            await db.users.update_one(
                {"email": ADMIN_EMAIL.lower()},
                {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}},
            )
            logger.info("Admin password updated from env")

    # Seed pages
    for slug, content in DEFAULT_PAGES.items():
        existing_page = await db.pages.find_one({"slug": slug})
        if not existing_page:
            await db.pages.insert_one({
                "slug": slug,
                "content": content.model_dump(),
                "updated_at": now_iso(),
            })
        else:
            # Add any missing keys from defaults (forward-compat for new fields)
            existing_content = existing_page.get("content", {})
            default_content = content.model_dump()
            updated = False
            for lang in ("fr", "en"):
                for k, v in default_content.get(lang, {}).items():
                    if k not in existing_content.get(lang, {}):
                        existing_content.setdefault(lang, {})[k] = v
                        updated = True
            if updated:
                await db.pages.update_one({"slug": slug}, {"$set": {"content": existing_content, "updated_at": now_iso()}})
    # Seed settings
    s = await db.settings.find_one({"_id": "global"})
    if not s:
        await db.settings.insert_one({"_id": "global", **SettingsModel().model_dump()})

    logger.info(f"Local storage ready at {UPLOAD_DIR}")

@app.on_event("shutdown")
async def shutdown():
    client.close()

# ---------------- Auth Routes ----------------
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

@api.post("/auth/login", response_model=LoginOut)
async def login(data: LoginIn, request: Request):
    identifier = f"{_client_ip(request)}:{data.email.lower()}"
    now = datetime.now(timezone.utc)
    rec = await db.login_attempts.find_one({"identifier": identifier})
    if rec and rec.get("locked_until") and datetime.fromisoformat(rec["locked_until"]) > now:
        raise HTTPException(status_code=429, detail="Trop de tentatives. Réessayez dans quelques minutes.")

    user = await db.users.find_one({"email": data.email.lower()})
    if not user or not verify_password(data.password, user["password_hash"]):
        attempts = (rec.get("count", 0) if rec else 0) + 1
        update = {"identifier": identifier, "count": attempts, "updated_at": now.isoformat()}
        if attempts >= MAX_LOGIN_ATTEMPTS:
            update["locked_until"] = (now + timedelta(minutes=LOCKOUT_MINUTES)).isoformat()
        await db.login_attempts.update_one({"identifier": identifier}, {"$set": update}, upsert=True)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await db.login_attempts.delete_one({"identifier": identifier})
    token = create_access_token(user["id"], user["email"])
    return LoginOut(token=token, user={"id": user["id"], "email": user["email"], "name": user.get("name", ""), "role": user.get("role", "user")})

@api.post("/auth/register", response_model=LoginOut)
async def register(data: RegisterIn, background: BackgroundTasks):
    if not data.rgpd_consent:
        raise HTTPException(status_code=400, detail="Vous devez accepter la politique de confidentialité (RGPD).")
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins 6 caractères.")
    if not data.name.strip():
        raise HTTPException(status_code=400, detail="Le nom est requis.")
    email = data.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Un compte existe déjà avec cet email.")
    uid = str(uuid.uuid4())
    doc = {
        "id": uid, "email": email, "password_hash": hash_password(data.password),
        "name": data.name.strip(), "phone": data.phone.strip(), "role": "user",
        "rgpd_consent": True, "rgpd_consent_at": now_iso(), "created_at": now_iso(),
    }
    await db.users.insert_one(doc)
    welcome = f"<h3>Bienvenue chez 4à4 dix-huit 🎉</h3><p>Bonjour {escape(data.name.strip())},</p><p>Votre compte a bien été créé. Vous pouvez maintenant vous inscrire aux événements de l'association depuis notre site.</p><p>À bientôt !<br>L'équipe 4à4 dix-huit</p>"
    background.add_task(send_email_sync, email, "Bienvenue — 4à4 dix-huit", welcome)
    token = create_access_token(uid, email)
    return LoginOut(token=token, user={"id": uid, "email": email, "name": data.name.strip(), "role": "user"})

@api.get("/auth/me")
async def me(current=Depends(get_current_user)):
    return current

@api.post("/auth/change-password")
async def change_password(data: ChangePasswordIn, current=Depends(get_current_user)):
    user = await db.users.find_one({"id": current["id"]})
    if not verify_password(data.current_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password incorrect")
    await db.users.update_one({"id": current["id"]}, {"$set": {"password_hash": hash_password(data.new_password)}})
    return {"ok": True}

# ---------------- Pages ----------------
@api.get("/pages/{slug}", response_model=PageOut)
async def get_page(slug: str):
    p = await db.pages.find_one({"slug": slug}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Page not found")
    return p

@api.get("/pages")
async def list_pages():
    pages = await db.pages.find({}, {"_id": 0}).to_list(100)
    return pages

@api.put("/pages/{slug}", response_model=PageOut)
async def update_page(slug: str, data: PageUpdateIn, current=Depends(require_admin)):
    res = await db.pages.find_one_and_update(
        {"slug": slug},
        {"$set": {"content": data.content.model_dump(), "updated_at": now_iso()}},
        return_document=True,
    )
    if not res:
        # create if missing
        await db.pages.insert_one({"slug": slug, "content": data.content.model_dump(), "updated_at": now_iso()})
    p = await db.pages.find_one({"slug": slug}, {"_id": 0})
    return p

# ---------------- Events ----------------
@api.get("/events")
async def list_events(only_published: bool = True):
    q = {"published": True} if only_published else {}
    items = await db.events.find(q, {"_id": 0}).sort("date", 1).to_list(500)
    counts = await db.event_registrations.aggregate([{"$group": {"_id": "$event_id", "n": {"$sum": 1}}}]).to_list(2000)
    cmap = {c["_id"]: c["n"] for c in counts}
    for it in items:
        rc = cmap.get(it["id"], 0)
        it["registered_count"] = rc
        cap = it.get("capacity", 0) or 0
        it["spots_left"] = (cap - rc) if cap > 0 else None
    return items

@api.post("/events", response_model=EventOut)
async def create_event(data: EventIn, current=Depends(require_admin)):
    doc = {**data.model_dump(), "id": str(uuid.uuid4()), "created_at": now_iso()}
    await db.events.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.put("/events/{event_id}", response_model=EventOut)
async def update_event(event_id: str, data: EventIn, current=Depends(require_admin)):
    await db.events.update_one({"id": event_id}, {"$set": data.model_dump()})
    doc = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Event not found")
    return doc

@api.delete("/events/{event_id}")
async def delete_event(event_id: str, current=Depends(require_admin)):
    r = await db.events.delete_one({"id": event_id})
    await db.event_registrations.delete_many({"event_id": event_id})
    return {"deleted": r.deleted_count}

# ---------------- Event Registrations ----------------
@api.get("/events/my-registrations")
async def my_event_registrations(current=Depends(get_current_user)):
    regs = await db.event_registrations.find({"user_id": current["id"]}, {"_id": 0, "event_id": 1}).to_list(1000)
    return [r["event_id"] for r in regs]

@api.post("/events/{event_id}/register")
async def register_for_event(event_id: str, background: BackgroundTasks, current=Depends(get_current_user)):
    ev = await db.events.find_one({"id": event_id})
    if not ev or not ev.get("published"):
        raise HTTPException(status_code=404, detail="Événement introuvable")
    if await db.event_registrations.find_one({"event_id": event_id, "user_id": current["id"]}):
        raise HTTPException(status_code=400, detail="Vous êtes déjà inscrit à cet événement.")
    cap = ev.get("capacity", 0) or 0
    if cap > 0 and await db.event_registrations.count_documents({"event_id": event_id}) >= cap:
        raise HTTPException(status_code=400, detail="Cet événement est complet.")
    reg = {
        "id": str(uuid.uuid4()), "event_id": event_id, "user_id": current["id"],
        "user_name": current.get("name", ""), "user_email": current["email"],
        "user_phone": current.get("phone", ""), "created_at": now_iso(),
    }
    await db.event_registrations.insert_one(reg)
    reg.pop("_id", None)
    when = (ev.get("date", "") or "")[:16].replace("T", " à ")
    user_html = f"<h3>Inscription confirmée ✅</h3><p>Bonjour {escape(current.get('name',''))},</p><p>Votre inscription à l'événement <b>{escape(ev.get('title_fr',''))}</b> est bien confirmée.</p><p><b>Date :</b> {escape(when)}<br><b>Lieu :</b> {escape(ev.get('location','') or 'à préciser')}</p><p>Au plaisir de vous y retrouver !<br>L'équipe 4à4 dix-huit</p>"
    background.add_task(send_email_sync, current["email"], f"Inscription confirmée — {ev.get('title_fr','')}", user_html)
    admin_html = f"<p><b>{escape(current.get('name',''))}</b> ({escape(current['email'])}, {escape(current.get('phone','') or '—')}) s'est inscrit(e) à <b>{escape(ev.get('title_fr',''))}</b>.</p>"
    background.add_task(send_email_sync, CONTACT_EMAIL, f"Nouvelle inscription — {ev.get('title_fr','')}", admin_html)
    return {"ok": True, "registration": reg}

@api.delete("/events/{event_id}/register")
async def unregister_from_event(event_id: str, current=Depends(get_current_user)):
    r = await db.event_registrations.delete_one({"event_id": event_id, "user_id": current["id"]})
    return {"deleted": r.deleted_count}

@api.get("/events/{event_id}/registrations")
async def list_event_registrations(event_id: str, current=Depends(require_admin)):
    regs = await db.event_registrations.find({"event_id": event_id}, {"_id": 0}).sort("created_at", 1).to_list(2000)
    return regs

# ---------------- News ----------------
@api.get("/news")
async def list_news(only_published: bool = True):
    q = {"published": True} if only_published else {}
    items = await db.news.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items

@api.post("/news", response_model=NewsOut)
async def create_news(data: NewsIn, current=Depends(require_admin)):
    doc = {**data.model_dump(), "id": str(uuid.uuid4()), "created_at": now_iso()}
    await db.news.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.put("/news/{news_id}", response_model=NewsOut)
async def update_news(news_id: str, data: NewsIn, current=Depends(require_admin)):
    await db.news.update_one({"id": news_id}, {"$set": data.model_dump()})
    doc = await db.news.find_one({"id": news_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="News not found")
    return doc

@api.delete("/news/{news_id}")
async def delete_news(news_id: str, current=Depends(require_admin)):
    r = await db.news.delete_one({"id": news_id})
    return {"deleted": r.deleted_count}

# ---------------- Gallery ----------------
@api.get("/gallery")
async def list_gallery(category: Optional[str] = None):
    q = {"category": category} if category else {}
    items = await db.gallery.find(q, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items

@api.post("/gallery", response_model=GalleryItemOut)
async def create_gallery_item(data: GalleryItemIn, current=Depends(require_admin)):
    doc = {**data.model_dump(), "id": str(uuid.uuid4()), "created_at": now_iso()}
    await db.gallery.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.delete("/gallery/{item_id}")
async def delete_gallery_item(item_id: str, current=Depends(require_admin)):
    r = await db.gallery.delete_one({"id": item_id})
    return {"deleted": r.deleted_count}

# ---------------- Upload ----------------
@api.post("/upload")
async def upload_file(file: UploadFile = File(...), current=Depends(require_admin)):
    ext = (file.filename.rsplit(".", 1)[-1] if "." in file.filename else "bin").lower()
    path = f"{APP_NAME}/uploads/{uuid.uuid4()}.{ext}"
    data = await file.read()
    content_type = file.content_type or "application/octet-stream"
    result = put_object(path, data, content_type)
    # store reference
    file_doc = {
        "id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "is_deleted": False,
        "created_at": now_iso(),
    }
    await db.files.insert_one(file_doc)
    return {
        "id": file_doc["id"],
        "storage_path": result["path"],
        "url": f"/api/files/{result['path']}",
        "content_type": content_type,
    }

@api.get("/files/{path:path}")
async def serve_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    data, content_type = get_object(path)
    return FastResponse(content=data, media_type=record.get("content_type") or content_type)

# ---------------- Members ----------------
@api.post("/members", response_model=MemberOut)
async def create_member(data: MemberIn):
    doc = {**data.model_dump(), "id": str(uuid.uuid4()), "created_at": now_iso(), "status": "pending"}
    await db.members.insert_one(doc)
    doc.pop("_id", None)
    # notify
    html = f"<h3>Nouvelle demande d'adhésion</h3><p><b>Nom :</b> {escape(data.first_name)} {escape(data.last_name)}</p><p><b>Email :</b> {escape(str(data.email))}</p><p><b>Téléphone :</b> {escape(data.phone)}</p><p><b>Adresse :</b> {escape(data.address)}</p><p><b>Intérêts :</b> {escape(', '.join(data.interests))}</p><p><b>Message :</b> {escape(data.message)}</p>"
    send_email_sync(CONTACT_EMAIL, "Nouvelle adhésion — 4à4 dix-huit", html)
    return doc

@api.get("/members")
async def list_members(current=Depends(require_admin)):
    items = await db.members.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items

@api.delete("/members/{member_id}")
async def delete_member(member_id: str, current=Depends(require_admin)):
    r = await db.members.delete_one({"id": member_id})
    return {"deleted": r.deleted_count}

# ---------------- Contact Messages ----------------
@api.post("/messages", response_model=ContactOut)
async def create_message(data: ContactIn):
    doc = {**data.model_dump(), "id": str(uuid.uuid4()), "created_at": now_iso(), "read": False}
    await db.messages.insert_one(doc)
    doc.pop("_id", None)
    html = f"<h3>Nouveau message du formulaire de contact</h3><p><b>De :</b> {escape(data.name)} &lt;{escape(str(data.email))}&gt;</p><p><b>Sujet :</b> {escape(data.subject)}</p><p><b>Message :</b><br>{escape(data.message)}</p>"
    send_email_sync(CONTACT_EMAIL, f"Contact — {data.subject or 'Sans sujet'}", html)
    return doc

@api.get("/messages")
async def list_messages(current=Depends(require_admin)):
    items = await db.messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items

@api.delete("/messages/{message_id}")
async def delete_message(message_id: str, current=Depends(require_admin)):
    r = await db.messages.delete_one({"id": message_id})
    return {"deleted": r.deleted_count}

@api.patch("/messages/{message_id}/read")
async def mark_message_read(message_id: str, current=Depends(require_admin)):
    await db.messages.update_one({"id": message_id}, {"$set": {"read": True}})
    return {"ok": True}

# ---------------- Settings ----------------
@api.get("/settings")
async def get_settings():
    s = await db.settings.find_one({"_id": "global"})
    if not s:
        return SettingsModel().model_dump()
    s.pop("_id", None)
    # merge with defaults so new fields appear automatically
    defaults = SettingsModel().model_dump()
    defaults.update(s)
    return defaults

@api.put("/settings")
async def update_settings(data: SettingsModel, current=Depends(require_admin)):
    await db.settings.update_one({"_id": "global"}, {"$set": data.model_dump()}, upsert=True)
    return data.model_dump()

@api.get("/sitemap.xml")
async def sitemap():
    settings_doc = await db.settings.find_one({"_id": "global"}) or {}
    base = settings_doc.get("site_url") or "https://4a4dixhuit.org"
    base = base.rstrip("/")
    paths = ["/", "/a-propos", "/nos-actions", "/evenements", "/actualites", "/galerie", "/devenir-membre", "/faire-un-don", "/contact", "/mentions-legales", "/confidentialite"]
    now = datetime.now(timezone.utc).date().isoformat()
    urls = "\n".join([f"  <url><loc>{base}{p}</loc><lastmod>{now}</lastmod><changefreq>weekly</changefreq></url>" for p in paths])
    xml = f"""<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n{urls}\n</urlset>"""
    return FastResponse(content=xml, media_type="application/xml")

@api.get("/robots.txt")
async def robots():
    settings_doc = await db.settings.find_one({"_id": "global"}) or {}
    base = (settings_doc.get("site_url") or "https://4a4dixhuit.org").rstrip("/")
    return FastResponse(content=f"User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: {base}/api/sitemap.xml\n", media_type="text/plain")

# ---------------- Health ----------------
@api.get("/")
async def root():
    return {"service": "4a4dixhuit", "status": "ok"}

# ---------------- Analytics / Visitor Tracking ----------------
class TrackIn(BaseModel):
    path: str = "/"
    referrer: Optional[str] = ""

def _client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else ""

def _lookup_country(ip: str) -> Dict[str, str]:
    if not ip or ip.startswith(("127.", "10.", "192.168.", "172.")):
        return {"country": "Local", "country_code": "LO"}
    try:
        r = requests.get(f"http://ip-api.com/json/{ip}?fields=country,countryCode", timeout=3)
        if r.status_code == 200:
            d = r.json()
            return {"country": d.get("country") or "Inconnu", "country_code": (d.get("countryCode") or "??")}
    except Exception as e:
        logger.warning(f"GeoIP lookup failed for {ip}: {e}")
    return {"country": "Inconnu", "country_code": "??"}

@api.post("/track")
async def track(data: TrackIn, request: Request):
    ip = _client_ip(request)
    today = datetime.now(timezone.utc).date().isoformat()
    # Daily-salted hash to anonymize visitor (RGPD-friendly: cannot reverse to IP, rotates daily)
    visitor_hash = hashlib.sha256(f"{ip}:{today}:{JWT_SECRET}".encode()).hexdigest()[:32]
    path = (data.path or "/")[:200]
    # Throttle: skip if this visitor already hit this path in the last 60s (anti-flood on a public endpoint)
    recent_cutoff = (datetime.now(timezone.utc) - timedelta(seconds=60)).isoformat()
    if await db.visits.find_one({"visitor_hash": visitor_hash, "path": path, "created_at": {"$gte": recent_cutoff}}):
        return {"ok": True, "throttled": True}
    # Cache country lookup per IP (avoids spamming ip-api.com)
    cached = await db.ip_geo.find_one({"ip": ip})
    if cached:
        geo = {"country": cached.get("country", "Inconnu"), "country_code": cached.get("country_code", "??")}
    else:
        geo = await asyncio.to_thread(_lookup_country, ip)
        await db.ip_geo.update_one({"ip": ip}, {"$set": {"ip": ip, **geo, "cached_at": now_iso()}}, upsert=True)
    ua = (request.headers.get("user-agent") or "")[:300]
    await db.visits.insert_one({
        "id": str(uuid.uuid4()),
        "path": path,
        "referrer": (data.referrer or "")[:300],
        "visitor_hash": visitor_hash,
        "country": geo["country"],
        "country_code": geo["country_code"],
        "user_agent": ua,
        "created_at": now_iso(),
    })
    return {"ok": True}

@api.get("/admin/analytics")
async def analytics(current=Depends(require_admin)):
    now = datetime.now(timezone.utc)
    today_str = now.date().isoformat()
    twelve_months_ago = (now - timedelta(days=365)).isoformat()
    thirty_days_ago = (now - timedelta(days=30)).isoformat()
    seven_days_ago = (now - timedelta(days=7)).isoformat()

    # Indicators
    unread_messages = await db.messages.count_documents({"read": False})
    total_messages = await db.messages.count_documents({})
    pending_members = await db.members.count_documents({"status": "pending"})
    total_members = await db.members.count_documents({})
    upcoming_events = await db.events.count_documents({"date": {"$gte": now.isoformat()}, "published": True})
    total_events = await db.events.count_documents({})
    published_news = await db.news.count_documents({"published": True})
    draft_news = await db.news.count_documents({"published": False})
    gallery_images = await db.gallery.count_documents({"media_type": "image"})
    gallery_videos = await db.gallery.count_documents({"media_type": "video"})

    # Visitor indicators
    total_visits = await db.visits.count_documents({})
    visits_30d = await db.visits.count_documents({"created_at": {"$gte": thirty_days_ago}})
    visits_7d = await db.visits.count_documents({"created_at": {"$gte": seven_days_ago}})
    visits_today = await db.visits.count_documents({"created_at": {"$gte": today_str}})
    unique_30d_res = await db.visits.aggregate([
        {"$match": {"created_at": {"$gte": thirty_days_ago}}},
        {"$group": {"_id": "$visitor_hash"}},
        {"$count": "n"},
    ]).to_list(1)
    unique_30d = unique_30d_res[0]["n"] if unique_30d_res else 0

    # Monthly series (last 12 months)
    def month_agg(coll_name):
        return db[coll_name].aggregate([
            {"$match": {"created_at": {"$gte": twelve_months_ago}}},
            {"$group": {"_id": {"$substr": ["$created_at", 0, 7]}, "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}},
        ])

    members_raw = await month_agg("members").to_list(50)
    messages_raw = await month_agg("messages").to_list(50)
    news_raw = await month_agg("news").to_list(50)
    visits_monthly_raw = await month_agg("visits").to_list(50)

    # Build a full 12-month timeline filling zeros
    timeline = []
    cur = now.replace(day=1)
    months_desc = []
    for _ in range(12):
        months_desc.append(cur.strftime("%Y-%m"))
        # decrement month
        year, month = cur.year, cur.month - 1
        if month <= 0:
            month = 12
            year -= 1
        cur = cur.replace(year=year, month=month, day=1)
    months = list(reversed(months_desc))

    def to_dict(rows):
        return {r["_id"]: r["count"] for r in rows}
    md_members = to_dict(members_raw)
    md_messages = to_dict(messages_raw)
    md_news = to_dict(news_raw)
    md_visits = to_dict(visits_monthly_raw)

    for m in months:
        timeline.append({
            "month": m,
            "members": md_members.get(m, 0),
            "messages": md_messages.get(m, 0),
            "news": md_news.get(m, 0),
            "visits": md_visits.get(m, 0),
        })

    # Daily visits last 30 days
    daily_raw = await db.visits.aggregate([
        {"$match": {"created_at": {"$gte": thirty_days_ago}}},
        {"$group": {"_id": {"$substr": ["$created_at", 0, 10]}, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]).to_list(40)
    daily_dict = {r["_id"]: r["count"] for r in daily_raw}
    daily = []
    for i in range(29, -1, -1):
        d = (now - timedelta(days=i)).date().isoformat()
        daily.append({"date": d, "visits": daily_dict.get(d, 0)})

    # Countries (last 30 days)
    countries_raw = await db.visits.aggregate([
        {"$match": {"created_at": {"$gte": thirty_days_ago}}},
        {"$group": {"_id": "$country", "count": {"$sum": 1}, "code": {"$first": "$country_code"}}},
        {"$sort": {"count": -1}},
        {"$limit": 15},
    ]).to_list(30)
    countries = [{"name": c["_id"] or "Inconnu", "code": c.get("code") or "??", "count": c["count"]} for c in countries_raw]

    # Top pages (last 30 days)
    top_pages_raw = await db.visits.aggregate([
        {"$match": {"created_at": {"$gte": thirty_days_ago}}},
        {"$group": {"_id": "$path", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]).to_list(20)
    top_pages = [{"path": p["_id"] or "/", "count": p["count"]} for p in top_pages_raw]

    return {
        "indicators": {
            "unread_messages": unread_messages,
            "total_messages": total_messages,
            "pending_members": pending_members,
            "total_members": total_members,
            "upcoming_events": upcoming_events,
            "total_events": total_events,
            "published_news": published_news,
            "draft_news": draft_news,
            "gallery_images": gallery_images,
            "gallery_videos": gallery_videos,
            "total_visits": total_visits,
            "visits_30d": visits_30d,
            "visits_7d": visits_7d,
            "visits_today": visits_today,
            "unique_visitors_30d": unique_30d,
        },
        "timeline": timeline,
        "daily_visits": daily,
        "countries": countries,
        "top_pages": top_pages,
    }

@api.delete("/admin/analytics")
async def reset_analytics(current=Depends(require_admin)):
    v = await db.visits.delete_many({})
    g = await db.ip_geo.delete_many({})
    logger.info(f"Analytics reset by {current.get('email')}: {v.deleted_count} visits, {g.deleted_count} ip caches")
    return {"deleted_visits": v.deleted_count, "deleted_ip_cache": g.deleted_count}

class TestEmailIn(BaseModel):
    to: EmailStr
    subject: str = "Test — 4à4 dix-huit"
    message: str = "Ceci est un email de test envoyé depuis l'administration du site 4à4 dix-huit."

@api.post("/test-email")
async def test_email(data: TestEmailIn, current=Depends(require_admin)):
    html = f"""<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;\">
        <h2 style=\"color:#39B8B2;\">Email de test — 4à4 dix-huit</h2>
        <p style=\"color:#444;\">{data.message}</p>
        <hr style=\"border:none;border-top:1px solid #eee;margin:20px 0;\">
        <p style=\"font-size:12px;color:#888;\">Envoyé via Resend depuis l'administration du site.</p>
    </div>"""
    result = send_email_sync(data.to, data.subject, html)
    return {"to": data.to, "from": SENDER_EMAIL, **result}

app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
