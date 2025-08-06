from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime
import os
from flask_socketio import SocketIO, emit

# Inisialisasi Aplikasi Flask dan SocketIO
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret-key-for-production'
socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app)

DB_NAME = "database.db"

# --- Database Setup Function ---
def setup_database():
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
    try:
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_ip_address ON devices (ip_address)")
    except sqlite3.OperationalError:
        pass
    print("Database and table 'devices' are ready.")
    conn.commit()
    conn.close()

setup_database()

# --- Helper Functions untuk Real-time ---
def get_all_devices_from_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM devices ORDER BY id DESC")
    devices = cursor.fetchall()
    conn.close()
    return [dict(row) for row in devices]

def broadcast_update():
    devices = get_all_devices_from_db()
    socketio.emit('update', {'devices': devices})
    print("Broadcasted data update to all clients.")

# --- SocketIO Event Handlers ---
@socketio.on('connect')
def handle_connect():
    print('Client connected')
    broadcast_update()

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

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

# FUNGSI UPLOAD EXCEL DIHAPUS DARI VERSI DEPLOYMENT UNTUK MENGHINDARI ERROR
# @app.route('/api/upload_excel', methods=['POST'])
# def upload_excel():
#     return jsonify({"error": "This feature is not available in the deployed version due to size limitations."}), 501


@app.route('/api/agent/report', methods=['POST'])
def agent_report():
    discovered_devices = request.json
    if not discovered_devices:
        return jsonify({"error": "No data received"}), 400

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    for device in discovered_devices:
        ip = device.get('ip_address')
        cursor.execute("SELECT id FROM devices WHERE ip_address = ?", (ip,))
        result = cursor.fetchone()
        
        detected_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        if result:
            device_id = result[0]
            cursor.execute("UPDATE devices SET status = ?, detected_at = ? WHERE id = ?", (device.get('status'), detected_at, device_id))
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
    conn.close()
    
    broadcast_update()
    return jsonify({"success": True, "message": "Report received and processed."})

# --- Main Execution Entry Point for Vercel ---
# Vercel akan menggunakan 'app' ini sebagai entry point.
# Kita tidak perlu lagi menjalankan 'socketio.run()' secara manual.