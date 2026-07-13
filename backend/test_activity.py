import urllib.request
import json
import sqlite3

def test_api():
    # 1. Register new user
    reg_data = json.dumps({
        "name": "Activity Test User",
        "phone_number": "8887776665",
        "password": "mypassword123",
        "profile_for": "My-self",
        "gender": "Female"
    }).encode('utf-8')
    
    req = urllib.request.Request("http://127.0.0.1:8000/api/register", data=reg_data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as response:
            print("Register response:", response.read().decode('utf-8'))
    except Exception as e:
        print("Register error (maybe already registered):", e)
        
    # 2. Login user
    login_data = json.dumps({
        "phone_number": "8887776665",
        "password": "mypassword123"
    }).encode('utf-8')
    req = urllib.request.Request("http://127.0.0.1:8000/api/login", data=login_data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as response:
            print("Login response:", response.read().decode('utf-8'))
    except Exception as e:
        print("Login error:", e)

    # 3. Check DB Activity Logs
    conn = sqlite3.connect('e:/Matrimony/backend/matrimony.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, member_id, action, device, created_at FROM activity_logs ORDER BY id DESC LIMIT 5")
    rows = cursor.fetchall()
    print("\nRecent Activity Logs:")
    for row in rows:
        print(row)
    conn.close()

if __name__ == "__main__":
    test_api()
