import getpass
import requests

BASE = "http://127.0.0.1:8000"

print("========== ADMIN LOGIN ==========")
email = input("Admin email: ")
password = getpass.getpass("Admin password: ")

login = requests.post(
    f"{BASE}/api/auth/login",
    json={"email": email, "password": password}
)

print("Login HTTP:", login.status_code)

if not login.ok:
    print(login.text)
    raise SystemExit("Admin login failed.")

token = login.json().get("access_token")

if not token:
    raise SystemExit("No access token received.")

headers = {"Authorization": f"Bearer {token}"}

endpoints = [
    "/api/intelligence/risk-scores",
    "/api/intelligence/forecast",
    "/api/intelligence/anomalies",
    "/api/intelligence/recommendations",
    "/api/intelligence/multi-hazard"
]

print("\n========== AUTHENTICATED TESTS ==========")

for endpoint in endpoints:
    print("\nTesting:", endpoint)

    try:
        response = requests.get(
            BASE + endpoint,
            headers=headers,
            timeout=15
        )

        print("HTTP:", response.status_code)

        if response.ok:
            print("STATUS: PASS")
        else:
            print("STATUS: CHECK REQUIRED")
            print("Response:", response.text[:500])

    except Exception as error:
        print("ERROR:", error)

print("\n========== TEST COMPLETED ==========")
