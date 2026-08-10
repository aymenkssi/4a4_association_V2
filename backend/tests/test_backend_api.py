"""End-to-end backend API tests for 4a4dixhuit."""
import os
import io
import time
import requests
import pytest

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://action-hub-159.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@4a4dixhuit.org"
ADMIN_PASSWORD = "Admin4a4!2026"

PAGE_SLUGS = ["home", "about", "actions", "member", "donate", "contact", "legal", "privacy"]


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and "user" in data
    return data["token"]


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# -------------------- Health --------------------
class TestHealth:
    def test_root(self):
        r = requests.get(f"{API}/", timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d.get("status") == "ok"
        assert d.get("service") == "4a4dixhuit"


# -------------------- Auth --------------------
class TestAuth:
    def test_login_success(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d.get("token"), str) and len(d["token"]) > 10
        assert d["user"]["email"] == ADMIN_EMAIL.lower()
        assert d["user"]["role"] == "admin"

    def test_login_wrong_password(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_login_unknown_email(self):
        r = requests.post(f"{API}/auth/login", json={"email": "nope@x.com", "password": "x"}, timeout=15)
        assert r.status_code == 401

    def test_me_with_token(self, auth_headers):
        r = requests.get(f"{API}/auth/me", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL.lower()

    def test_me_without_token(self):
        r = requests.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 401


# -------------------- Pages --------------------
class TestPages:
    @pytest.mark.parametrize("slug", PAGE_SLUGS)
    def test_get_page(self, slug):
        r = requests.get(f"{API}/pages/{slug}", timeout=15)
        assert r.status_code == 200, f"slug={slug} -> {r.status_code}"
        d = r.json()
        assert d["slug"] == slug
        assert "content" in d
        assert isinstance(d["content"]["fr"], dict) and len(d["content"]["fr"]) > 0
        assert isinstance(d["content"]["en"], dict) and len(d["content"]["en"]) > 0

    def test_update_page_persists(self, auth_headers):
        r = requests.get(f"{API}/pages/home", timeout=15)
        original = r.json()["content"]
        new_content = {
            "fr": {**original["fr"], "hero_title": "TEST_FR_TITLE"},
            "en": {**original["en"], "hero_title": "TEST_EN_TITLE"},
        }
        u = requests.put(f"{API}/pages/home", headers=auth_headers, json={"content": new_content}, timeout=15)
        assert u.status_code == 200
        # Verify persisted
        g = requests.get(f"{API}/pages/home", timeout=15)
        assert g.json()["content"]["fr"]["hero_title"] == "TEST_FR_TITLE"
        assert g.json()["content"]["en"]["hero_title"] == "TEST_EN_TITLE"
        # Restore
        requests.put(f"{API}/pages/home", headers=auth_headers, json={"content": original}, timeout=15)

    def test_update_page_unauthenticated(self):
        r = requests.put(f"{API}/pages/home", json={"content": {"fr": {}, "en": {}}}, timeout=10)
        assert r.status_code == 401


# -------------------- Events --------------------
class TestEvents:
    created_id = None

    def test_create_event(self, auth_headers):
        payload = {
            "title_fr": "TEST_Event_FR", "title_en": "TEST_Event_EN",
            "description_fr": "desc", "description_en": "desc",
            "date": "2026-06-01T18:00:00Z", "location": "Paris", "image_url": "",
            "published": True,
        }
        r = requests.post(f"{API}/events", headers=auth_headers, json=payload, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["title_fr"] == "TEST_Event_FR"
        assert "id" in d
        TestEvents.created_id = d["id"]

    def test_create_event_unauth(self):
        r = requests.post(f"{API}/events", json={"title_fr": "x", "title_en": "x", "date": "2026-01-01"}, timeout=10)
        assert r.status_code == 401

    def test_list_events_public(self):
        r = requests.get(f"{API}/events", timeout=15)
        assert r.status_code == 200
        assert any(e["id"] == TestEvents.created_id for e in r.json())

    def test_list_events_includes_unpublished(self, auth_headers):
        # create unpublished
        payload = {
            "title_fr": "TEST_unpub", "title_en": "TEST_unpub", "date": "2026-07-01T18:00:00Z",
            "published": False,
        }
        r = requests.post(f"{API}/events", headers=auth_headers, json=payload, timeout=15)
        uid = r.json()["id"]
        pub = requests.get(f"{API}/events?only_published=true", timeout=15).json()
        all_ev = requests.get(f"{API}/events?only_published=false", timeout=15).json()
        assert not any(e["id"] == uid for e in pub)
        assert any(e["id"] == uid for e in all_ev)
        requests.delete(f"{API}/events/{uid}", headers=auth_headers, timeout=10)

    def test_update_event(self, auth_headers):
        payload = {
            "title_fr": "TEST_Event_FR_upd", "title_en": "TEST_Event_EN",
            "description_fr": "", "description_en": "",
            "date": "2026-06-01T18:00:00Z", "location": "Paris", "image_url": "",
            "published": True,
        }
        r = requests.put(f"{API}/events/{TestEvents.created_id}", headers=auth_headers, json=payload, timeout=15)
        assert r.status_code == 200
        assert r.json()["title_fr"] == "TEST_Event_FR_upd"

    def test_delete_event(self, auth_headers):
        r = requests.delete(f"{API}/events/{TestEvents.created_id}", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        assert r.json().get("deleted") == 1


# -------------------- News --------------------
class TestNews:
    created_id = None

    def test_create_news(self, auth_headers):
        payload = {"title_fr": "TEST_News_FR", "title_en": "TEST_News_EN", "excerpt_fr": "e", "excerpt_en": "e", "body_fr": "b", "body_en": "b", "image_url": "", "published": True}
        r = requests.post(f"{API}/news", headers=auth_headers, json=payload, timeout=15)
        assert r.status_code == 200, r.text
        TestNews.created_id = r.json()["id"]

    def test_create_news_unauth(self):
        r = requests.post(f"{API}/news", json={"title_fr": "x", "title_en": "x"}, timeout=10)
        assert r.status_code == 401

    def test_list_news(self):
        r = requests.get(f"{API}/news", timeout=15)
        assert r.status_code == 200
        assert any(n["id"] == TestNews.created_id for n in r.json())

    def test_update_news(self, auth_headers):
        payload = {"title_fr": "TEST_News_FR_upd", "title_en": "x", "published": True}
        r = requests.put(f"{API}/news/{TestNews.created_id}", headers=auth_headers, json=payload, timeout=15)
        assert r.status_code == 200
        assert r.json()["title_fr"] == "TEST_News_FR_upd"

    def test_delete_news(self, auth_headers):
        r = requests.delete(f"{API}/news/{TestNews.created_id}", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        assert r.json().get("deleted") == 1


# -------------------- Gallery --------------------
class TestGallery:
    created_id = None

    def test_create_gallery_item(self, auth_headers):
        payload = {
            "title_fr": "TEST_g_fr", "title_en": "TEST_g_en",
            "media_type": "image",
            "media_url": "https://images.pexels.com/photos/21530046/pexels-photo-21530046.jpeg",
            "category": "musique",
        }
        r = requests.post(f"{API}/gallery", headers=auth_headers, json=payload, timeout=15)
        assert r.status_code == 200, r.text
        TestGallery.created_id = r.json()["id"]

    def test_create_gallery_unauth(self):
        r = requests.post(f"{API}/gallery", json={"media_url": "x"}, timeout=10)
        assert r.status_code == 401

    def test_list_gallery(self):
        r = requests.get(f"{API}/gallery", timeout=15)
        assert r.status_code == 200
        assert any(g["id"] == TestGallery.created_id for g in r.json())

    def test_delete_gallery(self, auth_headers):
        r = requests.delete(f"{API}/gallery/{TestGallery.created_id}", headers=auth_headers, timeout=15)
        assert r.status_code == 200


# -------------------- Members --------------------
class TestMembers:
    created_id = None

    def test_create_member_public(self):
        payload = {
            "first_name": "TEST_First", "last_name": "TEST_Last",
            "email": "test_member@example.com", "phone": "0102030405",
            "interests": ["music", "yoga"], "message": "hello",
        }
        r = requests.post(f"{API}/members", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["first_name"] == "TEST_First"
        assert d["status"] == "pending"
        TestMembers.created_id = d["id"]

    def test_list_members_unauth(self):
        r = requests.get(f"{API}/members", timeout=10)
        assert r.status_code == 401

    def test_list_members_auth(self, auth_headers):
        r = requests.get(f"{API}/members", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        assert any(m["id"] == TestMembers.created_id for m in r.json())

    def test_delete_member(self, auth_headers):
        r = requests.delete(f"{API}/members/{TestMembers.created_id}", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        assert r.json().get("deleted") == 1


# -------------------- Messages --------------------
class TestMessages:
    created_id = None

    def test_create_message_public(self):
        payload = {"name": "TEST_User", "email": "test_msg@example.com", "subject": "Hello", "message": "test body"}
        r = requests.post(f"{API}/messages", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        TestMessages.created_id = r.json()["id"]
        assert r.json()["read"] is False

    def test_list_messages_unauth(self):
        r = requests.get(f"{API}/messages", timeout=10)
        assert r.status_code == 401

    def test_list_messages_auth(self, auth_headers):
        r = requests.get(f"{API}/messages", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        assert any(m["id"] == TestMessages.created_id for m in r.json())

    def test_mark_read(self, auth_headers):
        r = requests.patch(f"{API}/messages/{TestMessages.created_id}/read", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        # verify
        msgs = requests.get(f"{API}/messages", headers=auth_headers, timeout=15).json()
        m = next(x for x in msgs if x["id"] == TestMessages.created_id)
        assert m["read"] is True

    def test_delete_message(self, auth_headers):
        r = requests.delete(f"{API}/messages/{TestMessages.created_id}", headers=auth_headers, timeout=15)
        assert r.status_code == 200


# -------------------- Settings --------------------
class TestSettings:
    def test_get_settings_public(self):
        r = requests.get(f"{API}/settings", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "helloasso_url" in d

    def test_update_settings_unauth(self):
        r = requests.put(f"{API}/settings", json={"helloasso_url": "x"}, timeout=10)
        assert r.status_code == 401

    def test_update_settings(self, auth_headers):
        original = requests.get(f"{API}/settings", timeout=10).json()
        new_url = "https://www.helloasso.com/associations/4a4dixhuit/test"
        body = {**original, "helloasso_url": new_url}
        r = requests.put(f"{API}/settings", headers=auth_headers, json=body, timeout=15)
        assert r.status_code == 200
        # verify
        g = requests.get(f"{API}/settings", timeout=10).json()
        assert g["helloasso_url"] == new_url
        # restore
        requests.put(f"{API}/settings", headers=auth_headers, json=original, timeout=15)


# -------------------- Upload + serve --------------------
class TestUpload:
    def test_upload_unauth(self):
        files = {"file": ("test.png", b"\x89PNG\r\n\x1a\n", "image/png")}
        r = requests.post(f"{API}/upload", files=files, timeout=15)
        assert r.status_code == 401

    def test_upload_and_serve(self, auth_headers):
        # 1x1 PNG bytes
        png = bytes.fromhex(
            "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4"
            "890000000d49444154789c63f8cf00000003000100184ddc7e0000000049454e44ae426082"
        )
        files = {"file": ("test.png", png, "image/png")}
        r = requests.post(f"{API}/upload", headers=auth_headers, files=files, timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "id" in d and "storage_path" in d and "url" in d
        assert d["url"].startswith("/api/files/")
        # fetch the file
        file_url = f"{BASE_URL}{d['url']}"
        f = requests.get(file_url, timeout=30)
        assert f.status_code == 200
        assert "image" in f.headers.get("content-type", "").lower()
        assert f.content == png
