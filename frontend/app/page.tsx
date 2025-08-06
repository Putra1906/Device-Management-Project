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
  id: number
  name: string
  ip_address: string
  location: string
  status: string
  detected_at: string
  latitude?: number
  longitude?: number
  linked_area?: string
}

export default function Dashboard() {
  const [devices, setDevices] = useState<Device[]>([])
  const [searchKeyword, setSearchKeyword] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<{ username: string } | null>(null)
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

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

    fetchDevices()
  }, [router])

  const fetchDevices = async (keyword = "") => {
    try {
      const url = keyword ? `${process.env.NEXT_PUBLIC_API_URL}/api/devices?q=${encodeURIComponent(keyword)}` : `${process.env.NEXT_PUBLIC_API_URL}/api/devices`;
      const response = await fetch(url)
      const data = await response.json()
      setDevices(data.devices || [])
    } catch (error) {
      console.error("Error fetching devices:", error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload_excel`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            fetchDevices(); // Refresh data
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        console.error("Upload error:", error);
        alert("An error occurred during file upload.");
    }
  };


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchDevices(searchKeyword)
  }

  const refreshDevices = async () => {
    try {
      const url = searchKeyword ? `/api/devices?q=${encodeURIComponent(searchKeyword)}` : "/api/devices"
      const response = await fetch(url)
      const data = await response.json()
      setDevices(data.devices || [])
    } catch (error) {
      console.error("Error refreshing devices:", error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this device?")) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Optimistically update the UI by removing the device from local state
        setDevices(devices.filter((device) => device.id !== id))
      } else {
        alert("Failed to delete device")
      }
    } catch (error) {
      alert("Error deleting device")
    }
  }

  const handleStatusUpdate = async (deviceId: number, newStatus: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        const data = await response.json()
        // Optimistically update the specific device in local state
        setDevices(devices.map((device) => (device.id === deviceId ? { ...device, status: newStatus } : device)))
      } else {
        alert("Failed to update device status")
      }
    } catch (error) {
      alert("Error updating device status")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("user")
    router.push("/")
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"

    switch (status.toLowerCase()) {
      case "allowed":
        return `${baseClasses} bg-green-100 text-green-800`
      case "blocked":
        return `${baseClasses} bg-red-100 text-red-800`
      case "maintenance":
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
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
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Device Management</h2>
          <p className="text-gray-600">Monitor and manage network devices across your infrastructure</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Devices</p>
                <p className="text-2xl font-bold text-gray-900">{devices.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Allowed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {devices.filter((d) => d.status.toLowerCase() === "allowed").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Blocked</p>
                <p className="text-2xl font-bold text-gray-900">
                  {devices.filter((d) => d.status.toLowerCase() === "blocked").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Maintenance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {devices.filter((d) => d.status.toLowerCase() === "maintenance").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Add Device */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <form onSubmit={handleSearch} className="flex gap-3 flex-1 max-w-md">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Search devices..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Search
              </button>
            </form>
            <div className="flex gap-2">
                <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Upload Excel
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".xlsx"
                />

                <button
                onClick={() => router.push("/dashboard/add")}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Device
                </button>
            </div>
          </div>
        </div>

        {/* Device Map */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Device Locations Map
            </h3>
            <div className="text-sm text-gray-500">
              {devices.filter((d) => d.latitude && d.longitude).length} devices with location data
            </div>
          </div>
          <DeviceMap devices={devices} searchKeyword={searchKeyword} />
        </div>

        {/* Devices Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Linked Area
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Detected
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {devices.map((device) => (
                  <tr key={device.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <svg
                              className="h-6 w-6 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{device.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.ip_address}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.linked_area}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(device.status)}>{device.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.detected_at}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2 items-center">
                        <select
                          value={device.status}
                          onChange={(e) => handleStatusUpdate(device.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                        >
                          <option value="Allowed">Allowed</option>
                          <option value="Blocked">Blocked</option>
                          <option value="Maintenance">Maintenance</option>
                        </select>
                        <button
                          onClick={() => router.push(`/dashboard/edit/${device.id}`)}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors duration-150"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(device.id)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors duration-150"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {devices.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No devices found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a new device.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}