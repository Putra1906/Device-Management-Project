from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import sqlite3
import os

# Inisialisasi Aplikasi Flask
app = Flask(__name__)
CORS(app)

DB_NAME = "database.db"

# --- Database Setup Function ---
def setup_database():
    """Membuat database dan tabel 'devices' jika belum ada."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            ip_address TEXT NOT NULL UNIQUE,
            location TEXT,
            status TEXT,
            detected_at TEXT,
            latitude REAL,
            longitude REAL,
            linked_area TEXT
        )
    """)
    conn.commit()
    conn.close()
    print("Database SQLite and table 'devices' are ready.")

setup_database()

# --- Helper Function ---
def get_all_devices_from_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM devices ORDER BY id DESC")
    devices = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return devices

# --- API Routes ---
@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400
        if username == 'admin' and password == 'admin':
            return jsonify({"success": True, "message": "Login successful"})
        else:
            return jsonify({"error": "Incorrect username or password"}), 401
    except Exception:
        return jsonify({"error": "Invalid request format"}), 400

@app.route('/api/devices', methods=['GET'])
def get_devices():
    devices_list = get_all_devices_from_db()
    return jsonify({"devices": devices_list})

@app.route('/api/agent/report', methods=['POST'])
def agent_report():
    discovered_devices = request.json
    if not discovered_devices:
        return jsonify({"error": "No data received"}), 400

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    try:
        for device in discovered_devices:
            ip = device.get('ip_address')
            detected_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            cursor.execute("SELECT id FROM devices WHERE ip_address = ?", (ip,))
            result = cursor.fetchone()

            if result:
                cursor.execute("UPDATE devices SET status = ?, detected_at = ? WHERE ip_address = ?", 
                               (device.get('status'), detected_at, ip))
            else:
                cursor.execute("""
                    INSERT INTO devices (name, ip_address, location, status, detected_at, linked_area)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    device.get('name', f"Device-{ip.split('.')[-1]}"),
                    ip,
                    device.get('location', 'Auto-Discovered'),
                    device.get('status', 'Allowed'),
                    detected_at,
                    device.get('linked_area', 'Internal-LAN')
                ))
        
        conn.commit()
        return jsonify({"success": True, "message": "Report received and processed."})

    except Exception as e:
        conn.rollback()
        print(f"Error processing agent report: {e}")
        return jsonify({"error": "Failed to process report on the server."}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)