"""Security hardening verification tests (S3 brute-force, S4 track throttle, S5 HTML injection)."""
import os
import time
import uuid
import pytest
import requests

def _load_frontend_env():
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    return line.split("=", 1)[1].strip()
    except Exception:
        pass
    return None

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _load_frontend_env()).rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@4a4dixhuit.org"
ADMIN_PASSWORD = "Admin4a4!2026"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and isinstance(data["token"], str) and len(data["token"]) > 0
    assert data["user"]["email"] == ADMIN_EMAIL
    return data["token"]


# ---------- Auth ----------
def test_admin_login_success(admin_token):
    assert admin_token


def test_admin_login_wrong_password_returns_401():
    # Use a random email so we don't affect admin lockout counter
    r = requests.post(f"{API}/auth/login", json={"email": f"nobody_{uuid.uuid4().hex[:6]}@example.com", "password": "bad"})
    assert r.status_code == 401


# ---------- S3: Brute force lockout ----------
def test_brute_force_lockout_after_5_failed_attempts():
    throwaway_email = f"locktest_{uuid.uuid4().hex[:8]}@example.com"
    # First 4 attempts should return 401
    for i in range(1, 5):
        r = requests.post(f"{API}/auth/login", json={"email": throwaway_email, "password": "wrongpass"})
        assert r.status_code == 401, f"Attempt {i}: expected 401 got {r.status_code} {r.text}"

    # 5th attempt: should still fail auth but sets the lock; server returns 401 on 5th based on code
    r5 = requests.post(f"{API}/auth/login", json={"email": throwaway_email, "password": "wrongpass"})
    # By code: 5th attempt sets locked_until then raises 401.
    assert r5.status_code == 401, f"5th attempt expected 401 got {r5.status_code}"

    # 6th attempt should be blocked with 429 (lock now active)
    r6 = requests.post(f"{API}/auth/login", json={"email": throwaway_email, "password": "wrongpass"})
    assert r6.status_code == 429, f"6th attempt expected 429 got {r6.status_code} {r6.text}"

    # Even with CORRECT credentials during lockout (same email+IP), should still be 429
    # We use the throwaway email so no real user exists — but the lock check runs BEFORE credential check.
    r_correct = requests.post(f"{API}/auth/login", json={"email": throwaway_email, "password": ADMIN_PASSWORD})
    assert r_correct.status_code == 429, f"During lockout, expected 429 got {r_correct.status_code}"


def test_successful_login_clears_failed_counter():
    # Create some failed attempts against admin email (fewer than 5 to be safe)
    for _ in range(2):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrongpass"})
        assert r.status_code == 401

    # Successful login should clear the counter
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200

    # Now do 4 more failed attempts — if counter was cleared, none should trigger 429
    for i in range(4):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrongpass"})
        assert r.status_code == 401, f"Attempt after reset {i}: expected 401 got {r.status_code}"

    # Log in successfully again to clean up counter for other tests
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200


# ---------- Contact messages ----------
def test_contact_message_create_and_persist(admin_token):
    payload = {
        "name": "TEST_User",
        "email": f"test_{uuid.uuid4().hex[:6]}@example.com",
        "subject": "TEST_Subject",
        "message": "Hello from security test",
    }
    r = requests.post(f"{API}/messages", json=payload)
    assert r.status_code == 200, f"POST /messages failed: {r.status_code} {r.text}"

    # Fetch messages as admin, verify our message is present
    headers = {"Authorization": f"Bearer {admin_token}"}
    r2 = requests.get(f"{API}/messages", headers=headers)
    assert r2.status_code == 200
    msgs = r2.json()
    assert any(m.get("email") == payload["email"] and m.get("subject") == "TEST_Subject" for m in msgs), \
        "Submitted message not found in GET /messages"


# ---------- Member signup ----------
def test_member_signup_returns_pending():
    payload = {
        "first_name": "TEST",
        "last_name": "Member",
        "email": f"test_member_{uuid.uuid4().hex[:6]}@example.com",
        "phone": "0102030405",
    }
    r = requests.post(f"{API}/members", json=payload)
    assert r.status_code == 200, f"POST /members failed: {r.status_code} {r.text}"
    data = r.json()
    assert data.get("status") == "pending", f"Expected status=pending, got {data}"


# ---------- S5: HTML injection hardening ----------
def test_contact_message_html_injection_is_stored_without_error():
    payload = {
        "name": "TEST_HTML",
        "email": f"htmltest_{uuid.uuid4().hex[:6]}@example.com",
        "subject": "TEST_HTML_Subject",
        "message": "<script>alert(1)</script><b>x</b>",
    }
    r = requests.post(f"{API}/messages", json=payload)
    assert r.status_code == 200, f"POST /messages with HTML failed: {r.status_code} {r.text}"


# ---------- S4: Track throttle ----------
def test_track_throttle_on_second_quick_hit():
    path = f"/security-test-{uuid.uuid4().hex[:6]}"
    r1 = requests.post(f"{API}/track", json={"path": path})
    assert r1.status_code == 200, f"track 1 failed: {r1.status_code}"
    d1 = r1.json()
    # First call should NOT be throttled
    assert d1.get("throttled") is not True, f"First call unexpectedly throttled: {d1}"

    r2 = requests.post(f"{API}/track", json={"path": path})
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2.get("throttled") is True, f"Second call NOT throttled: {d2}"


# ---------- Protected routes ----------
def test_protected_members_requires_auth():
    r = requests.get(f"{API}/members")
    assert r.status_code in (401, 403), f"GET /members without auth got {r.status_code}"


def test_protected_messages_requires_auth():
    r = requests.get(f"{API}/messages")
    assert r.status_code in (401, 403), f"GET /messages without auth got {r.status_code}"
