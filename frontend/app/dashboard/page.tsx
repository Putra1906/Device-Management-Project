"use client"

import type React from "react"
import { useState, useEffect, ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"

const DeviceMap = dynamic(() => import("@/components/device-map"), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center"><p>Loading map...</p></div>,
})

interface Device {
  id: number;
  name: string;
  ip_address: string;
  location: string;
  status: string;
  detected_at: string;
  area_name?: string;
  latitude?: number;
  longitude?: number;
}

export default function Dashboard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (!isAuthenticated) {
      router.push("/");
      return;
    }
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchDevices();
  }, [router]);

  const fetchDevices = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/devices`);
      const data = await response.json();
      setDevices(data.devices || []);
    } catch (error) {
      console.error("Error fetching devices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!file) {
      alert("Please select an Excel file to upload.");
      return;
    }
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/devices/upload_excel`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        fetchDevices();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert("An error occurred during file upload.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    router.push("/");
  };

  const getStatusBadge = (status: string) => {
    // ... (kode ini tidak berubah) ...
  };
  
  // ... (tampilan loading tidak berubah) ...

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
            {/* ... (konten header tidak berubah) ... */}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ... (Header halaman dan kartu statistik tidak berubah) ... */}

        {/* Search, Add, and Upload Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            {/* Form pencarian */}
            <form onSubmit={(e) => { e.preventDefault(); fetchDevices(); }} className="flex gap-2">
                <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Search devices..."
                    className="block w-full pl-4 pr-3 py-2 border border-gray-300 rounded-lg"
                />
                <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-lg">Search</button>
            </form>
            <div className="flex items-center gap-4">
              <button onClick={() => router.push("/dashboard/add")} className="bg-green-600 text-white px-4 py-2 rounded-lg">
                Add Device
              </button>
              <div className="flex items-center gap-2">
                <input type="file" onChange={handleFileChange} accept=".xlsx,.xls" className="text-sm" />
                <button onClick={handleFileUpload} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                    Upload
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Device Map */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Locations Map</h3>
          <DeviceMap devices={devices} searchKeyword={searchKeyword} />
        </div>
        
        {/* Devices Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Network Area</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {devices.map((device) => (
                  <tr key={device.id}>
                    <td className="px-6 py-4">{device.name}</td>
                    <td className="px-6 py-4">{device.ip_address}</td>
                    <td className="px-6 py-4">{device.area_name || 'N/A'}</td>
                    <td className="px-6 py-4">{device.location}</td>
                    <td className="px-6 py-4"><span className={getStatusBadge(device.status)}>{device.status}</span></td>
                    <td className="px-6 py-4">
                        {/* Tombol edit/delete */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </main>
    </div>
  );
}