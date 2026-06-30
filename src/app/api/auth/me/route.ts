import { NextResponse } from "next/server";
import { requireSession, UnauthorizedError } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireSession();
    return NextResponse.json({
      userId: session.userId,
      name:   session.name,
      role:   session.role,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError)
      return NextResponse.json({ message: error.message }, { status: 401 });
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
