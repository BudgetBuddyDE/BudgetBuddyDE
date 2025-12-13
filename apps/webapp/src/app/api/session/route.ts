import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { authClient } from "@/authClient";

export async function GET(_request: NextRequest) {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
		},
	});

	return NextResponse.json(session);
}
