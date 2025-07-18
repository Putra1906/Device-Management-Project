from flask import Flask, render_template, request, redirect, url_for
import sqlite3
from datetime import datetime

app = Flask(__name__)
DB_NAME = "database.db"

# Inisialisasi database
def init_db():
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
            longitude REAL
        )
    """)
    conn.commit()
    conn.close()

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

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
