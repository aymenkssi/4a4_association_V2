"""Backend tests for member validation chain feature.

Covers:
- POST /api/members public creation (status=pending)
- PATCH /api/members/{id}/status admin (approved/rejected/pending, 400/404, 403 for user)
- GET /api/members admin (403 for user)
"""
import os
import uuid
import pytest
import requests
from pathlib import Path

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')
if not BASE_URL:
    for line in Path('/app/frontend/.env').read_text().splitlines():
        if line.startswith('REACT_APP_BACKEND_URL='):
            BASE_URL = line.split('=', 1)[1].strip()
BASE_URL = BASE_URL.rstrip('/')

ADMIN_EMAIL = 'admin@4a4dixhuit.org'
ADMIN_PASSWORD = 'Admin4a4!2026'

created_member_ids = []
created_user_emails = []


@pytest.fixture(scope='module')
def admin_headers():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


@pytest.fixture(scope='module')
def user_headers():
    suffix = uuid.uuid4().hex[:8]
    email = f"test_mv_user_{suffix}@example.com"
    payload = {
        "name": f"TEST MV User {suffix}",
        "email": email,
        "phone": "0102030405",
        "password": "Passw0rd!",
        "rgpd_consent": True,
    }
    r = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
    assert r.status_code == 200, r.text
    token = r.json()['token']
    created_user_emails.append(email)
    return {"Authorization": f"Bearer {token}"}


def _create_member():
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "first_name": "TESTMV",
        "last_name": f"User{suffix}",
        "email": f"test_mv_{suffix}@example.com",
        "phone": "0601020304",
        "address": "1 rue de Test",
        "interests": ["ateliers", "bénévolat"],
        "message": "Test membership request",
    }
    r = requests.post(f"{BASE_URL}/api/members", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    created_member_ids.append(data['id'])
    return data


# ---------- POST /api/members ----------
class TestCreateMember:
    def test_create_public_no_auth_returns_pending(self):
        m = _create_member()
        assert m['status'] == 'pending'
        assert 'id' in m
        assert m['first_name'] == 'TESTMV'
        assert '_id' not in m

    def test_create_missing_required_returns_422(self):
        r = requests.post(f"{BASE_URL}/api/members", json={"first_name": "x"})
        assert r.status_code == 422


# ---------- PATCH /api/members/{id}/status ----------
class TestUpdateMemberStatus:
    def test_approve(self, admin_headers):
        m = _create_member()
        r = requests.patch(f"{BASE_URL}/api/members/{m['id']}/status",
                           json={"status": "approved"}, headers=admin_headers)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body == {"ok": True, "status": "approved"}
        # verify via GET
        g = requests.get(f"{BASE_URL}/api/members", headers=admin_headers)
        assert g.status_code == 200
        found = [x for x in g.json() if x['id'] == m['id']]
        assert found and found[0]['status'] == 'approved'
        assert 'validated_at' in found[0]
        assert found[0].get('validated_by') == ADMIN_EMAIL

    def test_reject(self, admin_headers):
        m = _create_member()
        r = requests.patch(f"{BASE_URL}/api/members/{m['id']}/status",
                           json={"status": "rejected"}, headers=admin_headers)
        assert r.status_code == 200
        assert r.json()['status'] == 'rejected'

    def test_reset_to_pending(self, admin_headers):
        m = _create_member()
        requests.patch(f"{BASE_URL}/api/members/{m['id']}/status",
                       json={"status": "approved"}, headers=admin_headers)
        r = requests.patch(f"{BASE_URL}/api/members/{m['id']}/status",
                           json={"status": "pending"}, headers=admin_headers)
        assert r.status_code == 200
        assert r.json()['status'] == 'pending'

    def test_invalid_status_returns_400(self, admin_headers):
        m = _create_member()
        r = requests.patch(f"{BASE_URL}/api/members/{m['id']}/status",
                           json={"status": "banana"}, headers=admin_headers)
        assert r.status_code == 400

    def test_unknown_id_returns_404(self, admin_headers):
        r = requests.patch(f"{BASE_URL}/api/members/nonexistent-id/status",
                           json={"status": "approved"}, headers=admin_headers)
        assert r.status_code == 404

    def test_user_token_gets_403(self, user_headers):
        m = _create_member()
        r = requests.patch(f"{BASE_URL}/api/members/{m['id']}/status",
                           json={"status": "approved"}, headers=user_headers)
        assert r.status_code == 403


# ---------- GET /api/members admin gate ----------
class TestListMembersAccess:
    def test_user_token_gets_403(self, user_headers):
        r = requests.get(f"{BASE_URL}/api/members", headers=user_headers)
        assert r.status_code == 403

    def test_admin_ok(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/members", headers=admin_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------- Cleanup ----------
def test_zzz_cleanup(request):
    # Login as admin to cleanup
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        return
    headers = {"Authorization": f"Bearer {r.json()['token']}"}
    for mid in created_member_ids:
        requests.delete(f"{BASE_URL}/api/members/{mid}", headers=headers)
    # try to delete throwaway users via admin endpoint if it exists
    for email in created_user_emails:
        # find user id
        gu = requests.get(f"{BASE_URL}/api/users", headers=headers)
        if gu.status_code == 200:
            for u in gu.json():
                if u.get('email') == email:
                    requests.delete(f"{BASE_URL}/api/users/{u['id']}", headers=headers)
    print(f"Cleaned {len(created_member_ids)} members and attempted {len(created_user_emails)} users.")
