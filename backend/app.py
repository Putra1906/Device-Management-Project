from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import os
import psycopg2 # Library untuk PostgreSQL

# Inisialisasi Aplikasi Flask
app = Flask(__name__)
CORS(app)

# Mengambil URL koneksi dari Environment Variables yang disediakan Vercel
DATABASE_URL = os.environ.get('POSTGRES_URL')

def get_db_connection():
    """Membuat koneksi ke database Neon."""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

def setup_database():
    """Membuat tabel 'devices' jika belum ada."""
    conn = get_db_connection()
    if conn is None:
        return
    try:
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS devices (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                ip_address TEXT NOT NULL UNIQUE,
                location TEXT,
                status TEXT,
                detected_at TIMESTAMPTZ DEFAULT NOW(),
                latitude REAL,
                longitude REAL,
                linked_area TEXT
            );
        """)
        conn.commit()
        cur.close()
        conn.close()
        print("Database and table 'devices' are ready.")
    except Exception as e:
        print(f"Error setting up database: {e}")

setup_database()

# --- Helper Function ---
def get_all_devices_from_db():
    """Mengambil semua data perangkat dari Neon DB."""
    conn = get_db_connection()
    if conn is None:
        return []
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM devices ORDER BY detected_at DESC")
        devices_raw = cur.fetchall()
        columns = [desc[0] for desc in cur.description]
        devices = [dict(zip(columns, row)) for row in devices_raw]
        cur.close()
        conn.close()
        return devices
    except Exception as e:
        print(f"Error fetching from Neon DB: {e}")
        return []

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

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cur = conn.cursor()
        for device in discovered_devices:
            ip = device.get('ip_address')
            
            # Logic UPSERT (Update or Insert) untuk PostgreSQL
            cur.execute("""
                INSERT INTO devices (name, ip_address, location, status, detected_at, linked_area)
                VALUES (%s, %s, %s, %s, NOW(), %s)
                ON CONFLICT (ip_address) 
                DO UPDATE SET 
                    status = EXCLUDED.status, 
                    detected_at = NOW();
            """, (
                device.get('name', f"Device-{ip.split('.')[-1]}"),
                ip,
                device.get('location', 'Auto-Discovered'),
                device.get('status', 'Allowed'),
                device.get('linked_area', 'Internal-LAN')
            ))
        
        conn.commit()
        return jsonify({"success": True, "message": "Report received and processed."})

    except Exception as e:
        conn.rollback()
        print(f"Error processing agent report: {e}")
        return jsonify({"error": "Failed to process report on the server."}), 500
    finally:
        if conn:
            cur.close()
            conn.close()