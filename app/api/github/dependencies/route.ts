import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";
import { fetchPackageJson, parseDependencies } from "@/lib/github";
import { fetchLatestVersion, getUpdateType, getImpact } from "@/lib/npm";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = (session as unknown as { accessToken?: string }).accessToken;

  if (!accessToken) {
    return NextResponse.json(
      { error: "No access token in session" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");

  if (!owner || !repo) {
    return NextResponse.json({ error: "Missing owner or repo" }, { status: 400 });
  }

  try {
    const rawJson = await fetchPackageJson(accessToken, owner, repo);
    const { dependencies, devDependencies } = parseDependencies(rawJson);

    const processDeps = async (deps: Record<string, string>, isDev: boolean) => {
      const entries = Object.entries(deps);
      return Promise.all(
        entries.map(async ([name, currentVersion]) => {
          const { version: latestVersion, url: repoUrl } = await fetchLatestVersion(name);
          const updateType = getUpdateType(currentVersion, latestVersion);
          const impact = getImpact(updateType);
          
          let releasesUrl = repoUrl;
          if (repoUrl && repoUrl.includes("github.com")) {
            releasesUrl = `${repoUrl.replace(/\/$/, "")}/releases`;
          }

          return {
            name,
            currentVersion,
            latestVersion,
            updateType,
            impact,
            npmCommand: `npm install ${name}@latest${isDev ? " -D" : ""}`,
            releasesUrl,
            isDev,
          };
        })
      );
    };

    const [enhancedDeps, enhancedDevDeps] = await Promise.all([
      processDeps(dependencies, false),
      processDeps(devDependencies, true),
    ]);

    return NextResponse.json({
      dependencies: enhancedDeps,
      devDependencies: enhancedDevDeps,
    });
  } catch (err: any) {
    const status = err?.response?.status === 404 ? 404 : 500;
    const message =
      status === 404
        ? "package.json not found in repository"
        : err instanceof Error
        ? err.message
        : "Failed to fetch dependencies";
    console.error("[/api/github/dependencies]", message);
    return NextResponse.json({ error: message }, { status });
  }
}
