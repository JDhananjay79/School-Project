from flask import Flask, request, redirect, jsonify, send_from_directory
from datetime import datetime, timezone
from urllib.parse import urlencode
from werkzeug.utils import secure_filename
import sqlite3
import os
import json
import time
import hashlib
import secrets

# Locate directories
API_DIR = os.path.dirname(__file__)
PUBLIC_DIR = os.path.abspath(os.path.join(API_DIR, "..", "public"))

# Admin and gallery configuration paths with fallbacks for local and Vercel serverless
ADMIN_CONFIG_PATH = os.path.join(API_DIR, "admin_config.json")
TMP_ADMIN_CONFIG_PATH = "/tmp/admin_config.json"

SITE_CONFIG_PATH = os.path.join(PUBLIC_DIR, "data", "site-config.json")
API_SITE_CONFIG_PATH = os.path.join(API_DIR, "data", "site-config.json")
TMP_SITE_CONFIG_PATH = "/tmp/site-config.json"

GALLERY_DATA_PATH = os.path.join(PUBLIC_DIR, "data", "gallery-data.json")
API_GALLERY_DATA_PATH = os.path.join(API_DIR, "data", "gallery-data.json")
TMP_GALLERY_DATA_PATH = "/tmp/gallery-data.json"

GALLERY_UPLOAD_DIR = os.path.join(PUBLIC_DIR, "assets", "images", "gallery")
TMP_UPLOAD_DIR = "/tmp/gallery_uploads"

# In-memory active admin tokens with 10-minute expiry: { token: expire_timestamp }
ACTIVE_ADMIN_SESSIONS = {}

BADGE_MAP = {
    "cultural": "Cultural Fest",
    "sports": "Sports Meet",
    "bubbles": "Brainy Bubbles",
    "traditions": "Tiny Traditions",
    "mini": "Mini Activities"
}

def load_site_config():
    for p in [TMP_SITE_CONFIG_PATH, SITE_CONFIG_PATH, API_SITE_CONFIG_PATH]:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error reading site config from {p}: {e}")
    cfg = {
        "admission_year": "2027-28",
        "is_admission_open": True,
        "copyright_year": "2026"
    }
    save_site_config(cfg)
    return cfg

def save_site_config(cfg):
    saved = False
    for p in [SITE_CONFIG_PATH, API_SITE_CONFIG_PATH]:
        try:
            os.makedirs(os.path.dirname(p), exist_ok=True)
            with open(p, "w", encoding="utf-8") as f:
                json.dump(cfg, f, indent=2)
            saved = True
        except Exception:
            pass
    if not saved and os.path.exists("/tmp"):
        try:
            with open(TMP_SITE_CONFIG_PATH, "w", encoding="utf-8") as f:
                json.dump(cfg, f, indent=2)
        except Exception as e:
            print(f"Error saving site config to /tmp: {e}")

def load_admin_config():
    for p in [TMP_ADMIN_CONFIG_PATH, ADMIN_CONFIG_PATH]:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error reading admin config from {p}: {e}")
    # Default initial PIN: 9822
    default_hash = hashlib.sha256(b"9822").hexdigest()
    cfg = {"pin_hash": default_hash, "failed_attempts": 0, "locked_until": 0}
    save_admin_config(cfg)
    return cfg

def save_admin_config(cfg):
    try:
        os.makedirs(os.path.dirname(ADMIN_CONFIG_PATH), exist_ok=True)
        with open(ADMIN_CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2)
        return
    except Exception:
        pass
    if os.path.exists("/tmp"):
        try:
            with open(TMP_ADMIN_CONFIG_PATH, "w", encoding="utf-8") as f:
                json.dump(cfg, f, indent=2)
        except Exception as e:
            print(f"Error saving admin config to /tmp: {e}")

def load_gallery_items():
    for p in [TMP_GALLERY_DATA_PATH, GALLERY_DATA_PATH, API_GALLERY_DATA_PATH]:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    items = json.load(f)
                    if isinstance(items, list):
                        return items
            except Exception as e:
                print(f"Error loading gallery items from {p}: {e}")
    return []

