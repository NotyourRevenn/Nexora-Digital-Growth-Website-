"""
NEXORA DIGITAL - UNIFIED FULL-STACK BACKEND SERVER
High-Performance Python 3.13 Multi-Threaded HTTP REST Server + SQLite Engine
Serves Public Agency Website at / and Protected Admin Portal at /admin
Zero External Dependencies Required.
"""

import os
import sys
import json
import sqlite3
import hashlib
import hmac
import secrets
import datetime
import urllib.parse
import mimetypes
from http.server import HTTPServer, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn

# --- Configuration & Paths ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "nexora.db")
ADMIN_DIR = os.path.join(BASE_DIR, "admin")
PORT = int(os.environ.get("PORT", 5000))

# --- Database Setup & Migration ---
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password, salt=None):
    if not salt:
        salt = secrets.token_hex(16)
    # PBKDF2 HMAC SHA256
    pwd_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()
    return pwd_hash, salt

def verify_password(stored_hash, stored_salt, password):
    pwd_hash, _ = hash_password(password, stored_salt)
    return hmac.compare_digest(stored_hash, pwd_hash)

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Leads Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                name TEXT NOT NULL,
                email TEXT,
                phone TEXT NOT NULL,
                goal TEXT,
                budget TEXT,
                source TEXT,
                status TEXT DEFAULT 'NEW',
                notes TEXT,
                internal_notes TEXT
            )
        """)

        # Newsletter Subscribers Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS subscribers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL
            )
        """)

        # Admin Users Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS admin_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)

        # Active Admin Sessions
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                created_at TEXT NOT NULL,
                expires_at REAL NOT NULL
            )
        """)

        # Agency Settings / Webhook integrations
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """)

        # Seed Default Admin if none exists
        cursor.execute("SELECT COUNT(*) as count FROM admin_users")
        if cursor.fetchone()["count"] == 0:
            default_user = "admin"
            default_pass = "nexora2026!"
            p_hash, p_salt = hash_password(default_pass)
            cursor.execute(
                "INSERT INTO admin_users (username, password_hash, salt, created_at) VALUES (?, ?, ?, ?)",
                (default_user, p_hash, p_salt, datetime.datetime.now().isoformat())
            )
            print(f"[AUTH] Default admin created: Username: '{default_user}' | Password: '{default_pass}'")

        # Seed sample initial leads if table is empty (for rich dashboard preview)
        cursor.execute("SELECT COUNT(*) as count FROM leads")
        if cursor.fetchone()["count"] == 0:
            sample_leads = [
                ("Aarav Mehta", "aarav@urbanlux.in", "+91 98201 44521", "Meta Ads & Viral Reels", "₹2,50,000 / mo", "Consultation Form", "NEW", "Looking to scale D2C luxury streetwear ROAS from 2.2x to 4.5x.", "High potential D2C lead. Call scheduled for tomorrow."),
                ("Priya Sharma", "priya.s@finflow.co", "+91 98112 99843", "B2B LinkedIn Pipeline", "₹5,00,000 / mo", "Proposal Modal: Growth Plan", "CONTACTED", "Fintech SaaS looking for qualified enterprise demo bookings.", "Shared agency pitch deck and scheduled discovery call."),
                ("Rohan Verma", "rohan@gymfuel.shop", "+91 97170 33412", "Full-Funnel Omnichannel Scale", "₹1,00,000 / mo", "Consultation Form", "QUALIFIED", "Fitness nutrition brand wanting Google P-Max and Meta campaign rebuild.", "Budget approved. Preparing customized proposal sprint."),
                ("Sneha Kulkarni", "sneha@craftglow.com", "+91 99304 88719", "Google Ads (Search & P-Max)", "₹75,000 / mo", "Consultation Form", "WON", "Handmade organic skincare brand seeking steady e-commerce sales.", "Onboarding completed. Campaign kickoff on Monday.")
            ]
            for lead in sample_leads:
                cursor.execute("""
                    INSERT INTO leads (name, email, phone, goal, budget, source, status, notes, internal_notes, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (*lead, datetime.datetime.now().isoformat()))

        # Seed sample newsletter subscribers if empty
        cursor.execute("SELECT COUNT(*) as count FROM subscribers")
        if cursor.fetchone()["count"] == 0:
            sample_subs = [
                ("vikram.investments@gmail.com", datetime.datetime.now().isoformat()),
                ("aditi.growth@fashionhub.in", datetime.datetime.now().isoformat()),
                ("founders@scaleuplabs.io", datetime.datetime.now().isoformat())
            ]
            for sub in sample_subs:
                cursor.execute("INSERT OR IGNORE INTO subscribers (email, created_at) VALUES (?, ?)", sub)

        conn.commit()
    print("[DB] Nexora SQLite Database initialized successfully.")

# --- Session & Auth Helpers ---
def create_session(username):
    token = secrets.token_hex(32)
    now = datetime.datetime.now()
    expires_at = (now + datetime.timedelta(days=7)).timestamp()
    with get_db() as conn:
        conn.execute(
            "INSERT INTO sessions (token, username, created_at, expires_at) VALUES (?, ?, ?, ?)",
            (token, username, now.isoformat(), expires_at)
        )
        conn.commit()
    return token

def validate_session(token):
    if not token:
        return None
    now_ts = datetime.datetime.now().timestamp()
    with get_db() as conn:
        row = conn.execute(
            "SELECT username FROM sessions WHERE token = ? AND expires_at > ?",
            (token, now_ts)
        ).fetchone()
        if row:
            return row["username"]
    return None

def invalidate_session(token):
    if not token:
        return
    with get_db() as conn:
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()

# --- HTTP Request Handler ---
class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

class NexoraHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def log_message(self, format, *args):
        # Custom clean logging
        sys.stdout.write(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] {self.command} {self.path} - {args[1]}\n")

    def send_json(self, status_code, data):
        payload = json.dumps(data, default=str).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(payload)

    def get_auth_token(self):
        auth_header = self.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            return auth_header[7:].strip()
        # Fallback to cookie
        cookie_header = self.headers.get("Cookie", "")
        for item in cookie_header.split(";"):
            if "nexora_token=" in item:
                return item.strip().split("=")[1]
        return None

    def require_auth(self):
        token = self.get_auth_token()
        username = validate_session(token)
        if username:
            return username
        # Fallback for local development loopback so machine owner is never locked out
        client_ip = self.client_address[0] if (hasattr(self, 'client_address') and self.client_address) else ""
        if client_ip in ("127.0.0.1", "::1", "localhost", "0.0.0.0"):
            return "admin"
        self.send_json(401, {"error": "Unauthorized", "message": "Valid admin session token required"})
        return None

    def read_json_body(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length == 0:
                return {}
            raw_data = self.rfile.read(content_length).decode("utf-8")
            return json.loads(raw_data)
        except Exception as e:
            return None

    # --- CORS Preflight Handler ---
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    # --- GET Dispatcher ---
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # 1. API: Check Session / Admin Profile
        if path == "/api/auth/me":
            user = self.require_auth()
            if user:
                self.send_json(200, {"authenticated": True, "username": user})
            return

        # 2. API: Get Leads with Filtering, Search & Pagination
        elif path == "/api/leads":
            if not self.require_auth():
                return
            search = query.get("q", [""])[0].strip()
            status = query.get("status", [""])[0].strip()
            goal = query.get("goal", [""])[0].strip()
            
            sql = "SELECT * FROM leads WHERE 1=1"
            params = []

            if status and status.upper() != "ALL":
                sql += " AND status = ?"
                params.append(status.upper())

            if goal and goal.upper() != "ALL":
                sql += " AND goal LIKE ?"
                params.append(f"%{goal}%")

            if search:
                sql += " AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR notes LIKE ?)"
                search_param = f"%{search}%"
                params.extend([search_param, search_param, search_param, search_param])

            sql += " ORDER BY id DESC"

            with get_db() as conn:
                leads = [dict(row) for row in conn.execute(sql, params).fetchall()]
            
            self.send_json(200, {"success": True, "count": len(leads), "leads": leads})
            return

        # 3. API: Export Leads to CSV
        elif path == "/api/leads/export":
            if not self.require_auth():
                return
            
            with get_db() as conn:
                leads = conn.execute("SELECT id, created_at, name, phone, email, goal, budget, source, status, notes, internal_notes FROM leads ORDER BY id DESC").fetchall()
            
            import csv
            import io
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["Lead ID", "Date", "Full Name", "Phone", "Email", "Growth Goal", "Budget", "Source", "Status", "Client Notes", "Internal CRM Notes"])
            for row in leads:
                writer.writerow(list(row))
            
            csv_bytes = output.getvalue().encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/csv; charset=utf-8")
            self.send_header("Content-Disposition", "attachment; filename=\"nexora_leads_export.csv\"")
            self.send_header("Content-Length", str(len(csv_bytes)))
            self.end_headers()
            self.wfile.write(csv_bytes)
            return

        # 4. API: Get Newsletter Subscribers
        elif path == "/api/newsletter":
            if not self.require_auth():
                return
            with get_db() as conn:
                subscribers = [dict(row) for row in conn.execute("SELECT * FROM subscribers ORDER BY id DESC").fetchall()]
            self.send_json(200, {"success": True, "count": len(subscribers), "subscribers": subscribers})
            return

        # 5. API: Get Overall CRM Analytics & KPIs
        elif path == "/api/stats":
            if not self.require_auth():
                return
            with get_db() as conn:
                cursor = conn.cursor()
                total_leads = cursor.execute("SELECT COUNT(*) as c FROM leads").fetchone()["c"]
                new_leads = cursor.execute("SELECT COUNT(*) as c FROM leads WHERE status = 'NEW'").fetchone()["c"]
                contacted_leads = cursor.execute("SELECT COUNT(*) as c FROM leads WHERE status IN ('CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT')").fetchone()["c"]
                won_leads = cursor.execute("SELECT COUNT(*) as c FROM leads WHERE status = 'WON'").fetchone()["c"]
                total_subscribers = cursor.execute("SELECT COUNT(*) as c FROM subscribers").fetchone()["c"]
                
                # Goal Distribution
                goals = [dict(row) for row in cursor.execute("""
                    SELECT goal, COUNT(*) as count FROM leads GROUP BY goal ORDER BY count DESC LIMIT 5
                """).fetchall()]

            win_rate = round((won_leads / total_leads * 100), 1) if total_leads > 0 else 0.0

            self.send_json(200, {
                "success": True,
                "stats": {
                    "total_leads": total_leads,
                    "new_inquiries": new_leads,
                    "in_pipeline": contacted_leads,
                    "won_clients": won_leads,
                    "win_rate": f"{win_rate}%",
                    "total_subscribers": total_subscribers,
                    "top_goals": goals
                }
            })
            return

        # 6. Route Alias: Clean URL for Admin Portal
        if path == "/admin":
            self.send_response(301)
            self.send_header("Location", "/admin/")
            self.end_headers()
            return

        elif path == "/admin/":
            self.path = "/admin/index.html"

        elif path in ("/admin/login", "/admin/login/"):
            self.path = "/admin/login.html"

        elif path == "/admin.js":
            self.path = "/admin/admin.js"

        elif path == "/admin.css":
            self.path = "/admin/admin.css"

        # 7. Serve Static Files (Default Handler)
        return super().do_GET()

    # --- POST Dispatcher ---
    def do_POST(self):
        path = urllib.parse.urlparse(self.path).path
        data = self.read_json_body()

        if data is None and path not in ("/api/auth/logout",):
            self.send_json(400, {"error": "Invalid JSON body"})
            return

        # 1. API: Capture Lead (Public Endpoint for Consultation & Proposal Modals)
        if path == "/api/leads":
            name = (data.get("name") or "").strip()
            phone = (data.get("phone") or "").strip()
            email = (data.get("email") or "").strip()
            goal = (data.get("goal") or "General Growth Consultation").strip()
            budget = (data.get("budget") or "").strip()
            notes = (data.get("notes") or "").strip()
            source = (data.get("source") or "Consultation Form").strip()

            if not name or not phone:
                self.send_json(400, {"error": "Missing required fields", "message": "Full Name and Phone Number are required."})
                return

            now = datetime.datetime.now().isoformat()

            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO leads (name, email, phone, goal, budget, source, status, notes, internal_notes, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, 'NEW', ?, '', ?)
                """, (name, email, phone, goal, budget, source, notes, now))
                lead_id = cursor.lastrowid
                conn.commit()

            print(f"[LEAD CAPTURED] ID #{lead_id}: {name} ({phone}) - Goal: {goal} - Source: {source}")

            self.send_json(201, {
                "success": True,
                "lead_id": lead_id,
                "message": "Thank you! Your growth proposal request has been received. Our strategist will connect with you shortly."
            })
            return

        # 2. API: Capture Newsletter Subscriber (Public)
        elif path == "/api/newsletter":
            email = (data.get("email") or "").strip().lower()
            if not email or "@" not in email:
                self.send_json(400, {"error": "Invalid email address"})
                return

            try:
                now = datetime.datetime.now().isoformat()
                with get_db() as conn:
                    conn.execute("INSERT INTO subscribers (email, created_at) VALUES (?, ?)", (email, now))
                    conn.commit()
                print(f"[NEWSLETTER] New Subscriber: {email}")
                self.send_json(201, {"success": True, "message": "Successfully subscribed to Nexora Digital Growth Insights!"})
            except sqlite3.IntegrityError:
                # Already subscribed
                self.send_json(200, {"success": True, "message": "You are already subscribed to our newsletter!"})
            return

        # 3. API: Admin Login
        elif path == "/api/auth/login":
            username = (data.get("username") or "").strip()
            password = (data.get("password") or "").strip()

            if not username or not password:
                self.send_json(400, {"error": "Username and password required"})
                return

            with get_db() as conn:
                user = conn.execute("SELECT * FROM admin_users WHERE username = ?", (username,)).fetchone()
            
            if not user or not verify_password(user["password_hash"], user["salt"], password):
                self.send_json(401, {"error": "Invalid credentials", "message": "Incorrect username or password."})
                return

            token = create_session(username)
            print(f"[AUTH] Admin logged in: {username}")
            self.send_json(200, {
                "success": True,
                "token": token,
                "username": username,
                "message": "Authentication successful"
            })
            return

        # 4. API: Admin Logout
        elif path == "/api/auth/logout":
            token = self.get_auth_token()
            invalidate_session(token)
            self.send_json(200, {"success": True, "message": "Logged out successfully"})
            return

        # 5. API: Change Admin Password
        elif path == "/api/auth/change-password":
            current_user = self.require_auth()
            if not current_user:
                return

            old_pass = data.get("current_password", "").strip()
            new_pass = data.get("new_password", "").strip()

            if len(new_pass) < 6:
                self.send_json(400, {"error": "Password too short", "message": "New password must be at least 6 characters long."})
                return

            with get_db() as conn:
                user = conn.execute("SELECT * FROM admin_users WHERE username = ?", (current_user,)).fetchone()
                if not verify_password(user["password_hash"], user["salt"], old_pass):
                    self.send_json(400, {"error": "Incorrect password", "message": "Your current password did not match."})
                    return

                new_hash, new_salt = hash_password(new_pass)
                conn.execute(
                    "UPDATE admin_users SET password_hash = ?, salt = ? WHERE username = ?",
                    (new_hash, new_salt, current_user)
                )
                conn.commit()

            print(f"[AUTH] Password updated for user: {current_user}")
            self.send_json(200, {"success": True, "message": "Admin password updated successfully."})
            return

        else:
            self.send_json(404, {"error": "Endpoint not found"})

    # --- PATCH Dispatcher (Update Lead Status & Notes) ---
    def do_PATCH(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path.startswith("/api/leads/"):
            if not self.require_auth():
                return

            try:
                lead_id = int(path.split("/")[-1])
            except ValueError:
                self.send_json(400, {"error": "Invalid lead ID"})
                return

            data = self.read_json_body() or {}
            status = data.get("status")
            internal_notes = data.get("internal_notes")

            updates = []
            params = []

            if status:
                valid_statuses = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "WON", "LOST"]
                if status.upper() in valid_statuses:
                    updates.append("status = ?")
                    params.append(status.upper())

            if internal_notes is not None:
                updates.append("internal_notes = ?")
                params.append(internal_notes)

            if not updates:
                self.send_json(400, {"error": "No valid fields provided to update"})
                return

            params.append(lead_id)
            query = f"UPDATE leads SET {', '.join(updates)} WHERE id = ?"

            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute(query, params)
                if cursor.rowcount == 0:
                    self.send_json(404, {"error": "Lead not found"})
                    return
                conn.commit()

            print(f"[LEAD UPDATED] ID #{lead_id} updated with {data}")
            self.send_json(200, {"success": True, "message": f"Lead #{lead_id} updated successfully."})
            return

        self.send_json(404, {"error": "Endpoint not found"})

    # --- DELETE Dispatcher ---
    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if not self.require_auth():
            return

        # Delete Lead
        if path.startswith("/api/leads/"):
            try:
                lead_id = int(path.split("/")[-1])
            except ValueError:
                self.send_json(400, {"error": "Invalid lead ID"})
                return

            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM leads WHERE id = ?", (lead_id,))
                if cursor.rowcount == 0:
                    self.send_json(404, {"error": "Lead not found"})
                    return
                conn.commit()

            print(f"[LEAD DELETED] ID #{lead_id} deleted.")
            self.send_json(200, {"success": True, "message": f"Lead #{lead_id} deleted successfully."})
            return

        # Delete Subscriber
        elif path.startswith("/api/newsletter/"):
            try:
                sub_id = int(path.split("/")[-1])
            except ValueError:
                self.send_json(400, {"error": "Invalid subscriber ID"})
                return

            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM subscribers WHERE id = ?", (sub_id,))
                conn.commit()

            self.send_json(200, {"success": True, "message": "Subscriber removed."})
            return

        self.send_json(404, {"error": "Endpoint not found"})


# --- Server Entrypoint ---
def run():
    init_db()
    server_address = ("0.0.0.0", PORT)
    httpd = ThreadedHTTPServer(server_address, NexoraHandler)
    print("\n" + "="*65)
    print(" 🚀  NEXORA DIGITAL FULL-STACK WEB ENGINE IS ONLINE!")
    print("="*65)
    print(f" 🌐  Public Agency Website:   http://localhost:{PORT}/")
    print(f" 🔐  Nexora Admin Portal:     http://localhost:{PORT}/admin")
    print(f" 👤  Default Admin Login:     admin / nexora2026!")
    print(f" 📁  SQLite Local Database:   {DB_PATH}")
    print("="*65 + "\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[SERVER] Shutting down gracefully...")
        httpd.shutdown()

if __name__ == "__main__":
    run()
