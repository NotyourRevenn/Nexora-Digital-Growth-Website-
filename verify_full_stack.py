"""
Nexora Digital Full-Stack Verification Suite
Tests the complete server, database, authentication, and CRM API pipeline.
"""

import sys
import os
import threading
import time
import urllib.request
import urllib.parse
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)

# Import the server module
import server

PORT = 5055
server.PORT = PORT

# Start server in background thread
httpd = server.ThreadedHTTPServer(("127.0.0.1", PORT), server.NexoraHandler)
t = threading.Thread(target=httpd.serve_forever, daemon=True)
t.start()
time.sleep(1)

print("\n=== STARTING NEXORA FULL-STACK VERIFICATION ===")

def request_json(url, method="GET", data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            try:
                return resp.status, json.loads(content)
            except:
                return resp.status, content
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            return e.code, json.loads(content)
        except:
            return e.code, content

try:
    # 1. Test Public Landing Page
    with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/index.html") as res:
        print(f"1. Landing Page (HTTP {res.status}): OK ({len(res.read())} bytes)")

    # 2. Test Admin Portal HTML
    with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/admin/index.html") as res:
        print(f"2. Admin Portal HTML (HTTP {res.status}): OK ({len(res.read())} bytes)")

    # 3. Test Admin Login API
    status, login_res = request_json(
        f"http://127.0.0.1:{PORT}/api/auth/login",
        method="POST",
        data={"username": "admin", "password": "nexora2026!"}
    )
    assert status == 200, f"Login failed: {login_res}"
    token = login_res["token"]
    print(f"3. Admin Login API (HTTP {status}): Success! Token: {token[:12]}...")

    # 4. Test Auth Verification (/api/auth/me)
    status, me_res = request_json(f"http://127.0.0.1:{PORT}/api/auth/me", token=token)
    assert status == 200 and me_res.get("authenticated") is True
    print(f"4. Auth Verification (HTTP {status}): Authenticated as '{me_res['username']}'")

    # 5. Test Live CRM Stats KPI API
    status, stats_res = request_json(f"http://127.0.0.1:{PORT}/api/stats", token=token)
    assert status == 200
    print(f"5. KPI Stats (HTTP {status}): Total Leads={stats_res['stats']['total_leads']}, In Pipeline={stats_res['stats']['in_pipeline']}")

    # 6. Test Public Lead Submission (Consultation Form)
    test_lead = {
        "name": "Karan Singhania",
        "email": "karan@nexustech.in",
        "phone": "+91 98765 43210",
        "goal": "Viral Video Production & Reels",
        "budget": "₹3,50,000 / mo",
        "notes": "Need high converting short-form reels for product launch in Q1.",
        "source": "Consultation Form"
    }
    status, lead_res = request_json(f"http://127.0.0.1:{PORT}/api/leads", method="POST", data=test_lead)
    assert status == 201
    lead_id = lead_res["lead_id"]
    print(f"6. Public Lead Capture (HTTP {status}): Lead #{lead_id} persisted in SQLite DB!")

    # 7. Test Admin Leads List Retrieval
    status, leads_list = request_json(f"http://127.0.0.1:{PORT}/api/leads?q=Karan", token=token)
    assert status == 200 and leads_list["count"] >= 1
    found = any(l["name"] == "Karan Singhania" for l in leads_list["leads"])
    assert found, "Created lead not found in search results"
    print(f"7. Admin Leads Search & Filter (HTTP {status}): Verified lead retrieved with status '{leads_list['leads'][0]['status']}'")

    # 8. Test Status Update (PATCH)
    status, update_res = request_json(
        f"http://127.0.0.1:{PORT}/api/leads/{lead_id}",
        method="PATCH",
        data={"status": "QUALIFIED", "internal_notes": "High priority client. Scheduled strategy audit on Google Meet."},
        token=token
    )
    assert status == 200
    print(f"8. Status & CRM Notes Update (HTTP {status}): Status changed to QUALIFIED with internal notes!")

    # 9. Test Public Newsletter Subscription
    status, sub_res = request_json(
        f"http://127.0.0.1:{PORT}/api/newsletter",
        method="POST",
        data={"email": "growth.partner@enterprisegroup.com"}
    )
    assert status in (200, 201)
    print(f"9. Newsletter Subscription (HTTP {status}): {sub_res.get('message')}")

    # 10. Test CSV Export Endpoint
    req = urllib.request.Request(f"http://127.0.0.1:{PORT}/api/leads/export", headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req) as resp:
        csv_data = resp.read().decode("utf-8")
        assert "Lead ID,Date,Full Name" in csv_data
        assert "Karan Singhania" in csv_data
        print(f"10. CSV Export (HTTP {resp.status}): Successfully generated {len(csv_data)} bytes CSV report!")

    print("\n🎉 ALL 10 TESTS PASSED! NEXORA DIGITAL FULL-STACK SYSTEM IS 100% OPERATIONAL!\n")

finally:
    httpd.shutdown()
