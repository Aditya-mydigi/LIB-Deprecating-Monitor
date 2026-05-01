import axios from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: string;
  ownerAvatarUrl: string;
  private: boolean;
  default_branch: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
}

// ─── GitHub API Client ────────────────────────────────────────────────────────

function createGitHubClient(accessToken: string) {
  return axios.create({
    baseURL: "https://api.github.com",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    timeout: 15_000,
  });
}

// ─── Fetch all user repos (handles pagination) ────────────────────────────────

export async function fetchUserRepos(
  accessToken: string
): Promise<GitHubRepo[]> {
  const client = createGitHubClient(accessToken);
  const allRepos: GitHubRepo[] = [];
  let page = 1;
  const perPage = 100; // maximum allowed by GitHub

  while (true) {
    const { data } = await client.get<RawGitHubRepo[]>("/user/repos", {
      params: {
        per_page: perPage,
        page,
        sort: "updated",
        direction: "desc",
        affiliation: "owner,collaborator,organization_member",
      },
    });

    if (data.length === 0) break;

    allRepos.push(...data.map(normaliseRepo));

    // If we got fewer results than requested, we've hit the last page
    if (data.length < perPage) break;

    page++;
  }

  return allRepos;
}

// ─── Raw GitHub shape (subset) ────────────────────────────────────────────────

interface RawGitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string; avatar_url: string };
  private: boolean;
  default_branch: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
}

function normaliseRepo(raw: RawGitHubRepo): GitHubRepo {
  return {
    id: raw.id,
    name: raw.name,
    full_name: raw.full_name,
    owner: raw.owner.login,
    ownerAvatarUrl: raw.owner.avatar_url,
    private: raw.private,
    default_branch: raw.default_branch,
    html_url: raw.html_url,
    description: raw.description,
    language: raw.language,
    stargazers_count: raw.stargazers_count,
    updated_at: raw.updated_at,
  };
}

// ─── Fetch File Content ───────────────────────────────────────────────────────

export async function fetchFileContent(
  accessToken: string,
  owner: string,
  repo: string,
  path: string
) {
  const client = createGitHubClient(accessToken);
  try {
    const { data } = await client.get(
      `/repos/${owner}/${repo}/contents/${path}`
    );

    if (data.encoding === "base64") {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
    return data.toString();
  } catch (error) {
    return null;
  }
}

// ─── Detect Project Type ──────────────────────────────────────────────────────

export async function detectProjectFiles(
  accessToken: string,
  owner: string,
  repo: string
) {
  const client = createGitHubClient(accessToken);
  try {
    const { data } = await client.get(`/repos/${owner}/${repo}/contents/`);
    if (!Array.isArray(data)) return [];
    
    // Only check root-level files
    const supportedFiles = ["package.json", "requirements.txt", "pyproject.toml", "pom.xml"];
    return data
      .filter((f: any) => supportedFiles.includes(f.name))
      .map((f: any) => f.name);
  } catch (error) {
    console.error("Detection failed:", error);
    return [];
  }
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

export interface NormalizedDependency {
  name: string;
  version: string;
  type: "prod" | "dev";
}

export function parsePackageJson(content: string): NormalizedDependency[] {
  try {
    const parsed = JSON.parse(content);
    const deps: NormalizedDependency[] = [];
    
    if (parsed.dependencies) {
      Object.entries(parsed.dependencies).forEach(([name, version]) => {
        deps.push({ name, version: version as string, type: "prod" });
      });
    }
    
    if (parsed.devDependencies) {
      Object.entries(parsed.devDependencies).forEach(([name, version]) => {
        deps.push({ name, version: version as string, type: "dev" });
      });
    }
    
    return deps;
  } catch {
    return [];
  }
}

export function parseRequirementsTxt(content: string): NormalizedDependency[] {
  const lines = content.split("\n");
  const deps: NormalizedDependency[] = [];
  
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith("#") || line.startsWith("-r")) continue;
    
    // Match package==version, package>=version, package~=version, etc.
    const match = line.match(/^([^=<>~ ]+)([=<>~ ]+)(.+)$/);
    if (match) {
      deps.push({
        name: match[1].trim(),
        version: match[3].trim().split(" ")[0], // handle comments or extras
        type: "prod",
      });
    } else {
      deps.push({
        name: line,
        version: "latest",
        type: "prod",
      });
    }
  }
  return deps;
}

export function parsePyProjectToml(content: string): NormalizedDependency[] {
  const deps: NormalizedDependency[] = [];
  
  // Basic TOML parsing for dependencies using regex
  // Look for [project.dependencies], [tool.poetry.dependencies], [tool.poetry.group.dev.dependencies]
  
  const sections = content.split(/^\[/m);
  for (const section of sections) {
    const [header, ...bodyLines] = section.split("\n");
    const isProd = header.includes("project.dependencies") || header.includes("tool.poetry.dependencies");
    const isDev = header.includes("dev-dependencies") || header.includes("group.dev.dependencies");
    
    if (isProd || isDev) {
      for (let line of bodyLines) {
        line = line.trim();
        if (!line || line.startsWith("#") || !line.includes("=")) continue;
        
        const [name, versionPart] = line.split("=").map(s => s.trim());
        const cleanName = name.replace(/^"/, "").replace(/"$/, "");
        let cleanVersion = versionPart.replace(/^"/, "").replace(/"$/, "").replace(/^'/, "").replace(/'$/, "");
        
        // Handle complex versions like { version = "...", extras = [...] }
        if (cleanVersion.startsWith("{")) {
          const vMatch = cleanVersion.match(/version\s*=\s*"([^"]+)"/);
          cleanVersion = vMatch ? vMatch[1] : "latest";
        }

        deps.push({
          name: cleanName,
          version: cleanVersion,
          type: isDev ? "dev" : "prod",
        });
      }
    }
  }
  return deps;
}

export function parsePomXml(content: string): NormalizedDependency[] {
  const deps: NormalizedDependency[] = [];
  const dependencyRegex = /<dependency>([\s\S]*?)<\/dependency>/g;
  let match;
  
  while ((match = dependencyRegex.exec(content)) !== null) {
    const block = match[1];
    const groupId = block.match(/<groupId>([^<]+)<\/groupId>/)?.[1]?.trim();
    const artifactId = block.match(/<artifactId>([^<]+)<\/artifactId>/)?.[1]?.trim();
    const version = block.match(/<version>([^<]+)<\/version>/)?.[1]?.trim();
    const scope = block.match(/<scope>([^<]+)<\/scope>/)?.[1]?.trim();
    
    if (artifactId) {
      deps.push({
        name: groupId ? `${groupId}:${artifactId}` : artifactId,
        version: version || "latest",
        type: scope === "test" ? "dev" : "prod",
      });
    }
  }
  return deps;
}

// ─── Fetch Package.json (Maintained for backward Compatibility) ──────────────

export async function fetchPackageJson(
  accessToken: string,
  owner: string,
  repo: string
) {
  const client = createGitHubClient(accessToken);
  const { data } = await client.get(
    `/repos/${owner}/${repo}/contents/package.json`
  );

  if (data.encoding === "base64") {
    const decoded = Buffer.from(data.content, "base64").toString("utf-8");
    return JSON.parse(decoded);
  }

  throw new Error("Unsupported file encoding from GitHub");
}

export function parseDependencies(parsedJson: any) {
  return {
    dependencies: parsedJson.dependencies || {},
    devDependencies: parsedJson.devDependencies || {},
  };
}
