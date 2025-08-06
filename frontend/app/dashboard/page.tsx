"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"

// Dynamically import the Map component to avoid SSR issues
const DeviceMap = dynamic(() => import("@/components/device-map"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
        <p className="text-gray-500">Loading map...</p>
      </div>
    </div>
  ),
})

interface Device {
  id: number;
  ip_address: string;
  name: string;
  location: string;
  status: string;
  detected_at: string;
  latitude?: number;
  longitude?: number;
  linked_area?: string;
}

export default function Dashboard() {
  const [devices, setDevices] = useState<Device[]>([])
  const [searchKeyword, setSearchKeyword] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<{ username: string } | null>(null)
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDevices = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://device-management-project.vercel.app";
      const response = await fetch(`${apiUrl}/api/devices`);
      const data = await response.json();
      setDevices(data.devices || []);
    } catch (error) {
      console.error("Error fetching devices:", error);
    } finally {
      if (isLoading) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    const userData = localStorage.getItem("user")

    if (!isAuthenticated) {
      router.push("/")
      return
    }

    if (userData) {
      setUser(JSON.parse(userData))
    }

    fetchDevices(); // Panggil pertama kali

    const intervalId = setInterval(fetchDevices, 5000); // Panggil setiap 5 detik

    return () => clearInterval(intervalId); // Bersihkan saat komponen unmount
  }, [router, isLoading]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    alert("Fitur upload Excel dinonaktifkan pada versi online.");
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("user")
    router.push("/")
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
    switch (status?.toLowerCase()) {
      case "allowed": return `${baseClasses} bg-green-100 text-green-800`;
      case "blocked": return `${baseClasses} bg-red-100 text-red-800`;
      case "maintenance": return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default: return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const filteredDevices = devices.filter(device =>
    Object.values(device).some(value =>
      String(value).toLowerCase().includes(searchKeyword.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center mr-3">
                                <span className="text-white font-bold text-lg">T</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-red-600">Telkomsel</h1>
                                <p className="text-sm text-gray-600">Admin Dashboard</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-700">Welcome, {user?.username}</span>
                        <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* ... (Konten lainnya tetap sama seperti kode Anda) ... */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Linked Area</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Detected</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredDevices.map((device) => (
                                <tr key={device.ip_address} className="hover:bg-gray-50 transition-colors duration-150">
                                    {/* ... (Tampilan baris tabel Anda sudah benar) ... */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.ip_address}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.location}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.linked_area || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap"><span className={getStatusBadge(device.status)}>{device.status}</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.detected_at}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>
  )
}