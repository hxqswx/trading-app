/**
 * Mobile token route — removed. Mobile auth is now handled by @clerk/clerk-expo.
 */
import { NextResponse } from "next/server";
export function POST() { return NextResponse.json({ error: "Mobile auth is now handled by Clerk." }, { status: 410 }); }
