import { type NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
	return NextResponse.json({ status: "ok" });
}
