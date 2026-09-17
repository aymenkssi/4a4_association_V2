"""Tests for /api/team CRUD + display_mode feature."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback to reading frontend/.env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

ADMIN_EMAIL = "admin@4a4dixhuit.org"
ADMIN_PASSWORD = "Admin4a4Preview!2026"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return r.json().get("access_token") or r.json().get("token")


@pytest.fixture(scope="module")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_public_list_team():
    r = requests.get(f"{BASE_URL}/api/team")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_create_bio_staff_member(auth_headers):
    payload = {
        "name": "TEST_Bio_Member",
        "role": "TEST role",
        "nature": "staff",
        "display_mode": "bio",
        "bio": "TEST bio text content",
        "order": 999,
    }
    r = requests.post(f"{BASE_URL}/api/team", json=payload, headers=auth_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["name"] == payload["name"]
    assert body["display_mode"] == "bio"
    assert body["bio"] == payload["bio"]
    assert body["nature"] == "staff"
    mid = body["id"]

    # verify in list
    lst = requests.get(f"{BASE_URL}/api/team").json()
    assert any(m["id"] == mid and m["bio"] == payload["bio"] for m in lst)

    # cleanup
    d = requests.delete(f"{BASE_URL}/api/team/{mid}", headers=auth_headers)
    assert d.status_code == 200


def test_create_image_intervenant_member(auth_headers):
    payload = {
        "name": "TEST_Image_Member",
        "role": "TEST intervenant",
        "nature": "intervenant",
        "display_mode": "image",
        "detail_image_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        "order": 999,
    }
    r = requests.post(f"{BASE_URL}/api/team", json=payload, headers=auth_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["display_mode"] == "image"
    assert body["detail_image_url"] == payload["detail_image_url"]
    assert body["nature"] == "intervenant"
    mid = body["id"]

    # update
    upd = {**payload, "role": "TEST updated"}
    r2 = requests.put(f"{BASE_URL}/api/team/{mid}", json=upd, headers=auth_headers)
    assert r2.status_code == 200
    assert r2.json()["role"] == "TEST updated"

    # cleanup
    d = requests.delete(f"{BASE_URL}/api/team/{mid}", headers=auth_headers)
    assert d.status_code == 200


def test_create_requires_auth():
    r = requests.post(f"{BASE_URL}/api/team", json={"name": "TEST_NoAuth"})
    assert r.status_code in (401, 403)
