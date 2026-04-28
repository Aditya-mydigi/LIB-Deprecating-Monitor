import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchUserRepos } from "@/lib/github";

export async function GET() {
  // 1. Get session (server-side only)
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Extract the access token (server-only field, never sent to client)
  const accessToken = (session as unknown as { accessToken?: string })
    .accessToken;

  if (!accessToken) {
    return NextResponse.json(
      { error: "No access token in session" },
      { status: 401 }
    );
  }

  // 3. Fetch repos from GitHub (all pages)
  try {
    const repos = await fetchUserRepos(accessToken);
    return NextResponse.json({ repos });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch repositories";
    console.error("[/api/github/repos]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
