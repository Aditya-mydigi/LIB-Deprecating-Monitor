import axios from "axios";

/**
 * Normalizes a version string by removing prefixes like ^ or ~
 */
export function normalizeVersion(version: string): string {
  return version.replace(/^[\^~]/, "");
}

const versionCache = new Map<string, { version: string; url: string | null; timestamp: number }>();
const VERSION_TTL = 3600000; // 1 hour

/**
 * Fetches the latest version and repository info of a package from the npm registry
 */
export async function fetchLatestVersion(packageName: string): Promise<{ version: string; url: string | null }> {
  const now = Date.now();
  const cacheKey = `npm_${packageName}`;
  const cached = versionCache.get(cacheKey);
  
  if (cached && (now - cached.timestamp < VERSION_TTL)) {
    return { version: cached.version, url: cached.url };
  }

  try {
    const response = await axios.get(`https://registry.npmjs.org/${packageName}`, {
      timeout: 5000,
    });
    
    const version = response.data["dist-tags"]?.latest || "unknown";
    let repoUrl = response.data.repository?.url || response.data.homepage || null;

    if (repoUrl && typeof repoUrl === "string") {
      repoUrl = repoUrl.replace(/^git\+/, "").replace(/\.git$/, "").replace(/^git:/, "https:");
    }

    const result = { version, url: repoUrl };
    versionCache.set(cacheKey, { ...result, timestamp: now });
    
    return result;
  } catch (error) {
    return { version: "unknown", url: null };
  }
}

/**
 * Fetches the latest version from PyPI for Python packages
 */
export async function fetchLatestPythonVersion(packageName: string): Promise<{ version: string; url: string | null }> {
  const now = Date.now();
  const cacheKey = `pypi_${packageName}`;
  const cached = versionCache.get(cacheKey);
  
  if (cached && (now - cached.timestamp < VERSION_TTL)) {
    return { version: cached.version, url: cached.url };
  }

  try {
    const response = await axios.get(`https://pypi.org/pypi/${packageName}/json`, {
      timeout: 5000,
    });
    
    const version = response.data.info.version || "unknown";
    const repoUrl = response.data.info.project_url || null;

    const result = { version, url: repoUrl };
    versionCache.set(cacheKey, { ...result, timestamp: now });
    
    return result;
  } catch (error) {
    return { version: "unknown", url: null };
  }
}

/**
 * Fetches the latest version from Maven Central for Java packages
 */
export async function fetchLatestJavaVersion(identifier: string): Promise<{ version: string; url: string | null }> {
  const now = Date.now();
  const cacheKey = `maven_${identifier}`;
  const cached = versionCache.get(cacheKey);
  
  if (cached && (now - cached.timestamp < VERSION_TTL)) {
    return { version: cached.version, url: cached.url };
  }

  try {
    const [groupId, artifactId] = identifier.split(":");
    const query = artifactId ? `g:${groupId} AND a:${artifactId}` : `a:${groupId}`;
    const response = await axios.get(`https://search.maven.org/solrsearch/select?q=${query}&rows=1&wt=json`, {
      timeout: 5000,
    });
    
    const version = response.data.response.docs[0]?.latestVersion || "unknown";
    const result = { version, url: `https://search.maven.org/artifact/${groupId}/${artifactId}` };
    
    versionCache.set(cacheKey, { ...result, timestamp: now });
    
    return result;
  } catch (error) {
    return { version: "unknown", url: null };
  }
}

/**
 * Determines the update type between current and latest versions
 */
export function getUpdateType(current: string, latest: string): "up-to-date" | "patch" | "minor" | "major" | "unknown" {
  if (latest === "unknown") return "unknown";
  
  const normCurrent = normalizeVersion(current);
  const normLatest = normalizeVersion(latest);

  if (normCurrent === normLatest) return "up-to-date";

  const currentParts = normCurrent.split(".").map(Number);
  const latestParts = normLatest.split(".").map(Number);

  if (currentParts.length < 3 || latestParts.length < 3) return "unknown";

  if (latestParts[0] > currentParts[0]) return "major";
  if (latestParts[1] > currentParts[1]) return "minor";
  if (latestParts[2] > currentParts[2]) return "patch";

  return "up-to-date";
}

/**
 * Fetches vulnerability data from OSV.dev for a specific package and version
 */
export async function checkSecurityVulnerability(registry: string, name: string, version: string): Promise<{ hasVulnerabilities: boolean; details: any[] }> {
  try {
    const ecosystemMap: Record<string, string> = {
      npm: "npm",
      pypi: "PyPI",
      maven: "Maven",
    };

    const ecosystem = ecosystemMap[registry] || "npm";
    const cleanVersion = normalizeVersion(version);

    const response = await axios.post("https://api.osv.dev/v1/query", {
      package: { name, ecosystem },
      version: cleanVersion,
    }, {
      timeout: 5000,
    });

    const hasVulnerabilities = !!response.data.vulns && response.data.vulns.length > 0;
    return {
      hasVulnerabilities,
      details: response.data.vulns || [],
    };
  } catch (error) {
    console.error(`[OSV] Failed to check vulnerabilities for ${name}@${version}:`, error);
    return { hasVulnerabilities: false, details: [] };
  }
}

/**
 * Returns a human-readable impact description for an update type
 */
export function getImpact(type: string): string {
  switch (type) {
    case "patch":
      return "Bug fixes, safe update";
    case "minor":
      return "New features, generally safe";
    case "major":
      return "Breaking changes, review required";
    case "up-to-date":
      return "Up to date";
    case "vulnerable":
      return "Security vulnerability detected!";
    default:
      return "Unknown impact";
  }
}
