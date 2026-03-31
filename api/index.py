from flask import Flask, request, redirect, jsonify
from datetime import datetime
import sqlite3
import os

app = Flask(__name__)

# Database path - works on Vercel and local
DB = "/tmp/qr_tracks.db" if os.path.exists("/tmp") else os.path.join(os.path.dirname(__file__), "qr_tracks.db")

def init_db():
    """Initialize QR tracking database"""
    with sqlite3.connect(DB) as conn:
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

    ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    user_agent = request.headers.get("User-Agent", "")
    scanned_at = datetime.utcnow().isoformat()

    try:
        with sqlite3.connect(DB) as conn:
            conn.execute("""
                INSERT INTO qr_scans(trkid, utm_source, utm_medium, utm_campaign, scanned_at, ip, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (trkid, utm_source, utm_medium, utm_campaign, scanned_at, ip, user_agent))
            conn.commit()
        print(f"QR Scan recorded: {trkid} from {ip}")
    except Exception as e:
        print(f"Error: {e}")

    # Redirect to home with tracking parameters preserved
    target = f"https://school-project-six-chi.vercel.app/#home?trkid={trkid}&utm_source={utm_source}&utm_medium={utm_medium}&utm_campaign={utm_campaign}"
    return redirect(target, code=302)

@app.route("/health")
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok"}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)