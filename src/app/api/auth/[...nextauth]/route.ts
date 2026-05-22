/**
 * NextAuth route — removed. Auth is now handled by Clerk.
 */
import { NextResponse } from "next/server";
export function GET()  { return NextResponse.json({ error: "NextAuth removed. Using Clerk." }, { status: 410 }); }
export function POST() { return NextResponse.json({ error: "NextAuth removed. Using Clerk." }, { status: 410 }); }
