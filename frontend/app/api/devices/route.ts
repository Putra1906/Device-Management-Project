import { type NextRequest, NextResponse } from "next/server"
import { mockDatabase } from "@/lib/mock-database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get("q") || ""

    const devices = keyword ? mockDatabase.searchDevices(keyword) : mockDatabase.getAllDevices()

    return NextResponse.json({
      success: true,
      devices,
      total: devices.length,
    })
  } catch (error) {
    console.error("Error fetching devices:", error)
    return NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const deviceData = await request.json()

    // Validate required fields
    if (!deviceData.name || !deviceData.ip_address) {
      return NextResponse.json(
        {
          error: "Device name and IP address are required",
        },
        { status: 400 },
      )
    }

    // Check for duplicate IP address
    const existingDevices = mockDatabase.getAllDevices()
    const duplicateIP = existingDevices.find((d) => d.ip_address === deviceData.ip_address)

    if (duplicateIP) {
      return NextResponse.json(
        {
          error: "A device with this IP address already exists",
        },
        { status: 400 },
      )
    }

    const newDevice = mockDatabase.createDevice({
      name: deviceData.name,
      ip_address: deviceData.ip_address,
      location: deviceData.location || "",
      status: deviceData.status || "Allowed",
      latitude: deviceData.latitude ? Number.parseFloat(deviceData.latitude) : undefined,
      longitude: deviceData.longitude ? Number.parseFloat(deviceData.longitude) : undefined,
    })

    return NextResponse.json(
      {
        success: true,
        device: newDevice,
        message: "Device created successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating device:", error)
    return NextResponse.json({ error: "Failed to create device" }, { status: 500 })
  }
}
