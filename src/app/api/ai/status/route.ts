import { NextResponse } from "next/server";
import { checkLLMStatus } from "@/lib/llm";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await checkLLMStatus();
  return NextResponse.json(status);
}
