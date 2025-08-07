import nmap
import requests
import time
import json
from ipaddress import ip_address

# Konfigurasi
SERVER_URL = "http://127.0.0.1:5000/api/agent/report"
NETWORK_CIDR = "192.168.1.0/24"  # Ganti dengan rentang jaringan Anda
SCAN_INTERVAL_SECONDS = 60  # Pindai setiap 60 detik

# Aturan Auto-Block
BLOCKED_IP_RANGE_START = "192.168.1.5"
BLOCKED_IP_RANGE_END = "192.168.1.10"

def is_ip_in_blocked_range(ip):
    """Memeriksa apakah IP berada dalam rentang yang diblokir."""
    start = int(ip_address(BLOCKED_IP_RANGE_START))
    end = int(ip_address(BLOCKED_IP_RANGE_END))
    current = int(ip_address(ip))
    return start <= current <= end

def scan_network(network_cidr):
    """Memindai jaringan dan mengembalikan daftar perangkat."""
    nm = nmap.PortScanner()
    # Pindai host yang aktif di jaringan (-sn: Ping Scan)
    nm.scan(hosts=network_cidr, arguments='-sn')
    
    devices = []
    for host in nm.all_hosts():
        status = "Allowed"
        if is_ip_in_blocked_range(host):
            status = "Blocked"
            
        device_info = {
            'ip_address': host,
            'name': nm[host].hostname() if nm[host].hostname() else f"Device-{host.split('.')[-1]}",
            'status': status,
            'location': 'Auto-Discovered',
            'linked_area': 'Internal-LAN'
            # Kita tidak mengirimkan lat/long karena tidak bisa dideteksi otomatis
        }
        devices.append(device_info)
    return devices

def report_to_server(devices):
    """Mengirim data perangkat ke server Flask."""
    try:
        headers = {'Content-Type': 'application/json'}
        response = requests.post(SERVER_URL, data=json.dumps(devices), headers=headers)
        if response.status_code == 200:
            print(f"Successfully reported {len(devices)} devices to the server.")
        else:
            print(f"Error reporting to server: {response.status_code} - {response.text}")
    except requests.exceptions.ConnectionError as e:
        print(f"Could not connect to the server at {SERVER_URL}. Is it running?")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    print("Starting Network Scanner Agent...")
    while True:
        print(f"Scanning network {NETWORK_CIDR}...")
        discovered_devices = scan_network(NETWORK_CIDR)
        
        if discovered_devices:
            print(f"Found {len(discovered_devices)} devices.")
            report_to_server(discovered_devices)
        else:
            print("No devices found in this scan.")
            
        print(f"Waiting for {SCAN_INTERVAL_SECONDS} seconds until the next scan...")
        time.sleep(SCAN_INTERVAL_SECONDS)