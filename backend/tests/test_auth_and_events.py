"""Tests for auth (register/login/me), admin-only guards, and event registration/capacity flows."""
import os
import time
import uuid
import pytest
import requests

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") + "/api"
ADMIN_EMAIL = "admin@4a4dixhuit.org"
ADMIN_PASSWORD = "Admin4a4!2026"

# Unique run tag so parallel/rerun doesn't clash
TAG = uuid.uuid4().hex[:8]


def _reg(name, email, phone="0102030405", pw="secret123", consent=True):
    return requests.post(f"{BASE}/auth/register", json={
        "name": name, "email": email, "phone": phone, "password": pw, "rgpd_consent": consent
    })


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def three_users():
    users = []
    for i in range(3):
        email = f"TEST_{TAG}_u{i}@example.com"
        r = _reg(f"Test U{i}", email)
        assert r.status_code == 200, r.text
        data = r.json()
        users.append({"email": email, "token": data["token"], "id": data["user"]["id"]})
    return users


@pytest.fixture(scope="module")
def created_event(admin_token):
    payload = {
        "title_fr": f"TEST_{TAG}", "title_en": f"TEST_{TAG}",
        "description_fr": "x", "description_en": "x",
        "date": "2030-01-01T18:00:00", "location": "Paris",
        "capacity": 2, "published": True,
    }
    r = requests.post(f"{BASE}/events", json=payload, headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200, r.text
    ev = r.json()
    yield ev
    # cleanup
    requests.delete(f"{BASE}/events/{ev['id']}", headers={"Authorization": f"Bearer {admin_token}"})


# ------------ Auth / register ------------
class TestRegister:
    def test_register_ok(self):
        email = f"TEST_{TAG}_ok@example.com"
        r = _reg("Alice Test", email)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data and data["user"]["email"] == email.lower()
        assert data["user"]["role"] == "user"
        # me
        me = requests.get(f"{BASE}/auth/me", headers={"Authorization": f"Bearer {data['token']}"})
        assert me.status_code == 200
        assert me.json()["role"] == "user"
        assert me.json()["email"] == email.lower()

    def test_register_no_rgpd(self):
        r = _reg("Bob", f"TEST_{TAG}_norgpd@example.com", consent=False)
        assert r.status_code == 400

    def test_register_short_password(self):
        r = _reg("Bob", f"TEST_{TAG}_short@example.com", pw="123")
        assert r.status_code == 400

    def test_register_duplicate(self):
        email = f"TEST_{TAG}_dup@example.com"
        assert _reg("Dup", email).status_code == 200
        assert _reg("Dup", email).status_code == 400


class TestLogin:
    def test_admin_login_and_me(self, admin_token):
        me = requests.get(f"{BASE}/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
        assert me.status_code == 200
        assert me.json()["role"] == "admin"

    def test_user_login(self):
        email = f"TEST_{TAG}_login@example.com"
        _reg("LoginU", email, pw="secret123")
        r = requests.post(f"{BASE}/auth/login", json={"email": email, "password": "secret123"})
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "user"


# ------------ Admin-only guards ------------
class TestAdminGuards:
    def test_user_cannot_list_members(self, three_users):
        r = requests.get(f"{BASE}/members", headers={"Authorization": f"Bearer {three_users[0]['token']}"})
        assert r.status_code == 403

    def test_user_cannot_update_home(self, three_users):
        r = requests.put(f"{BASE}/pages/home", json={"content": {"fr": {}, "en": {}}},
                         headers={"Authorization": f"Bearer {three_users[0]['token']}"})
        assert r.status_code == 403

    def test_admin_can_list_members(self, admin_token):
        r = requests.get(f"{BASE}/members", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200


# ------------ Event capacity + registration ------------
class TestEventFlow:
    def test_full_flow(self, admin_token, three_users, created_event):
        ev_id = created_event["id"]
        u1, u2, u3 = three_users

        # user cannot list registrations
        r = requests.get(f"{BASE}/events/{ev_id}/registrations", headers={"Authorization": f"Bearer {u1['token']}"})
        assert r.status_code == 403

        # 2 users register OK
        for u in (u1, u2):
            r = requests.post(f"{BASE}/events/{ev_id}/register", headers={"Authorization": f"Bearer {u['token']}"})
            assert r.status_code == 200, r.text
            assert r.json().get("ok") is True

        # duplicate registration
        r = requests.post(f"{BASE}/events/{ev_id}/register", headers={"Authorization": f"Bearer {u1['token']}"})
        assert r.status_code == 400
        assert "déjà" in r.json().get("detail", "").lower() or "deja" in r.json().get("detail", "").lower()

        # 3rd user -> complet
        r = requests.post(f"{BASE}/events/{ev_id}/register", headers={"Authorization": f"Bearer {u3['token']}"})
        assert r.status_code == 400
        assert "complet" in r.json().get("detail", "").lower()

        # list events shows registered_count=2, spots_left=0
        r = requests.get(f"{BASE}/events")
        assert r.status_code == 200
        ev = next(e for e in r.json() if e["id"] == ev_id)
        assert ev["registered_count"] == 2
        assert ev["spots_left"] == 0

        # my-registrations
        r = requests.get(f"{BASE}/events/my-registrations", headers={"Authorization": f"Bearer {u1['token']}"})
        assert r.status_code == 200
        assert ev_id in r.json()

        # admin sees participant list with name/email/phone
        r = requests.get(f"{BASE}/events/{ev_id}/registrations",
                         headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        regs = r.json()
        assert len(regs) == 2
        for reg in regs:
            assert reg.get("user_email")
            assert reg.get("user_name")
            assert "user_phone" in reg

        # unregister frees a spot
        r = requests.delete(f"{BASE}/events/{ev_id}/register", headers={"Authorization": f"Bearer {u1['token']}"})
        assert r.status_code == 200
        r = requests.get(f"{BASE}/events")
        ev = next(e for e in r.json() if e["id"] == ev_id)
        assert ev["registered_count"] == 1
        assert ev["spots_left"] == 1

        # 3rd user can now register
        r = requests.post(f"{BASE}/events/{ev_id}/register", headers={"Authorization": f"Bearer {u3['token']}"})
        assert r.status_code == 200


def test_cleanup_users(admin_token):
    """Best-effort cleanup of TEST_ users created during this run (via direct mongo not available; leave to admin)."""
    # No admin user-delete endpoint exists; leave test users in DB.
    assert True
