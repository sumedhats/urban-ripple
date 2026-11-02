import json
import getpass
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000"

accounts = [
    ("Admin", "sumedhats2020@gmail.com"),
    ("Official", "part1_test_dad6f123@example.com"),
    ("Analyst", "rbac_test_3e8453dd@example.com"),
]

def request_api(path, token=None, method="GET", data=None):
    headers = {"Content-Type": "application/json"}

    if token:
        headers["Authorization"] = f"Bearer {token}"

    body = json.dumps(data).encode() if data is not None else None

    req = urllib.request.Request(
        BASE_URL + path,
        data=body,
        headers=headers,
        method=method
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            result = response.read().decode()
            return response.status, json.loads(result) if result else {}

    except urllib.error.HTTPError as error:
        result = error.read().decode()
        try:
            result = json.loads(result)
        except json.JSONDecodeError:
            pass
        return error.code, result

    except Exception as error:
        return 0, str(error)


print("\nURBAN RIPPLE — ROLE ACCESS TEST")
print("=" * 45)

results = []

for role_name, email in accounts:
    print(f"\nTesting {role_name}: {email}")
    password = getpass.getpass("Enter account password: ")

    status, login_data = request_api(
        "/api/auth/login",
        method="POST",
        data={"email": email, "password": password}
    )

    if status != 200:
        print(f"LOGIN FAILED: HTTP {status}")
        print(login_data)
        results.append((role_name, False))
        continue

    token = login_data.get("access_token")
    print("LOGIN: PASS")

    status, profile = request_api("/api/auth/me", token)

    if status == 200:
        user = profile.get("user", {})
        print(f"PROFILE: PASS | Role: {user.get('role')}")
    else:
        print(f"PROFILE: FAIL | HTTP {status}")

    status, analytics = request_api("/api/analytics/overview", token)

    if status == 200:
        print("ANALYTICS: PASS")
    else:
        print(f"ANALYTICS: FAIL | HTTP {status}")

    passed = (
        status == 200
        and user.get("role") == role_name.lower()
    )
    results.append((role_name, passed))

print("\n" + "=" * 45)
print("FINAL RESULTS")

for role, passed in results:
    print(f"{role}: {'PASS' if passed else 'FAIL'}")

if len(results) == 3 and all(result[1] for result in results):
    print("\nSUCCESS: All three roles passed login and analytics tests.")
else:
    print("\nSome tests failed. Review the errors above.")
