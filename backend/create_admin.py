import sqlite3
from pathlib import Path
from datetime import datetime, timezone
from getpass import getpass
from pwdlib import PasswordHash

db = Path(__file__).resolve().parent / "urban_ripple.db"

if not db.exists():
    raise SystemExit("Database not found.")

name = input("Admin name: ").strip()
email = input("Admin email: ").strip().lower()
password = getpass("Admin password: ")

if len(name) < 2 or len(password) < 8 or "@" not in email:
    raise SystemExit("Invalid details. Please try again.")

hashed = PasswordHash.recommended().hash(password)

with sqlite3.connect(db) as conn:
    existing = conn.execute(
        "SELECT id FROM users WHERE email = ?", (email,)
    ).fetchone()

    if existing:
        raise SystemExit("Email already exists. No changes made.")

    conn.execute("""
        INSERT INTO users
        (name, email, password_hash, role, created_at)
        VALUES (?, ?, ?, 'admin', ?)
    """, (
        name,
        email,
        hashed,
        datetime.now(timezone.utc).isoformat()
    ))

print("\nSUCCESS: Admin account created.")
print("Email:", email)
print("Role: admin")
