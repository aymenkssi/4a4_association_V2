"""Backend tests for newsletter feature (register opt-in, admin users, newsletters)."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/') if os.environ.get('REACT_APP_BACKEND_URL') else None
if not BASE_URL:
    # fallback to reading frontend/.env
    from pathlib import Path
    for line in Path('/app/frontend/.env').read_text().splitlines():
        if line.startswith('REACT_APP_BACKEND_URL='):
            BASE_URL = line.split('=', 1)[1].strip().rstrip('/')

ADMIN_EMAIL = 'admin@4a4dixhuit.org'
ADMIN_PASSWORD = 'Admin4a4!2026'

created_user_ids = []
created_newsletter_ids = []


@pytest.fixture(scope='module')
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()['token']


@pytest.fixture(scope='module')
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


def _register(newsletter=None):
    suffix = uuid.uuid4().hex[:8]
    email = f"test_nl_{suffix}@example.com"
    payload = {
        "name": f"TEST_NL {suffix}",
        "email": email,
        "phone": "0102030405",
        "password": "testpass123",
        "rgpd_consent": True,
    }
    if newsletter is not None:
        payload["newsletter"] = newsletter
    r = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    return data['user']['id'], data['token'], email


@pytest.fixture(scope='module', autouse=True)
def cleanup(admin_headers):
    yield
    # cleanup created users and newsletters directly via Mongo
    import asyncio
    from motor.motor_asyncio import AsyncIOMotorClient
    async def _run():
        client = AsyncIOMotorClient(os.environ['MONGO_URL'])
        db = client[os.environ['DB_NAME']]
        if created_user_ids:
            await db.users.delete_many({"id": {"$in": created_user_ids}})
        if created_newsletter_ids:
            await db.newsletters.delete_many({"id": {"$in": created_newsletter_ids}})
        client.close()
    # Load backend env for MONGO_URL/DB_NAME
    from dotenv import load_dotenv
    load_dotenv('/app/backend/.env')
    asyncio.run(_run())


# ---- Register with/without newsletter ----
class TestRegisterNewsletter:
    def test_register_with_newsletter_true(self, admin_headers):
        uid, token, email = _register(newsletter=True)
        created_user_ids.append(uid)
        # verify via admin/users
        r = requests.get(f"{BASE_URL}/api/admin/users", headers=admin_headers)
        assert r.status_code == 200
        users = r.json()
        me = next((u for u in users if u['id'] == uid), None)
        assert me is not None
        assert me.get('newsletter') is True
        assert 'password_hash' not in me
        assert me['email'] == email

    def test_register_with_newsletter_false(self, admin_headers):
        uid, _, _ = _register(newsletter=False)
        created_user_ids.append(uid)
        r = requests.get(f"{BASE_URL}/api/admin/users", headers=admin_headers)
        me = next((u for u in r.json() if u['id'] == uid), None)
        assert me is not None
        assert bool(me.get('newsletter')) is False

    def test_register_without_newsletter_field(self, admin_headers):
        uid, _, _ = _register(newsletter=None)
        created_user_ids.append(uid)
        r = requests.get(f"{BASE_URL}/api/admin/users", headers=admin_headers)
        me = next((u for u in r.json() if u['id'] == uid), None)
        assert me is not None
        assert bool(me.get('newsletter')) is False


# ---- Admin auth guards ----
class TestAdminAuth:
    def test_admin_users_requires_admin(self):
        _, token, _ = _register(newsletter=False)
        # last created id not tracked here separately
        # register returns user id — track for cleanup
        r0 = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        created_user_ids.append(r0.json()['id'])

        r = requests.get(f"{BASE_URL}/api/admin/users", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 403

    def test_admin_users_no_token(self):
        r = requests.get(f"{BASE_URL}/api/admin/users")
        assert r.status_code == 401

    def test_toggle_newsletter_forbidden_for_user(self):
        uid, token, _ = _register(newsletter=False)
        created_user_ids.append(uid)
        r = requests.patch(
            f"{BASE_URL}/api/admin/users/{uid}/newsletter",
            json={"newsletter": True},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert r.status_code == 403

    def test_newsletters_forbidden_for_user(self):
        _, token, _ = _register(newsletter=False)
        r = requests.post(
            f"{BASE_URL}/api/newsletters",
            json={"subject": "x", "body_html": "<p>x</p>"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert r.status_code == 403


# ---- Toggle newsletter ----
class TestToggleNewsletter:
    def test_toggle_flow(self, admin_headers):
        uid, _, _ = _register(newsletter=False)
        created_user_ids.append(uid)
        # toggle ON
        r = requests.patch(f"{BASE_URL}/api/admin/users/{uid}/newsletter",
                           json={"newsletter": True}, headers=admin_headers)
        assert r.status_code == 200
        assert r.json()['newsletter'] is True
        # verify persisted
        r2 = requests.get(f"{BASE_URL}/api/admin/users", headers=admin_headers)
        me = next(u for u in r2.json() if u['id'] == uid)
        assert me['newsletter'] is True
        # toggle OFF
        r = requests.patch(f"{BASE_URL}/api/admin/users/{uid}/newsletter",
                           json={"newsletter": False}, headers=admin_headers)
        assert r.status_code == 200
        assert r.json()['newsletter'] is False

    def test_toggle_unknown_id(self, admin_headers):
        r = requests.patch(
            f"{BASE_URL}/api/admin/users/{uuid.uuid4()}/newsletter",
            json={"newsletter": True}, headers=admin_headers,
        )
        assert r.status_code == 404


# ---- Subscribers count ----
class TestSubscribersCount:
    def test_count_matches(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/newsletters/subscribers-count", headers=admin_headers)
        assert r.status_code == 200
        c = r.json()['count']
        # Compare to actual filter on /admin/users
        users = requests.get(f"{BASE_URL}/api/admin/users", headers=admin_headers).json()
        expected = sum(1 for u in users if u.get('newsletter'))
        assert c == expected


# ---- Send newsletter ----
class TestSendNewsletter:
    def test_send_empty_subject(self, admin_headers):
        r = requests.post(f"{BASE_URL}/api/newsletters",
                          json={"subject": "  ", "body_html": "<p>hi</p>"},
                          headers=admin_headers)
        assert r.status_code == 400

    def test_send_empty_body(self, admin_headers):
        r = requests.post(f"{BASE_URL}/api/newsletters",
                          json={"subject": "Hello", "body_html": "   "},
                          headers=admin_headers)
        assert r.status_code == 400

    def test_send_success_and_history(self, admin_headers):
        # Ensure subscriber count is known
        c = requests.get(f"{BASE_URL}/api/newsletters/subscribers-count", headers=admin_headers).json()['count']
        subject = f"TEST_NL {uuid.uuid4().hex[:6]}"
        r = requests.post(f"{BASE_URL}/api/newsletters",
                          json={"subject": subject, "body_html": "<p>Hello TEST</p>"},
                          headers=admin_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data['ok'] is True
        assert data['recipients_count'] == c
        nl_id = data['newsletter']['id']
        created_newsletter_ids.append(nl_id)

        # verify listed newest-first
        lst = requests.get(f"{BASE_URL}/api/newsletters", headers=admin_headers).json()
        assert lst[0]['id'] == nl_id
        assert lst[0]['subject'] == subject

    def test_list_requires_admin(self):
        r = requests.get(f"{BASE_URL}/api/newsletters")
        assert r.status_code == 401

    def test_subscribers_count_requires_admin(self):
        r = requests.get(f"{BASE_URL}/api/newsletters/subscribers-count")
        assert r.status_code == 401
