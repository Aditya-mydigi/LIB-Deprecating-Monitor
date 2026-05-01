import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";
import { 
  detectProjectFiles, 
  fetchFileContent, 
  parsePackageJson, 
  parseRequirementsTxt, 
  parsePyProjectToml, 
  parsePomXml,
  NormalizedDependency 
} from "@/lib/github";
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
    const detectedFiles = await detectProjectFiles(accessToken, owner, repo);
    
    if (detectedFiles.length === 0) {
      return NextResponse.json({ 
        error: "No supported dependency file found",
        dependencies: [],
        devDependencies: [] 
      }, { status: 404 });
    }

    const allNormalizedDeps: NormalizedDependency[] = [];

    for (const file of detectedFiles) {
      const content = await fetchFileContent(accessToken, owner, repo, file);
      if (!content) continue;

      let fileDeps: NormalizedDependency[] = [];
      if (file === "package.json") fileDeps = parsePackageJson(content);
      else if (file === "requirements.txt") fileDeps = parseRequirementsTxt(content);
      else if (file === "pyproject.toml") fileDeps = parsePyProjectToml(content);
      else if (file === "pom.xml") fileDeps = parsePomXml(content);

      allNormalizedDeps.push(...fileDeps);
    }

    const processDeps = async (deps: NormalizedDependency[]) => {
      return Promise.all(
        deps.map(async (dep) => {
          let latestVersion = "unknown";
          let repoUrl = null;
          let updateType: any = "unknown";
          let impact = "Verify";
          let command = "";

          // Try to fetch latest version from NPM if it's likely an NPM package
          // For others, we'll keep it as unknown for now to maintain performance
          // and avoid complex multi-registry logic unless requested.
          const isLikelyNpm = !dep.name.includes(":") && !detectedFiles.some(f => f.endsWith(".txt") || f.endsWith(".toml") || f.endsWith(".xml"));
          
          if (isLikelyNpm || detectedFiles.includes("package.json")) {
            const { version, url } = await fetchLatestVersion(dep.name);
            latestVersion = version;
            repoUrl = url;
            updateType = getUpdateType(dep.version, latestVersion);
            impact = getImpact(updateType);
            command = `npm install ${dep.name}@latest${dep.type === "dev" ? " -D" : ""}`;
          }

          let releasesUrl = repoUrl;
          if (repoUrl && repoUrl.includes("github.com")) {
            releasesUrl = `${repoUrl.replace(/\/$/, "")}/releases`;
          }

          return {
            name: dep.name,
            currentVersion: dep.version,
            latestVersion,
            updateType,
            impact,
            npmCommand: command,
            releasesUrl,
            isDev: dep.type === "dev",
          };
        })
      );
    };

    const prodDeps = allNormalizedDeps.filter(d => d.type === "prod");
    const devDeps = allNormalizedDeps.filter(d => d.type === "dev");

    const [enhancedDeps, enhancedDevDeps] = await Promise.all([
      processDeps(prodDeps),
      processDeps(devDeps),
    ]);

    return NextResponse.json({
      dependencies: enhancedDeps,
      devDependencies: enhancedDevDeps,
    });
  } catch (err: any) {
    const message = err instanceof Error ? err.message : "Failed to fetch dependencies";
    console.error("[/api/github/dependencies]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
