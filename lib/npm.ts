import axios from "axios";

/**
 * Normalizes a version string by removing prefixes like ^ or ~
 */
export function normalizeVersion(version: string): string {
  return version.replace(/^[\^~]/, "");
}

/**
 * Fetches the latest version and repository info of a package from the npm registry
 */
export async function fetchLatestVersion(packageName: string): Promise<{ version: string; url: string | null }> {
  try {
    const response = await axios.get(`https://registry.npmjs.org/${packageName}`, {
      timeout: 5000,
    });
    
    const version = response.data["dist-tags"]?.latest || "unknown";
    let repoUrl = response.data.repository?.url || response.data.homepage || null;

    // Clean up git+https:// or .git suffix
    if (repoUrl && typeof repoUrl === "string") {
      repoUrl = repoUrl.replace(/^git\+/, "").replace(/\.git$/, "").replace(/^git:/, "https:");
    }

    return { version, url: repoUrl };
  } catch (error) {
    console.error(`Failed to fetch latest version for ${packageName}:`, error);
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
    default:
      return "Unknown impact";
  }
}
