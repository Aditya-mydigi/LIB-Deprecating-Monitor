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
import { 
  fetchLatestVersion, 
  fetchLatestPythonVersion, 
  fetchLatestJavaVersion, 
  getUpdateType, 
  getImpact,
  checkSecurityVulnerability 
} from "@/lib/npm";
import { getCache, getCacheWithMeta, setCache } from "@/lib/cache-utils";

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

  const refresh = searchParams.get("refresh") === "true";
  const cacheKey = `${owner}_${repo}`;

  try {
    if (!refresh) {
      const cacheEntry = await getCacheWithMeta<{ 
        dependencies: any[], 
        devDependencies: any[] 
      }>(cacheKey);

      if (cacheEntry) {
        console.log(`[Cache] Hit for ${cacheKey}`);
        return NextResponse.json({
          ...cacheEntry.data,
          fromCache: true,
          cachedAt: cacheEntry.timestamp
        });
      }
    }
    
    console.log(`[Cache] ${refresh ? "Forced refresh" : "Miss"} for ${cacheKey}, fetching fresh data...`);

    const detectedFiles = await detectProjectFiles(accessToken, owner, repo);
    
    if (detectedFiles.length === 0) {
      return NextResponse.json({ 
        error: "No supported dependency file found",
        dependencies: [],
        devDependencies: [] 
      }, { status: 404 });
    }

    const allNormalizedDeps: (NormalizedDependency & { registry: string })[] = [];

    for (const file of detectedFiles) {
      const content = await fetchFileContent(accessToken, owner, repo, file);
      if (!content) continue;

      let fileDeps: NormalizedDependency[] = [];
      let registry = "npm";

      if (file === "package.json") {
        fileDeps = parsePackageJson(content);
        registry = "npm";
      } else if (file === "requirements.txt") {
        fileDeps = parseRequirementsTxt(content);
        registry = "pypi";
      } else if (file === "pyproject.toml") {
        fileDeps = parsePyProjectToml(content);
        registry = "pypi";
      } else if (file === "pom.xml") {
        fileDeps = parsePomXml(content);
        registry = "maven";
      }

      allNormalizedDeps.push(...fileDeps.map(d => ({ ...d, registry })));
    }

    const processDeps = async (deps: (NormalizedDependency & { registry: string })[]) => {
      return Promise.all(
        deps.map(async (dep) => {
          let latestVersion = "unknown";
          let repoUrl = null;
          let updateType: any = "unknown";
          let impact = "Verify";
          let command = "";

          let versionResult;
          if (dep.registry === "pypi") {
            versionResult = await fetchLatestPythonVersion(dep.name);
            command = `pip install ${dep.name} --upgrade`;
          } else if (dep.registry === "maven") {
            versionResult = await fetchLatestJavaVersion(dep.name);
            command = `mvn versions:use-latest-releases -Dincludes=${dep.name}`;
          } else {
            versionResult = await fetchLatestVersion(dep.name);
            command = `npm install ${dep.name}@latest${dep.type === "dev" ? " -D" : ""}`;
          }

          latestVersion = versionResult.version;
          repoUrl = versionResult.url;
          
          // Check for security vulnerabilities
          const securityResult = await checkSecurityVulnerability(dep.registry, dep.name, dep.version);
          const hasVulnerability = securityResult.hasVulnerabilities;

          updateType = getUpdateType(dep.version, latestVersion);
          
          // Refine Status Logic
          if (hasVulnerability) {
            updateType = "vulnerable";
          } else if (updateType === "major") {
            // keep it major
          }

          impact = getImpact(updateType);

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
            registry: dep.registry,
            vulnerabilities: securityResult.details
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

    const finalData = {
      dependencies: enhancedDeps,
      devDependencies: enhancedDevDeps,
    };

    await setCache(cacheKey, finalData);

    return NextResponse.json(finalData);
  } catch (err: any) {
    const message = err instanceof Error ? err.message : "Failed to fetch dependencies";
    console.error("[/api/github/dependencies]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
