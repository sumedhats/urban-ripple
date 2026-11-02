import json
import getpass
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000"

email = input("Admin email: ").strip()
password = getpass.getpass("Admin password: ")

def request(method, endpoint, token=None, payload=None):
    headers = {"Content-Type": "application/json"}

    if token:
        headers["Authorization"] = f"Bearer {token}"

    data = json.dumps(payload).encode() if payload else None

    req = urllib.request.Request(
        BASE_URL + endpoint,
        data=data,
        headers=headers,
        method=method,
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            return response.status, json.loads(response.read())

    except urllib.error.HTTPError as error:
        body = error.read().decode()
        try:
            body = json.loads(body)
        except json.JSONDecodeError:
            pass
        return error.code, body

try:
    print("\n========== ADMIN LOGIN ==========")

    status, result = request(
        "POST",
        "/api/auth/login",
        payload={"email": email, "password": password},
    )

    if status != 200:
        print("LOGIN FAILED:", status, result)
        raise SystemExit(1)

    token = result["access_token"]
    print("LOGIN: PASS")
    print("ROLE:", result["user"]["role"])

    if result["user"]["role"].lower() != "admin":
        print("STOP: This account is not an Admin.")
        raise SystemExit(1)

    tests = [
        ("ML STATUS", "GET", "/api/ml/status"),
        ("ML TRAINING", "POST", "/api/ml/train"),
        ("ML ANOMALIES", "GET", "/api/ml/anomalies"),
    ]

    for label, method, endpoint in tests:
        print(f"\n========== {label} ==========")

        code, response = request(
            method,
            endpoint,
            token=token,
        )

        print("HTTP:", code)
        print(json.dumps(response, indent=2))

finally:
    password = None
    token = None
