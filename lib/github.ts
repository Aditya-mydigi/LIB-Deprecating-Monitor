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

// ─── Fetch Package.json ───────────────────────────────────────────────────────

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
