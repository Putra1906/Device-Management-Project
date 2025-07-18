import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Hardcoded credentials validation
    if (username === "admin" && password === "admin") {
      return NextResponse.json({
        success: true,
        message: "Login successful",
        user: { username },
      })
    } else {
      return NextResponse.json({ error: "Incorrect username or password" }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
