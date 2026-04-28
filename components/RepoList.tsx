"use client";

import { useState, useMemo } from "react";
import type { GitHubRepo } from "@/lib/github";

interface RepoListProps {
  repos: GitHubRepo[];
  selectedRepoId: number | null;
  onSelect: (repo: GitHubRepo) => void;
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#dea584",
  Java: "#b07219",
  "C#": "#178600",
  "C++": "#f34b7d",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Dart: "#00B4AB",
  Scala: "#c22d40",
};

function LanguageDot({ lang }: { lang: string | null }) {
  if (!lang) return null;
  const color = LANGUAGE_COLORS[lang] ?? "#8b949e";
  return (
    <span className="flex items-center gap-1.5 text-xs" style={{ color: "#8b949e" }}>
      <span
        className="inline-block w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: color, flexShrink: 0 }}
      />
      {lang}
    </span>
  );
}

function StarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-3.5 h-3.5"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279L12 18.896l-7.416 4.517 1.48-8.279L0 9.306l8.332-1.151z" />
    </svg>
  );
}

function RepoCard({
  repo,
  selected,
  onSelect,
}: {
  repo: GitHubRepo;
  selected: boolean;
  onSelect: () => void;
}) {
  const updatedAt = new Date(repo.updated_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      onClick={onSelect}
      className="group relative flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200"
      style={{
        background: selected
          ? "rgba(76,110,245,0.08)"
          : "rgba(22,27,34,0.6)",
        border: selected
          ? "1px solid rgba(76,110,245,0.45)"
          : "1px solid #30363d",
        boxShadow: selected
          ? "0 0 0 1px rgba(76,110,245,0.2) inset"
          : "none",
      }}
      onMouseEnter={(e) => {
        if (!selected)
          (e.currentTarget as HTMLDivElement).style.borderColor = "#484f58";
      }}
      onMouseLeave={(e) => {
        if (!selected)
          (e.currentTarget as HTMLDivElement).style.borderColor = "#30363d";
      }}
    >
      {/* Checkbox */}
      <div className="mt-0.5 flex-shrink-0">
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center transition-all duration-150"
          style={{
            background: selected
              ? "linear-gradient(135deg,#4c6ef5,#748ffc)"
              : "transparent",
            border: selected ? "none" : "2px solid #484f58",
          }}
        >
          {selected && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Repo name */}
          <span
            className="font-semibold text-sm truncate"
            style={{ color: selected ? "#748ffc" : "#e6edf3" }}
          >
            {repo.owner}/{repo.name}
          </span>

          {/* Visibility badge */}
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider flex-shrink-0"
            style={{
              background: repo.private
                ? "rgba(248,166,0,0.12)"
                : "rgba(35,134,54,0.12)",
              color: repo.private ? "#e3b341" : "#3fb950",
              border: repo.private
                ? "1px solid rgba(248,166,0,0.2)"
                : "1px solid rgba(35,134,54,0.2)",
            }}
          >
            {repo.private ? "Private" : "Public"}
          </span>
        </div>

        {/* Description */}
        {repo.description && (
          <p
            className="mt-1 text-xs leading-relaxed line-clamp-2"
            style={{ color: "#8b949e" }}
          >
            {repo.description}
          </p>
        )}

        {/* Meta row */}
        <div className="mt-2 flex items-center gap-4 flex-wrap">
          <LanguageDot lang={repo.language} />

          {repo.stargazers_count > 0 && (
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: "#8b949e" }}
            >
              <StarIcon />
              {repo.stargazers_count.toLocaleString()}
            </span>
          )}

          <span className="flex items-center gap-1 text-xs" style={{ color: "#8b949e" }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v3m0 0a3 3 0 003 3h6a3 3 0 003-3V3M6 6H3m3 0h12m0 0h3" />
            </svg>
            {repo.default_branch}
          </span>

          <span className="text-xs" style={{ color: "#6e7681" }}>
            Updated {updatedAt}
          </span>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      className="flex items-start gap-4 p-4 rounded-xl"
      style={{ border: "1px solid #21262d" }}
    >
      <div className="skeleton w-5 h-5 rounded-md mt-0.5 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-48 rounded" />
        <div className="skeleton h-3 w-72 rounded" />
        <div className="flex gap-3 mt-1">
          <div className="skeleton h-3 w-16 rounded" />
          <div className="skeleton h-3 w-10 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
        </div>
      </div>
    </div>
  );
}

export function RepoList({ repos, selectedRepoId, onSelect }: RepoListProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "public" | "private">("all");

  const filtered = useMemo(() => {
    return repos.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.owner.toLowerCase().includes(search.toLowerCase()) ||
        (r.description ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === "all" ||
        (filter === "public" && !r.private) ||
        (filter === "private" && r.private);
      return matchesSearch && matchesFilter;
    });
  }, [repos, search, filter]);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "#6e7681" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx={11} cy={11} r={8} />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            id="repo-search"
            type="text"
            placeholder="Search repositories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none transition-all duration-150"
            style={{
              background: "#161b22",
              border: "1px solid #30363d",
              color: "#e6edf3",
            }}
            onFocus={(e) =>
              ((e.target as HTMLInputElement).style.borderColor = "#4c6ef5")
            }
            onBlur={(e) =>
              ((e.target as HTMLInputElement).style.borderColor = "#30363d")
            }
          />
        </div>

        {/* Filter pills */}
        <div className="flex gap-2">
          {(["all", "public", "private"] as const).map((f) => (
            <button
              key={f}
              id={`filter-${f}`}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-lg text-xs font-medium capitalize transition-all duration-150"
              style={{
                background:
                  filter === f
                    ? "rgba(76,110,245,0.15)"
                    : "rgba(255,255,255,0.04)",
                border:
                  filter === f
                    ? "1px solid rgba(76,110,245,0.4)"
                    : "1px solid #30363d",
                color: filter === f ? "#748ffc" : "#8b949e",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs" style={{ color: "#6e7681" }}>
        {filtered.length} of {repos.length} repositories
        {selectedRepoId !== null && (
          <span style={{ color: "#748ffc" }}>
            {" "}· 1 selected
          </span>
        )}
      </p>

      {/* Repo cards */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 rounded-xl"
            style={{ border: "1px dashed #30363d" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10 mb-3"
              style={{ color: "#484f58" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-sm font-medium" style={{ color: "#484f58" }}>
              No repositories match your search
            </p>
          </div>
        ) : (
          filtered.map((repo) => (
            <RepoCard
              key={repo.id}
              repo={repo}
              selected={selectedRepoId === repo.id}
              onSelect={() => onSelect(repo)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export { SkeletonCard };
