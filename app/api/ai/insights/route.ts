import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";
import fs from "fs";
import path from "path";

const CACHE_PATH = path.join(process.cwd(), "data", "ai-cache.json");

function getCache() {
  try {
    if (!fs.existsSync(CACHE_PATH)) return {};
    const data = fs.readFileSync(CACHE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

function setCache(cache: any) {
  try {
    const dir = path.dirname(CACHE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  } catch (e) {
    console.error("Cache write error:", e);
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, currentVersion, latestVersion, updateType, isDev, projectName } = await request.json();
  
  const cacheKey = `${name}@${currentVersion}_to_${latestVersion}`;
  const cache = getCache();

  if (cache[cacheKey]) {
    return NextResponse.json({ insights: cache[cacheKey], cached: true });
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "AI service not configured" }, { status: 500 });
  }

  // Highly structured prompt to prevent hallucinations and ensure consistency
  const prompt = `As a Senior Software Architect, analyze the following dependency update and provide a structured technical impact report.

CONTEXT:
- Package: ${name}
- Project Context: ${projectName || "Web Application"}
- Environment: ${isDev ? "Development/Build Time" : "Production/Runtime"}
- Current Version: ${currentVersion}
- Latest Available: ${latestVersion}
- Update Severity: ${updateType.toUpperCase()}

INSTRUCTIONS:
Provide a response in Markdown with exactly these four sections:

### ⚠️ Risk Assessment
Explain the specific technical risks of staying on ${currentVersion} (e.g., security vulnerabilities, performance regressions, compatibility issues).

### 🛠️ Usage Analysis & Impact
Describe where this library is typically used (e.g., "Used for API calls in frontend", "Handles state management") and how an update or lack thereof affects ${projectName}.

### 🚦 Priority Level
Define if this is "Critical", "Moderate", or "Low" priority. Explain why.

### 🚀 Recommendation & Alternatives
Suggest the best path forward (update now, wait for patch, or switch to an alternative). If the library is deprecated, suggest specific modern replacements.

Keep the tone professional, objective, and strictly technical. Avoid generic advice.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: "You are an expert software dependency advisor. You provide deep technical insights into package vulnerabilities, breaking changes, and modern alternatives. You stick strictly to the requested markdown structure." 
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3, // Lower temperature for more consistent, factual responses
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to fetch AI insights");
    }

    const insights = data.choices[0].message.content;

    // Save to cache
    cache[cacheKey] = insights;
    setCache(cache);

    return NextResponse.json({ insights, cached: false });
  } catch (error: any) {
    console.error("[AI Insights Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
