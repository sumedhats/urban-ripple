import requests
from getpass import getpass

BASE = "http://127.0.0.1:8000"

print("========== SCENARIO API TEST ==========")

email = input("Enter admin email: ")
password = getpass("Enter admin password: ")

login = requests.post(
    f"{BASE}/api/auth/login",
    json={"email": email, "password": password}
)

print("\nLogin HTTP:", login.status_code)

if login.status_code != 200:
    print("Login failed:", login.text)
    raise SystemExit(1)

token = login.json()["access_token"]

headers = {
    "Authorization": f"Bearer {token}"
}

active = requests.get(
    f"{BASE}/api/scenarios/active-disruptions",
    headers=headers
)

print("\nActive Disruptions HTTP:", active.status_code)
print(active.json())

simulation = requests.post(
    f"{BASE}/api/scenarios/simulate",
    headers=headers,
    json={
        "disruption_type": "road closure",
        "severity": "High",
        "duration_hours": 4,
        "affected_population": 1000,
        "location": "Central Business District"
    }
)

print("\nSimulation HTTP:", simulation.status_code)

if simulation.status_code == 200:
    data = simulation.json()
    print("Risk:", data.get("risk"))
    print("Downstream impacts:", len(data.get("downstream_impacts", [])))
    print("Recommendations:", len(data.get("recommendations", [])))
else:
    print(simulation.text)

print("\n========== TEST COMPLETED ==========")
