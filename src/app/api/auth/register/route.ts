/**
 * Registration route — removed. Registration is now handled by Clerk.
 */
import { NextResponse } from "next/server";
export function POST() { return NextResponse.json({ error: "Registration is now handled by Clerk." }, { status: 410 }); }
