// Centralized mock database to ensure data persistence across API calls
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

// Initialize with default devices
const devices: Device[] = [
  {
    id: 1,
    name: "Core Router",
    ip_address: "192.168.10.1",
    location: "Server Room",
    status: "Allowed",
    detected_at: "2024-01-16 11:46:14",
    latitude: -6.938174,
    longitude: 107.661176,
  },
  {
    id: 2,
    name: "Access Point - Lantai 1",
    ip_address: "192.168.10.10",
    location: "Lantai 1",
    status: "Allowed",
    detected_at: "2024-01-16 11:46:14",
    latitude: -6.938474,
    longitude: 107.661476,
  },
  {
    id: 3,
    name: "Laptop Tamu",
    ip_address: "192.168.10.20",
    location: "Lobby",
    status: "Blocked",
    detected_at: "2024-01-16 11:46:14",
    latitude: -6.938774,
    longitude: 107.661776,
  },
  {
    id: 4,
    name: "Printer Utama",
    ip_address: "192.168.10.30",
    location: "Ruang HR",
    status: "Allowed",
    detected_at: "2024-01-16 11:46:14",
    latitude: -6.939074,
    longitude: 107.662076,
  },
  {
    id: 5,
    name: "Smart TV",
    ip_address: "192.168.10.40",
    location: "Ruang Meeting",
    status: "Blocked",
    detected_at: "2024-01-16 11:46:14",
    latitude: -6.939374,
    longitude: 107.662376,
  },
  {
    id: 6,
    name: "Server File",
    ip_address: "192.168.10.50",
    location: "Data Center",
    status: "Allowed",
    detected_at: "2024-01-16 11:46:14",
    latitude: -6.939674,
    longitude: 107.662676,
  },
  {
    id: 7,
    name: "CCTV Utama",
    ip_address: "192.168.10.60",
    location: "Area Parkir",
    status: "Maintenance",
    detected_at: "2024-01-16 11:46:14",
    latitude: -6.939974,
    longitude: 107.662976,
  },
  {
    id: 8,
    name: "Laptop Staff",
    ip_address: "192.168.10.70",
    location: "Ruang Finance",
    status: "Allowed",
    detected_at: "2024-01-16 11:46:14",
    latitude: -6.940274,
    longitude: 107.663276,
  },
  {
    id: 9,
    name: "Switch Gedung",
    ip_address: "192.168.10.80",
    location: "Ruang Jaringan",
    status: "Allowed",
    detected_at: "2024-01-16 11:46:14",
    latitude: -6.940574,
    longitude: 107.663576,
  },
  {
    id: 10,
    name: "Access Point - Lantai 2",
    ip_address: "192.168.10.90",
    location: "Lantai 2",
    status: "Maintenance",
    detected_at: "2024-01-16 11:46:14",
    latitude: -6.940874,
    longitude: 107.663876,
  },
]

let nextId = Math.max(...devices.map((d) => d.id)) + 1

export const mockDatabase = {
  // Get all devices
  getAllDevices: (): Device[] => {
    return [...devices]
  },

  // Get devices with search
  searchDevices: (keyword: string): Device[] => {
    if (!keyword) return [...devices]

    const lowerKeyword = keyword.toLowerCase()
    return devices.filter(
      (device) =>
        device.name.toLowerCase().includes(lowerKeyword) ||
        device.ip_address.toLowerCase().includes(lowerKeyword) ||
        device.location.toLowerCase().includes(lowerKeyword) ||
        device.status.toLowerCase().includes(lowerKeyword),
    )
  },

  // Get single device by ID
  getDeviceById: (id: number): Device | null => {
    const device = devices.find((d) => d.id === id)
    return device ? { ...device } : null
  },

  // Create new device
  createDevice: (deviceData: Omit<Device, "id" | "detected_at">): Device => {
    const newDevice: Device = {
      id: nextId++,
      name: deviceData.name,
      ip_address: deviceData.ip_address,
      location: deviceData.location || "",
      status: deviceData.status || "Allowed",
      detected_at: new Date().toISOString().slice(0, 19).replace("T", " "),
      latitude: deviceData.latitude,
      longitude: deviceData.longitude,
    }

    devices.push(newDevice)
    return { ...newDevice }
  },

  // Update device
  updateDevice: (id: number, updateData: Partial<Omit<Device, "id">>): Device | null => {
    const deviceIndex = devices.findIndex((d) => d.id === id)

    if (deviceIndex === -1) {
      return null
    }

    devices[deviceIndex] = {
      ...devices[deviceIndex],
      ...updateData,
      id, // Ensure ID doesn't change
      detected_at: new Date().toISOString().slice(0, 19).replace("T", " "), // Update timestamp
    }

    return { ...devices[deviceIndex] }
  },

  // Delete device
  deleteDevice: (id: number): boolean => {
    const deviceIndex = devices.findIndex((d) => d.id === id)

    if (deviceIndex === -1) {
      return false
    }

    devices.splice(deviceIndex, 1)
    return true
  },

  // Get device count by status
  getDeviceStats: () => {
    return {
      total: devices.length,
      allowed: devices.filter((d) => d.status.toLowerCase() === "allowed").length,
      blocked: devices.filter((d) => d.status.toLowerCase() === "blocked").length,
      maintenance: devices.filter((d) => d.status.toLowerCase() === "maintenance").length,
    }
  },
}

export type { Device }
