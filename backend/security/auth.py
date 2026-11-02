import os
import sqlite3
from pathlib import Path
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from pwdlib import PasswordHash
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field

BASE_DIR = Path(__file__).resolve().parents[1]
DB_PATH = BASE_DIR / "urban_ripple.db"

load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET is missing from backend/.env")

password_hash = PasswordHash.recommended()
security = HTTPBearer()
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_users_table():
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'public',
                created_at TEXT NOT NULL
            )
        """)


init_users_table()


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


def create_token(user_id: int, email: str, role: str):
    expiry = datetime.now(timezone.utc) + timedelta(hours=8)
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "exp": expiry
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        user_id = int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    with get_connection() as conn:
        user = conn.execute(
            "SELECT id, name, email, role FROM users WHERE id = ?",
            (user_id,)
        ).fetchone()

    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return dict(user)


@router.post("/register", status_code=201)
def register(data: RegisterRequest):
    email = str(data.email).lower().strip()
    hashed = password_hash.hash(data.password)

    try:
        with get_connection() as conn:
            cursor = conn.execute("""
                INSERT INTO users (name, email, password_hash, role, created_at)
                VALUES (?, ?, ?, 'public', ?)
            """, (
                data.name.strip(),
                email,
                hashed,
                datetime.now(timezone.utc).isoformat()
            ))
            user_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="Email already registered")

    return {
        "message": "Registration successful",
        "user": {
            "id": user_id,
            "name": data.name.strip(),
            "email": email,
            "role": "public"
        }
    }


@router.post("/login")
def login(data: LoginRequest):
    email = str(data.email).lower().strip()

    with get_connection() as conn:
        user = conn.execute(
            "SELECT * FROM users WHERE email = ?",
            (email,)
        ).fetchone()

    if user is None or not password_hash.verify(
        data.password, user["password_hash"]
    ):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(user["id"], user["email"], user["role"])

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
    }


@router.get("/me")
def my_profile(user: dict = Depends(get_current_user)):
    return {"user": user}
