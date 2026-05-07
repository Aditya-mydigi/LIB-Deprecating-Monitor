import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";
import { getCacheWithMeta } from "@/lib/cache-utils";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const repo = searchParams.get("repo");

  if (!repo) {
    return NextResponse.json({ error: "Missing repo identifier" }, { status: 400 });
  }

  const cacheKey = `manual_${repo}`;

  try {
    const cacheEntry = await getCacheWithMeta<{ 
      dependencies: any[], 
      devDependencies: any[] 
    }>(cacheKey);

    if (cacheEntry) {
      return NextResponse.json({
        ...cacheEntry.data,
        fromCache: true,
        cachedAt: cacheEntry.timestamp
      });
    }

    return NextResponse.json({ 
      error: "No analysis found for this manual repository. Please upload the file again.",
      dependencies: [],
      devDependencies: [] 
    }, { status: 404 });

  } catch (err: any) {
    const message = err instanceof Error ? err.message : "Failed to fetch dependencies";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