def save_gallery_items(items):
    saved = False
    for p in [GALLERY_DATA_PATH, API_GALLERY_DATA_PATH]:
        try:
            os.makedirs(os.path.dirname(p), exist_ok=True)
            with open(p, "w", encoding="utf-8") as f:
                json.dump(items, f, indent=2)
            saved = True
        except Exception:
            pass
    if not saved and os.path.exists("/tmp"):
        try:
            with open(TMP_GALLERY_DATA_PATH, "w", encoding="utf-8") as f:
                json.dump(items, f, indent=2)
        except Exception as e:
            print(f"Error saving gallery items to /tmp: {e}")

def is_valid_admin_request(req):
    token = req.headers.get("X-Admin-Token") or req.headers.get("Authorization", "").replace("Bearer ", "").strip()
    if not token and req.is_json:
        token = req.json.get("token")
    if not token and req.form:
        token = req.form.get("token")
    
    if token and token in ACTIVE_ADMIN_SESSIONS:
        if time.time() < ACTIVE_ADMIN_SESSIONS[token]:
            return True
        else:
            del ACTIVE_ADMIN_SESSIONS[token]
    return False

# Initialize Flask app, configuring public directory for static asset delivery
app = Flask(
    __name__,
    static_folder=PUBLIC_DIR if os.path.exists(PUBLIC_DIR) else None,
    static_url_path=""
)

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, DELETE"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, X-Admin-Token, Authorization"
    return response

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        res = jsonify({"status": "ok"})
        res.headers["Access-Control-Allow-Origin"] = "*"
        res.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, DELETE"
        res.headers["Access-Control-Allow-Headers"] = "Content-Type, X-Admin-Token, Authorization"
        return res, 200

# Base application URL (configurable via env var or dynamically detected from request)
DEFAULT_URL = "https://school-project-six-chi.vercel.app"
BASE_URL = os.environ.get("BASE_URL", "").rstrip("/")

# Database path - works on Vercel and local
DB = "/tmp/qr_tracks.db" if os.path.exists("/tmp") else os.path.join(os.path.dirname(__file__), "qr_tracks.db")

def init_db():
    """Initialize QR tracking database"""
    with sqlite3.connect(DB, timeout=10) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS qr_scans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                trkid TEXT,
                utm_source TEXT,
                utm_medium TEXT,
                utm_campaign TEXT,
                scanned_at TEXT,
                ip TEXT,
                user_agent TEXT
            )
        """)
        conn.commit()

init_db()

@app.route("/")
def home():
    """Serve the main school website homepage"""
    if PUBLIC_DIR and os.path.exists(PUBLIC_DIR):
        return send_from_directory(PUBLIC_DIR, "index.html")
    return jsonify({"status": "ok", "message": "Happy School QR Tracking API"}), 200

@app.route("/robots.txt")
def robots_txt():
    """Serve robots.txt for search engine crawlers"""
    if PUBLIC_DIR and os.path.exists(PUBLIC_DIR):
        return send_from_directory(PUBLIC_DIR, "robots.txt", mimetype="text/plain")
    return "User-agent: *\nAllow: /\nDisallow: /api/\n", 200, {"Content-Type": "text/plain"}

@app.route("/sitemap.xml")
def sitemap_xml():
    """Serve sitemap.xml for search engines"""
    if PUBLIC_DIR and os.path.exists(PUBLIC_DIR):
        return send_from_directory(PUBLIC_DIR, "sitemap.xml", mimetype="application/xml")
    return "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"></urlset>", 200, {"Content-Type": "application/xml"}

@app.route("/api/qr-track")
def qr_track():
    """
    Track QR code scan with UTM parameters
    Usage: /api/qr-track?trkid=QR001&utm_source=qr&utm_medium=print&utm_campaign=school
    Logs scan data and redirects to home
    """
    trkid = request.args.get("trkid", "unknown")
    utm_source = request.args.get("utm_source", "")
    utm_medium = request.args.get("utm_medium", "")
    utm_campaign = request.args.get("utm_campaign", "")

    raw_ip = request.headers.get("X-Forwarded-For", request.remote_addr or "")
    ip = raw_ip.split(",")[0].strip() if raw_ip else "unknown"
    user_agent = request.headers.get("User-Agent", "")
    scanned_at = datetime.now(timezone.utc).isoformat()

    try:
        with sqlite3.connect(DB, timeout=10) as conn:
            conn.execute("""
                INSERT INTO qr_scans(trkid, utm_source, utm_medium, utm_campaign, scanned_at, ip, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (trkid, utm_source, utm_medium, utm_campaign, scanned_at, ip, user_agent))
            conn.commit()
        print(f"QR Scan recorded: {trkid} from {ip}")
    except Exception as e:
        print(f"Error recording scan: {e}")

    # Build safe redirect target with encoded parameters
    query_params = {
        "trkid": trkid,
        "utm_source": utm_source,
        "utm_medium": utm_medium,
        "utm_campaign": utm_campaign
    }
    
    # Use BASE_URL if configured, otherwise use current host or default
    base = BASE_URL or request.host_url.rstrip("/") or DEFAULT_URL
    target = f"{base}/#home?{urlencode(query_params)}"
    return redirect(target, code=302)

