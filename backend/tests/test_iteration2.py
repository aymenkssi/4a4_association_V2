"""Iteration 2 backend API tests: sitemap, robots, settings new fields."""
import os
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@4a4dixhuit.org"
ADMIN_PASSWORD = "Admin4a4!2026"

NEW_SETTING_KEYS = [
    "logo_url", "site_url", "meta_description_fr", "meta_description_en",
    "twitter_url", "linkedin_url", "youtube_url", "tiktok_url", "whatsapp_url",
]


def _login():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


class TestSitemap:
    def test_sitemap_returns_xml(self):
        r = requests.get(f"{API}/sitemap.xml", timeout=15)
        assert r.status_code == 200, r.text
        ct = r.headers.get("content-type", "")
        assert "xml" in ct.lower(), f"unexpected content-type: {ct}"
        body = r.text
        assert "<?xml" in body
        assert "<urlset" in body
        assert "<loc>" in body
        # uses site_url from settings
        settings = requests.get(f"{API}/settings", timeout=10).json()
        base = settings.get("site_url") or "https://4a4dixhuit.org"
        assert base.rstrip("/") in body

    def test_sitemap_contains_main_routes(self):
        r = requests.get(f"{API}/sitemap.xml", timeout=15)
        body = r.text
        # at minimum the homepage should be listed
        assert "<loc>" in body
        # Check a few expected public paths appear (they are appended to base url)
        for path in ["/a-propos", "/nos-actions", "/evenements", "/actualites", "/galerie", "/contact"]:
            assert path in body, f"missing {path} in sitemap"


class TestRobots:
    def test_robots_returns_text(self):
        r = requests.get(f"{API}/robots.txt", timeout=15)
        assert r.status_code == 200
        ct = r.headers.get("content-type", "")
        assert "text/plain" in ct.lower()
        body = r.text
        assert "User-agent:" in body
        assert "Sitemap:" in body
        assert "/api/sitemap.xml" in body


class TestSettingsNewFields:
    def test_get_settings_includes_new_fields_with_defaults(self):
        r = requests.get(f"{API}/settings", timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in NEW_SETTING_KEYS:
            assert k in d, f"missing field {k} in settings"
        # check defaults shape
        assert d["logo_url"] == "/logo.png"
        assert isinstance(d["site_url"], str) and len(d["site_url"]) > 0
        assert isinstance(d["meta_description_fr"], str) and len(d["meta_description_fr"]) > 0
        assert isinstance(d["meta_description_en"], str) and len(d["meta_description_en"]) > 0

    def test_put_settings_persists_new_fields(self):
        token = _login()
        headers = {"Authorization": f"Bearer {token}"}
        original = requests.get(f"{API}/settings", timeout=10).json()

        new_values = {
            "logo_url": "/logo.png",
            "site_url": "https://test.example.org",
            "meta_description_fr": "TEST_meta_fr description",
            "meta_description_en": "TEST_meta_en description",
            "twitter_url": "https://twitter.com/test_4a4",
            "linkedin_url": "https://linkedin.com/company/test_4a4",
            "youtube_url": "https://youtube.com/@test_4a4",
            "tiktok_url": "https://tiktok.com/@test_4a4",
            "whatsapp_url": "https://wa.me/0102030405",
        }
        body = {**original, **new_values}
        r = requests.put(f"{API}/settings", headers=headers, json=body, timeout=15)
        assert r.status_code == 200, r.text

        # verify persistence
        g = requests.get(f"{API}/settings", timeout=10).json()
        for k, v in new_values.items():
            assert g[k] == v, f"{k} not persisted; got {g.get(k)!r}"

        # verify sitemap now uses the new site_url
        sm = requests.get(f"{API}/sitemap.xml", timeout=15).text
        assert "https://test.example.org" in sm

        # restore original
        requests.put(f"{API}/settings", headers=headers, json=original, timeout=15)
