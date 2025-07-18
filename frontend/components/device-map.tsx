"use client"

import { useEffect, useRef } from "react"

interface Device {
  id: number
  name: string
  ip_address: string
  location: string
  status: string
  detected_at: string
  latitude?: number
  longitude?: number
}

interface DeviceMapProps {
  devices: Device[]
  searchKeyword: string
}

export default function DeviceMap({ devices, searchKeyword }: DeviceMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  useEffect(() => {
    // Dynamically import Leaflet to avoid SSR issues
    const initializeMap = async () => {
      if (typeof window === "undefined") return

      const L = (await import("leaflet")).default

      // Fix for default markers in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      })

      if (mapRef.current && !mapInstanceRef.current) {
        // Initialize map centered on Bandung, Indonesia (Telkomsel Regional Jawa Barat)
        mapInstanceRef.current = L.map(mapRef.current).setView([-6.9147, 107.6098], 12)

        // Add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(mapInstanceRef.current)
      }
    }

    initializeMap()

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const updateMarkers = async () => {
      if (!mapInstanceRef.current || typeof window === "undefined") return

      const L = (await import("leaflet")).default

      // Clear existing markers
      markersRef.current.forEach((marker) => {
        mapInstanceRef.current.removeLayer(marker)
      })
      markersRef.current = []

      const keyword = searchKeyword.toLowerCase()
      let matchedMarker: any = null

      // Add markers for devices with coordinates
      const devicesWithCoords = devices.filter((device) => device.latitude && device.longitude)

      devicesWithCoords.forEach((device) => {
        if (!device.latitude || !device.longitude) return

        // Create custom icon based on status
        let iconColor = "#3b82f6" // blue for default
        if (device.status.toLowerCase() === "allowed")
          iconColor = "#10b981" // green
        else if (device.status.toLowerCase() === "blocked")
          iconColor = "#ef4444" // red
        else if (device.status.toLowerCase() === "maintenance") iconColor = "#f59e0b" // yellow

        const customIcon = L.divIcon({
          html: `
            <div style="
              background-color: ${iconColor};
              width: 20px;
              height: 20px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            "></div>
          `,
          className: "custom-marker",
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })

        const marker = L.marker([device.latitude, device.longitude], { icon: customIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div style="min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">${device.name}</h3>
              <p style="margin: 4px 0; color: #6b7280;"><strong>IP:</strong> ${device.ip_address}</p>
              <p style="margin: 4px 0; color: #6b7280;"><strong>Location:</strong> ${device.location}</p>
              <p style="margin: 4px 0; color: #6b7280;">
                <strong>Status:</strong> 
                <span style="
                  background-color: ${iconColor}; 
                  color: white; 
                  padding: 2px 8px; 
                  border-radius: 12px; 
                  font-size: 12px;
                  margin-left: 4px;
                ">${device.status}</span>
              </p>
              <p style="margin: 4px 0 0 0; color: #9ca3af; font-size: 12px;">
                <strong>Last Detected:</strong> ${device.detected_at}
              </p>
            </div>
          `)

        markersRef.current.push(marker)

        // Check if this device matches the search keyword
        if (
          keyword &&
          (device.name.toLowerCase().includes(keyword) ||
            device.ip_address.toLowerCase().includes(keyword) ||
            device.location.toLowerCase().includes(keyword) ||
            device.status.toLowerCase().includes(keyword))
        ) {
          matchedMarker = marker
        }
      })

      // If there's a search match, focus on that marker
      if (matchedMarker) {
        matchedMarker.openPopup()
        mapInstanceRef.current.setView(matchedMarker.getLatLng(), 16)
      } else if (devicesWithCoords.length > 0) {
        // Fit map to show all markers
        const group = new L.featureGroup(markersRef.current)
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1))
      }
    }

    updateMarkers()
  }, [devices, searchKeyword])

  return (
    <>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />

      {/* Map Container */}
      <div className="relative">
        <div ref={mapRef} className="h-96 w-full rounded-lg border border-gray-200" />

        {/* Map Legend */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 border border-gray-200 z-[1000]">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Device Status</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-600">Allowed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-xs text-gray-600">Blocked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-xs text-gray-600">Maintenance</span>
            </div>
          </div>
        </div>

        {/* Device Count Badge */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2 border border-gray-200 z-[1000]">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium text-gray-900">
              {devices.filter((d) => d.latitude && d.longitude).length} devices mapped
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
