"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

interface Device {
  id: number
  name: string
  ip_address: string
  location: string
  status: string
  latitude?: number
  longitude?: number
}

export default function EditDevice() {
  const [formData, setFormData] = useState({
    name: "",
    ip_address: "",
    location: "",
    status: "Allowed",
    latitude: "",
    longitude: "",
  })
  const [originalData, setOriginalData] = useState<Device | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingDevice, setIsLoadingDevice] = useState(true)
  const [error, setError] = useState("")
  const [fetchError, setFetchError] = useState("")
  const router = useRouter()
  const params = useParams()
  const deviceId = params.id as string

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    if (!isAuthenticated) {
      router.push("/")
      return
    }

    if (deviceId) {
      fetchDevice()
    } else {
      setFetchError("Invalid device ID")
      setIsLoadingDevice(false)
    }
  }, [router, deviceId])

  const fetchDevice = async () => {
    setIsLoadingDevice(true)
    setFetchError("")

    try {
      console.log("Fetching device with ID:", deviceId)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/devices/${deviceId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("Response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Device data received:", data)

        if (data.success && data.device) {
          const device = data.device
          setOriginalData(device)

          // Populate form with device data
          setFormData({
            name: device.name || "",
            ip_address: device.ip_address || "",
            location: device.location || "",
            status: device.status || "Allowed",
            latitude: device.latitude?.toString() || "",
            longitude: device.longitude?.toString() || "",
          })
        } else {
          setFetchError("Invalid response format")
        }
      } else {
        const errorData = await response.json()
        console.error("Error response:", errorData)
        setFetchError(errorData.error || `Failed to fetch device (${response.status})`)
      }
    } catch (error) {
      console.error("Network error:", error)
      setFetchError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoadingDevice(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (error) setError("")
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Device name is required")
      return false
    }
    if (!formData.ip_address.trim()) {
      setError("IP address is required")
      return false
    }

    // Basic IP validation
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/
    if (!ipRegex.test(formData.ip_address)) {
      setError("Please enter a valid IP address")
      return false
    }

    // Check if latitude and longitude are both provided or both empty
    const hasLat = formData.latitude.trim() !== ""
    const hasLng = formData.longitude.trim() !== ""

    if (hasLat !== hasLng) {
      setError("Please provide both latitude and longitude, or leave both empty")
      return false
    }

    // Validate coordinates if provided
    if (hasLat && hasLng) {
      const lat = Number.parseFloat(formData.latitude)
      const lng = Number.parseFloat(formData.longitude)

      if (isNaN(lat) || isNaN(lng)) {
        setError("Please enter valid numeric coordinates")
        return false
      }

      if (lat < -90 || lat > 90) {
        setError("Latitude must be between -90 and 90")
        return false
      }

      if (lng < -180 || lng > 180) {
        setError("Longitude must be between -180 and 180")
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setError("")

    try {
      console.log("Submitting update for device:", deviceId)
      console.log("Form data:", formData)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/devices/${deviceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      console.log("Update response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Update successful:", data)

        // Show success message
        const successMessage = document.createElement("div")
        successMessage.className =
          "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2"
        successMessage.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Device updated successfully!
        `
        document.body.appendChild(successMessage)

        setTimeout(() => {
          if (document.body.contains(successMessage)) {
            document.body.removeChild(successMessage)
          }
          router.push("/dashboard")
        }, 2000)
      } else {
        const errorData = await response.json()
        console.error("Update error:", errorData)
        setError(errorData.error || "Failed to update device")
      }
    } catch (error) {
      console.error("Network error during update:", error)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    if (originalData) {
      setFormData({
        name: originalData.name || "",
        ip_address: originalData.ip_address || "",
        location: originalData.location || "",
        status: originalData.status || "Allowed",
        latitude: originalData.latitude?.toString() || "",
        longitude: originalData.longitude?.toString() || "",
      })
      setError("")
    }
  }

  if (isLoadingDevice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading device...</p>
          <p className="text-sm text-gray-500 mt-2">Device ID: {deviceId}</p>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-100 rounded-full p-3 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Device Not Found</h2>
          <p className="text-gray-600 mb-4">{fetchError}</p>
          <p className="text-sm text-gray-500 mb-6">Device ID: {deviceId}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Back to Dashboard
          </button>
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
              <button
                onClick={() => router.push("/dashboard")}
                className="text-gray-600 hover:text-gray-900 flex items-center space-x-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Dashboard</span>
              </button>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <h1 className="text-xl font-bold text-red-600">Telkomsel</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Edit Device</h2>
            <p className="text-gray-600">Update the device information</p>
            {originalData && (
              <div className="mt-2 text-sm text-gray-500">
                Device ID: {originalData.id} | Last updated: {originalData.detected_at || "Unknown"}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Device Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all duration-200"
                placeholder="e.g., Core Router, Access Point"
                required
              />
            </div>

            <div>
              <label htmlFor="ip_address" className="block text-sm font-semibold text-gray-700 mb-2">
                IP Address *
              </label>
              <input
                type="text"
                id="ip_address"
                name="ip_address"
                value={formData.ip_address}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all duration-200"
                placeholder="192.168.1.1"
                required
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all duration-200"
                placeholder="e.g., Server Room, Floor 2"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all duration-200"
              >
                <option value="Allowed">Allowed</option>
                <option value="Blocked">Blocked</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="latitude" className="block text-sm font-semibold text-gray-700 mb-2">
                  Latitude
                </label>
                <input
                  type="text"
                  id="latitude"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all duration-200"
                  placeholder="-6.938174"
                />
              </div>
              <div>
                <label htmlFor="longitude" className="block text-sm font-semibold text-gray-700 mb-2">
                  Longitude
                </label>
                <input
                  type="text"
                  id="longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all duration-200"
                  placeholder="107.661176"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Updating Device...
                  </div>
                ) : (
                  "Update Device"
                )}
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isLoading}
                className="px-6 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all duration-200"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="px-6 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-3 rounded-xl transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
