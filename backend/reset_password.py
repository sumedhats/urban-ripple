import sqlite3
from getpass import getpass
from pwdlib import PasswordHash

DB = "urban_ripple.db"

email = input("Enter account email: ").strip().lower()
password = getpass("Enter new password (minimum 8 characters): ")
confirm = getpass("Confirm new password: ")

if len(password) < 8:
    raise SystemExit("Password must contain at least 8 characters.")

if password != confirm:
    raise SystemExit("Passwords do not match.")

hashed = PasswordHash.recommended().hash(password)

with sqlite3.connect(DB) as conn:
    cursor = conn.execute(
        "UPDATE users SET password_hash = ? WHERE email = ?",
        (hashed, email)
    )

    if cursor.rowcount != 1:
        raise SystemExit("Account not found. No password was changed.")

print("\nSUCCESS: Password updated.")
print("Account:", email)