@app.route("/api/gallery/verify-pin", methods=["POST"])
def verify_pin():
    """Verify admin PIN and issue a 10-minute session token"""
    data = request.get_json(silent=True) or {}
    pin = str(data.get("pin", "")).strip()
    if not pin:
        return jsonify({"success": False, "message": "Please enter your PIN."}), 400

    cfg = load_admin_config()
    now = time.time()

    # Check lockout
    locked_until = cfg.get("locked_until", 0)
    if now < locked_until:
        rem_min = int((locked_until - now) / 60) + 1
        return jsonify({
            "success": False,
            "locked": True,
            "message": f"Too many incorrect attempts. Locked for {rem_min} more minute(s)."
        }), 429

    input_hash = hashlib.sha256(pin.encode("utf-8")).hexdigest()
    if input_hash == cfg.get("pin_hash"):
        # Reset failed attempts
        cfg["failed_attempts"] = 0
        cfg["locked_until"] = 0
        save_admin_config(cfg)

        # Issue 10-minute session token (600 seconds)
        token = secrets.token_hex(24)
        ACTIVE_ADMIN_SESSIONS[token] = now + 600

        return jsonify({
            "success": True,
            "token": token,
            "expires_in": 600,
            "message": "Admin Mode activated for 10 minutes."
        }), 200
    else:
        cfg["failed_attempts"] = cfg.get("failed_attempts", 0) + 1
        attempts_left = max(0, 3 - cfg["failed_attempts"])
        if attempts_left == 0:
            cfg["locked_until"] = now + 900  # 15 minutes lockout
            save_admin_config(cfg)
            return jsonify({
                "success": False,
                "locked": True,
                "message": "Incorrect PIN. 3 failed attempts reached. Locked for 15 minutes."
            }), 429
        else:
            save_admin_config(cfg)
            return jsonify({
                "success": False,
                "message": f"Incorrect PIN. {attempts_left} attempt(s) remaining."
            }), 401

@app.route("/api/gallery/change-pin", methods=["POST"])
def change_pin():
    """Change admin PIN with current PIN verification"""
    data = request.get_json(silent=True) or {}
    curr_pin = str(data.get("current_pin", "")).strip()
    new_pin = str(data.get("new_pin", "")).strip()

    cfg = load_admin_config()
    # Require either a valid active token OR valid current PIN
    if not is_valid_admin_request(request):
        if hashlib.sha256(curr_pin.encode("utf-8")).hexdigest() != cfg.get("pin_hash"):
            return jsonify({"success": False, "message": "Unauthorized or current PIN is incorrect."}), 401

    if len(new_pin) < 4:
        return jsonify({"success": False, "message": "New PIN must be at least 4 characters/digits."}), 400

    cfg["pin_hash"] = hashlib.sha256(new_pin.encode("utf-8")).hexdigest()
    cfg["failed_attempts"] = 0
    cfg["locked_until"] = 0
    save_admin_config(cfg)

    return jsonify({"success": True, "message": "Admin PIN updated successfully!"}), 200

@app.route("/api/gallery/items", methods=["GET"])
def get_gallery_items():
    """Retrieve all gallery photo items"""
    items = load_gallery_items()
    return jsonify({"success": True, "items": items, "total": len(items)}), 200

