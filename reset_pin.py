"""
Emergency PIN Reset Utility for Happy English Medium School.
Usage:
    python reset_pin.py <new_pin>
Example:
    python reset_pin.py 9822
"""
import sys
import os
import json
import hashlib

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "api", "admin_config.json")

def reset_pin(new_pin: str):
    if not new_pin or len(new_pin.strip()) < 4:
        print("❌ Error: PIN must be at least 4 characters/digits.")
        sys.exit(1)

    pin_clean = new_pin.strip()
    pin_hash = hashlib.sha256(pin_clean.encode("utf-8")).hexdigest()

    data = {
        "pin_hash": pin_hash,
        "failed_attempts": 0,
        "locked_until": 0
    }

    os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print("=" * 50)
    print("✅ Admin PIN successfully updated!")
    print(f"👉 New PIN: {pin_clean}")
    print("👉 All lockout attempts have been reset.")
    print("=" * 50)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python reset_pin.py <new_pin>")
        print("Example: python reset_pin.py 9822")
        sys.exit(1)
    reset_pin(sys.argv[1])

