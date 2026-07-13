import sqlite3

def check_member():
    conn = sqlite3.connect('e:/Matrimony/backend/matrimony.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, phone, gender, status FROM members ORDER BY id DESC LIMIT 5")
    rows = cursor.fetchall()
    print("Recent Members:")
    for row in rows:
        print(row)
    
    cursor.execute("SELECT id, phone_number, profile_for, gender FROM users ORDER BY id DESC LIMIT 5")
    rows = cursor.fetchall()
    print("\nRecent Users:")
    for row in rows:
        print(row)
        
    conn.close()

if __name__ == "__main__":
    check_member()
