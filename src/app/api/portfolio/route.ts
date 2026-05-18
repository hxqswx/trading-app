import { NextResponse } from "next/server";
import { MOCK_PORTFOLIO } from "@/lib/mock";

export async function GET() {
  return NextResponse.json(MOCK_PORTFOLIO);
}
