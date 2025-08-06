from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime
import pandas as pd
import os
from flask_socketio import SocketIO, emit

# Inisialisasi Aplikasi Flask dan SocketIO
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret-key-for-production'
socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app)

DB_NAME = "database.db"
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# --- Database Setup Function (dari dummy.py) ---
def setup_database():
    """Memastikan database dan tabel 'devices' ada, tanpa data awal."""
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

# Menjalankan setup database saat aplikasi pertama kali dimulai
setup_database()

# --- Helper Functions untuk Real-time ---
def get_all_devices_from_db():
    # ... (sisa fungsi ini sama persis)
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM devices ORDER BY id DESC")
    devices = cursor.fetchall()
    conn.close()
    return [dict(row) for row in devices]

def broadcast_update():
    # ... (sisa fungsi ini sama persis)
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
    # ... (sisa fungsi ini sama persis)
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
    except Exception as e:
        return jsonify({"error": "Invalid request format"}), 400

@app.route('/api/devices', methods=['GET'])
def get_devices():
    devices_list = get_all_devices_from_db()
    return jsonify({"devices": devices_list})

@app.route('/api/upload_excel', methods=['POST'])
def upload_excel():
    # ... (sisa fungsi ini sama persis)
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file and file.filename.endswith('.xlsx'):
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)
        
        try:
            df = pd.read_excel(filepath)
            conn = sqlite3.connect(DB_NAME)
            cursor = conn.cursor()
            
            for index, row in df.iterrows():
                detected_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                cursor.execute("""
                    INSERT INTO devices (name, ip_address, location, status, detected_at, latitude, longitude, linked_area)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (row['name'], row['ip_address'], row['location'], row['status'], detected_at, row.get('latitude'), row.get('longitude'), row.get('linked_area')))
            
            conn.commit()
            conn.close()
            os.remove(filepath)
            
            broadcast_update()
            return jsonify({"success": True, "message": "Devices added successfully from Excel file."})

        except Exception as e:
            return jsonify({"error": str(e)}), 500
            
    return jsonify({"error": "Invalid file type"}), 400

@app.route('/api/agent/report', methods=['POST'])
def agent_report():
    # ... (sisa fungsi ini sama persis)
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

# --- Main Execution ---
if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0')