@app.route("/api/gallery/upload", methods=["POST"])
def upload_gallery_image():
    """Upload a new gallery photo (requires active admin token)"""
    if not is_valid_admin_request(request):
        return jsonify({"success": False, "message": "Admin session expired or invalid."}), 401

    if "file" not in request.files:
        return jsonify({"success": False, "message": "No file uploaded."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"success": False, "message": "No file selected."}), 400

    category = request.form.get("category", "cultural").strip()
    title = request.form.get("title", "").strip() or "School Activity"

    allowed_exts = {".jpg", ".jpeg", ".png", ".webp", ".jfif"}
    _, ext = os.path.splitext(file.filename)
    ext = ext.lower()
    if ext not in allowed_exts:
        return jsonify({"success": False, "message": f"Unsupported format {ext}. Please upload JPG, PNG, or WEBP."}), 400

    os.makedirs(GALLERY_UPLOAD_DIR, exist_ok=True)
    ts = int(time.time())
    clean_name = secure_filename(file.filename)
    if not clean_name:
        clean_name = f"image{ext}"
    saved_filename = f"upload_{ts}_{clean_name}"
    save_path = os.path.join(GALLERY_UPLOAD_DIR, saved_filename)
    file.save(save_path)

    items = load_gallery_items()
    new_item = {
        "id": f"upload-{ts}",
        "category": category,
        "badge": BADGE_MAP.get(category, "School Activity"),
        "src": f"../assets/images/gallery/{saved_filename}",
        "alt": title,
        "title": title
    }
    items.insert(0, new_item)
    save_gallery_items(items)

    return jsonify({
        "success": True,
        "item": new_item,
        "total": len(items),
        "message": "Photo uploaded and published to gallery!"
    }), 200

@app.route("/api/gallery/delete", methods=["POST"])
def delete_gallery_image():
    """Delete a gallery photo (requires active admin token)"""
    if not is_valid_admin_request(request):
        return jsonify({"success": False, "message": "Admin session expired or invalid."}), 401

    data = request.get_json(silent=True) or {}
    item_id = data.get("id")
    if not item_id:
        return jsonify({"success": False, "message": "Photo ID required."}), 400

    items = load_gallery_items()
    deleted_item = None
    remaining_items = []
    for item in items:
        if item.get("id") == item_id:
            deleted_item = item
        else:
            remaining_items.append(item)

    if not deleted_item:
        return jsonify({"success": False, "message": "Photo not found in gallery."}), 404

    # Remove physical file if it exists in the gallery folder
    src = deleted_item.get("src", "")
    if "../assets/images/gallery/" in src:
        filename = src.split("../assets/images/gallery/")[-1]
        file_path = os.path.join(GALLERY_UPLOAD_DIR, filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"Warning: could not delete file {file_path}: {e}")

    save_gallery_items(remaining_items)
    return jsonify({
        "success": True,
        "deleted_id": item_id,
        "total": len(remaining_items),
        "message": "Photo deleted successfully."
    }), 200

@app.route("/api/site-config", methods=["GET"])
def get_site_config():
    """Retrieve global site configuration (admission year, status)"""
    cfg = load_site_config()
    return jsonify({"success": True, "config": cfg}), 200

@app.route("/api/site-config", methods=["POST"])
def update_site_config():
    """Update global site configuration (admission year, status) - requires admin token"""
    if not is_valid_admin_request(request):
        return jsonify({"success": False, "message": "Admin session expired or invalid."}), 401

    data = request.get_json(silent=True) or {}
    new_year = str(data.get("admission_year", "")).strip()
    is_open = bool(data.get("is_admission_open", True))
    copyright_yr = str(data.get("copyright_year", "")).strip()

    if not new_year:
        return jsonify({"success": False, "message": "Admission year cannot be empty (e.g. 2028-29)."}), 400

    cfg = load_site_config()
    cfg["admission_year"] = new_year
    cfg["is_admission_open"] = is_open
    if copyright_yr:
        cfg["copyright_year"] = copyright_yr
    save_site_config(cfg)

    return jsonify({
        "success": True,
        "config": cfg,
        "message": f"Admission year successfully updated to {new_year}!"
    }), 200

@app.route("/health")
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}), 200

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
