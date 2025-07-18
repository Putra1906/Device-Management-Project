import { type NextRequest, NextResponse } from "next/server"
import { mockDatabase } from "@/lib/mock-database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const deviceId = Number.parseInt(params.id)

    if (isNaN(deviceId)) {
      return NextResponse.json({ error: "Invalid device ID" }, { status: 400 })
    }

    const device = mockDatabase.getDeviceById(deviceId)

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      device,
    })
  } catch (error) {
    console.error("Error fetching device:", error)
    return NextResponse.json({ error: "Failed to fetch device" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const deviceId = Number.parseInt(params.id)

    if (isNaN(deviceId)) {
      return NextResponse.json({ error: "Invalid device ID" }, { status: 400 })
    }

    const updateData = await request.json()

    // Validate required fields if they're being updated
    if (updateData.name !== undefined && !updateData.name.trim()) {
      return NextResponse.json({ error: "Device name cannot be empty" }, { status: 400 })
    }

    if (updateData.ip_address !== undefined && !updateData.ip_address.trim()) {
      return NextResponse.json({ error: "IP address cannot be empty" }, { status: 400 })
    }

    // Check for duplicate IP address (excluding current device)
    if (updateData.ip_address) {
      const existingDevices = mockDatabase.getAllDevices()
      const duplicateIP = existingDevices.find((d) => d.ip_address === updateData.ip_address && d.id !== deviceId)

      if (duplicateIP) {
        return NextResponse.json(
          {
            error: "A device with this IP address already exists",
          },
          { status: 400 },
        )
      }
    }

    // Prepare update data
    const updatePayload: any = {}

    if (updateData.name !== undefined) updatePayload.name = updateData.name
    if (updateData.ip_address !== undefined) updatePayload.ip_address = updateData.ip_address
    if (updateData.location !== undefined) updatePayload.location = updateData.location
    if (updateData.status !== undefined) updatePayload.status = updateData.status
    if (updateData.latitude !== undefined) {
      updatePayload.latitude = updateData.latitude ? Number.parseFloat(updateData.latitude) : undefined
    }
    if (updateData.longitude !== undefined) {
      updatePayload.longitude = updateData.longitude ? Number.parseFloat(updateData.longitude) : undefined
    }

    const updatedDevice = mockDatabase.updateDevice(deviceId, updatePayload)

    if (!updatedDevice) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      device: updatedDevice,
      message: "Device updated successfully",
    })
  } catch (error) {
    console.error("Error updating device:", error)
    return NextResponse.json({ error: "Failed to update device" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const deviceId = Number.parseInt(params.id)

    if (isNaN(deviceId)) {
      return NextResponse.json({ error: "Invalid device ID" }, { status: 400 })
    }

    const deleted = mockDatabase.deleteDevice(deviceId)

    if (!deleted) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Device deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting device:", error)
    return NextResponse.json({ error: "Failed to delete device" }, { status: 500 })
  }
}
