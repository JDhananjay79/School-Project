# QR Tracking Endpoint - Usage Guide

## Overview
The Flask API includes a **QR tracking endpoint** that records QR code scans with UTM parameters. This endpoint is backend-only and accessible programmatically.

## Endpoint

### Track QR Scan
```
GET /api/qr-track?trkid=QR001&utm_source=qr&utm_medium=print&utm_campaign=school
```

**Parameters:**
- `trkid` - Unique tracking ID (required)
- `utm_source` - UTM source parameter (optional)
- `utm_medium` - UTM medium parameter (optional)
- `utm_campaign` - UTM campaign parameter (optional)

**Response:**
- Logs the scan to SQLite database
- Redirects to home page with parameters preserved in URL hash

**Database Record:**
```
trkid, utm_source, utm_medium, utm_campaign, scanned_at, ip, user_agent
```

## Running Locally

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Start Flask Server
```bash
python api/index.py
```

Server runs on `http://localhost:5000`

### 3. Test the Endpoint
```bash
# Simple test
http://localhost:5000/api/qr-track?trkid=QR001&utm_source=qr&utm_medium=print&utm_campaign=school

# Or with curl
curl "http://localhost:5000/api/qr-track?trkid=QR001&utm_source=qr&utm_medium=print&utm_campaign=school"
```

## Example Usage

### Generate Tracking URL
```
https://your-domain.vercel.app/api/qr-track?trkid=PROMO_MARCH_2024&utm_source=qr&utm_medium=print&utm_campaign=school
```

### Database Query
View all recorded scans:
```python
import sqlite3

db = "/tmp/qr_tracks.db"
with sqlite3.connect(db) as conn:
    cur = conn.execute("SELECT * FROM qr_scans ORDER BY scanned_at DESC LIMIT 20")
    for row in cur:
        print(row)
```

## Database Schema

```sql
CREATE TABLE qr_scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trkid TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    scanned_at TEXT,
    ip TEXT,
    user_agent TEXT
)
```

## Deployment

### Vercel
```bash
vercel deploy
```

Endpoint will be available at:
`https://your-project.vercel.app/api/qr-track`

### Environment
- Database: SQLite (stored in `/tmp/qr_tracks.db` on Vercel or local directory)
- Language: Python 3.x
- Framework: Flask 3.0.0

## Health Check

Test if server is running:
```bash
curl http://localhost:5000/health
```

Response: `{"status": "ok"}`

## Commands Reference

```bash
# Start development server
python api/index.py

# Install dependencies
pip install -r requirements.txt

# Deploy to Vercel
vercel deploy

# View scans (requires admin access to database)
sqlite3 /tmp/qr_tracks.db "SELECT * FROM qr_scans"
```

## Notes

- ✅ Simple, minimal endpoint - no UI or analytics dashboard
- ✅ Admin-only access (programmatic)
- ✅ Lightweight dependencies (Flask + Werkzeug only)
- ✅ SQLite database for local storage
- ✅ Production-ready for Vercel deployment
