import sqlite3
from datetime import datetime

DB_NAME = "database.db"

# Koordinat dasar Telkomsel Regional Jawa Barat
base_lat = -6.938174435034216
base_lng = 107.6611758478811

# Fungsi buat variasi lokasi perangkat (agar tidak semua titik bertumpuk)
def offset(i):
    return round(base_lat + (i % 3) * 0.0003, 6), round(base_lng + (i % 4) * 0.0004, 6)

device_entries = [
    ("Core Router", "192.168.10.1", "Server Room", "Allowed"),
    ("Access Point - Lantai 1", "192.168.10.10", "Lantai 1", "Allowed"),
    ("Laptop Tamu", "192.168.10.20", "Lobby", "Blocked"),
    ("Printer Utama", "192.168.10.30", "Ruang HR", "Allowed"),
    ("Smart TV", "192.168.10.40", "Ruang Meeting", "Blocked"),
    ("Server File", "192.168.10.50", "Data Center", "Allowed"),
    ("CCTV Utama", "192.168.10.60", "Area Parkir", "Maintenance"),
    ("Laptop Staff", "192.168.10.70", "Ruang Finance", "Allowed"),
    ("Switch Gedung", "192.168.10.80", "Ruang Jaringan", "Allowed"),
    ("Access Point - Lantai 2", "192.168.10.90", "Lantai 2", "Maintenance"),
]

# Generate list dengan koordinat dan timestamp
dummy_devices = []
for i, (name, ip, loc, status) in enumerate(device_entries):
    lat, lng = offset(i)
    detected_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    dummy_devices.append((name, ip, loc, status, detected_at, lat, lng))

# Insert ke database
def insert_dummy_data():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # Pastikan kolom sudah ada (gunakan try agar tidak error jika sudah ada)
    try:
        cursor.execute("ALTER TABLE devices ADD COLUMN detected_at TEXT")
        cursor.execute("ALTER TABLE devices ADD COLUMN latitude REAL")
        cursor.execute("ALTER TABLE devices ADD COLUMN longitude REAL")
    except:
        pass

    cursor.executemany("""
        INSERT INTO devices (name, ip_address, location, status, detected_at, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, dummy_devices)

    conn.commit()
    conn.close()
    print("✅ Dummy data berhasil dimasukkan!")

if __name__ == "__main__":
    insert_dummy_data()
