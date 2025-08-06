from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from vercel_kv import kv

# Inisialisasi Aplikasi Flask
app = Flask(__name__)
CORS(app)

# --- Helper Function ---
def get_all_devices_from_db():
    """Mengambil semua data perangkat dari Vercel KV."""
    try:
        all_devices_dict = kv.hgetall('devices')
        if not all_devices_dict:
            return []
        devices_list = [{"ip_address": ip, **details} for ip, details in all_devices_dict.items()]
        return sorted(devices_list, key=lambda d: d.get('detected_at', ''), reverse=True)
    except Exception as e:
        print(f"Error fetching from Vercel KV: {e}")
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
    """Endpoint ini menjadi sumber data utama untuk dashboard."""
    devices_list = get_all_devices_from_db()
    return jsonify({"devices": devices_list})

@app.route('/api/agent/report', methods=['POST'])
def agent_report():
    discovered_devices = request.json
    if not discovered_devices:
        return jsonify({"error": "No data received"}), 400

    try:
        pipe = kv.pipeline()
        for device in discovered_devices:
            ip = device.get('ip_address')
            device_data = {
                'name': device.get('name', f"Device-{ip.split('.')[-1]}"),
                'location': device.get('location', 'Auto-Discovered'),
                'status': device.get('status', 'Allowed'),
                'detected_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                'linked_area': device.get('linked_area', 'Internal-LAN')
            }
            pipe.hset('devices', {ip: device_data})
        
        pipe.execute()
        return jsonify({"success": True, "message": "Report received and processed."})

    except Exception as e:
        print(f"Error processing agent report: {e}")
        return jsonify({"error": "Failed to process report on the server."}), 500