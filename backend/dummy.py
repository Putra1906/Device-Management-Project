import sqlite3
from datetime import datetime

DB_NAME = "database.db"

def setup_database():
    # 1. Buat koneksi dan tabel (sama seperti init_db)
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            ip_address TEXT NOT NULL,
            location TEXT,
            status TEXT,
            detected_at TEXT,
            latitude REAL,
            longitude REAL,
            linked_area TEXT
        )
    """)
    
    # 2. Cek apakah tabel 'devices' sudah punya data
    cursor.execute("SELECT COUNT(id) FROM devices")
    count = cursor.fetchone()[0]

    # 3. Jika tabel kosong, baru masukkan data awal
    if count == 0:
        print("Database is empty, inserting dummy data...")
        
        base_lat = -6.938174
        base_lng = 107.661176

        def offset(i):
            return round(base_lat + (i % 3) * 0.0003, 6), round(base_lng + (i % 4) * 0.0004, 6)

        device_entries = [
            ("Core Router", "192.168.10.1", "Server Room", "Allowed", "JKT-IX"),
            ("Access Point - Lantai 1", "192.168.10.10", "Lantai 1", "Allowed", "CBN-Direct"),
            ("Laptop Tamu", "192.168.10.20", "Lobby", "Blocked", "Guest-Net"),
            ("Printer Utama", "192.168.10.30", "Ruang HR", "Allowed", "Office-LAN"),
            ("Smart TV", "192.168.10.40", "Ruang Meeting", "Blocked", "Guest-Net"),
            ("Server File", "192.168.10.50", "Data Center", "Allowed", "JKT-IX"),
            ("CCTV Utama", "192.168.10.60", "Area Parkir", "Maintenance", "Security-Net"),
            ("Laptop Staff", "192.168.10.70", "Ruang Finance", "Allowed", "Office-LAN"),
            ("Switch Gedung", "192.168.10.80", "Ruang Jaringan", "Allowed", "JKT-IX"),
            ("Access Point - Lantai 2", "192.168.10.90", "Lantai 2", "Maintenance", "CBN-Direct"),
        ]

        dummy_devices = []
        for i, (name, ip, loc, status, area) in enumerate(device_entries):
            lat, lng = offset(i)
            detected_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            dummy_devices.append((name, ip, loc, status, detected_at, lat, lng, area))

        cursor.executemany("""
            INSERT INTO devices (name, ip_address, location, status, detected_at, latitude, longitude, linked_area)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, dummy_devices)
        
        print("✅ Dummy data has been inserted!")

    else:
        print("Database already has data. Skipping dummy data insertion.")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    setup_database()