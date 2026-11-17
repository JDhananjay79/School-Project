"""
Root application runner for Happy English Medium School.
Serves both the school frontend website and the QR tracking API.
"""
import os
import threading
import webbrowser
from api.index import app

def open_browser():
    """Automatically open the website in the default browser."""
    webbrowser.open_new("http://127.0.0.1:5000")

if __name__ == "__main__":
    url = "http://127.0.0.1:5000"
    print("=" * 60)
    print("🏫 Happy English Medium School Server is Running!")
    print(f"👉 Website URL:       {url}")
    print(f"👉 Health Check:      {url}/health")
    print(f"👉 QR Track Endpoint: {url}/api/qr-track?trkid=TEST")
    print("=" * 60)
    print("🌐 Launching browser at http://localhost:5000 ...")

    # Automatically open browser once when the server is ready
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        threading.Timer(1.0, open_browser).start()
    elif not app.debug:
        threading.Timer(1.0, open_browser).start()

    # Bind strictly to localhost (127.0.0.1) so NO admin rights or firewall permissions are needed
    app.run(host="127.0.0.1", port=5000, debug=True)
