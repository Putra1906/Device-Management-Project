from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime
from dummy import setup_database

# Inisialisasi Aplikasi Flask
app = Flask(__name__)

# Mengaktifkan CORS untuk semua domain
CORS(app)

DB_NAME = "database.db"

# Menjalankan setup database saat aplikasi pertama kali dimulai
setup_database()

# Route untuk Login API
@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400

        # Validasi hardcoded
        if username == 'admin' and password == 'admin':
            return jsonify({
                "success": True,
                "message": "Login successful"
            })
        else:
            return jsonify({
                "error": "Incorrect username or password"
            }), 401
    except Exception as e:
        # Menangani error jika request body bukan JSON
        return jsonify({"error": "Invalid request format"}), 400

# Route untuk mendapatkan semua device (ini bisa digunakan oleh dashboard)
@app.route('/api/devices', methods=['GET'])
def get_devices():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM devices")
    devices = cursor.fetchall()
    conn.close()
    
    # Mengubah data menjadi format JSON yang bisa dibaca frontend
    devices_list = []
    for device in devices:
        devices_list.append({
            "id": device[0],
            "name": device[1],
            "ip_address": device[2],
            "location": device[3],
            "status": device[4],
            "detected_at": device[5],
            "latitude": device[6],
            "longitude": device[7]
        })
    return jsonify({"devices": devices_list})
    
# Catatan: Route lainnya seperti /add, /edit, dll, adalah untuk template HTML 
# dan tidak dipanggil oleh frontend Next.js Anda. Mereka bisa dibiarkan saja.

@app.route('/')
def index():
    keyword = request.args.get('q', '').lower()
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    if keyword:
        query = """
            SELECT * FROM devices
            WHERE lower(name) LIKE ? OR lower(ip_address) LIKE ?
            OR lower(location) LIKE ? OR lower(status) LIKE ?
        """
        args = [f"%{keyword}%"] * 4
        cursor.execute(query, args)
    else:
        cursor.execute("SELECT * FROM devices")

    devices = cursor.fetchall()
    conn.close()
    return render_template('index.html', devices=devices, keyword=keyword)

@app.route('/add', methods=['GET', 'POST'])
def add_device():
    if request.method == 'POST':
        name = request.form['name']
        ip_address = request.form['ip_address']
        location = request.form['location']
        status = request.form['status']
        latitude = request.form.get('latitude')
        longitude = request.form.get('longitude')
        detected_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO devices (name, ip_address, location, status, detected_at, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (name, ip_address, location, status, detected_at, latitude, longitude))
        conn.commit()
        conn.close()
        return redirect(url_for('index'))
    return render_template('add.html')


@app.route('/edit/<int:id>', methods=['GET', 'POST'])
def edit_device(id):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    if request.method == 'POST':
        name = request.form['name']
        ip_address = request.form['ip_address']
        location = request.form['location']
        status = request.form['status']
        latitude = request.form.get('latitude')
        longitude = request.form.get('longitude')

        cursor.execute("""
            UPDATE devices
            SET name = ?, ip_address = ?, location = ?, status = ?, latitude = ?, longitude = ?
            WHERE id = ?
        """, (name, ip_address, location, status, latitude, longitude, id))
        conn.commit()
        conn.close()
        return redirect(url_for('index'))

    cursor.execute("SELECT * FROM devices WHERE id = ?", (id,))
    device = cursor.fetchone()
    conn.close()
    return render_template('edit.html', device=device)

@app.route('/delete/<int:id>')
def delete_device(id):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM devices WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return redirect(url_for('index'))