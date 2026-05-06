import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { 
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
  getImpact 
} from "@/lib/npm";
import { setCache } from "@/lib/cache-utils";

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

        const content = await file.text();
        const fileName = file.name;
        
        let fileDeps: NormalizedDependency[] = [];
        let registry = "npm";

        if (fileName === "package.json") {
            fileDeps = parsePackageJson(content);
            registry = "npm";
        } else if (fileName === "requirements.txt") {
            fileDeps = parseRequirementsTxt(content);
            registry = "pypi";
        } else if (fileName === "pyproject.toml") {
            fileDeps = parsePyProjectToml(content);
            registry = "pypi";
        } else if (fileName === "pom.xml") {
            fileDeps = parsePomXml(content);
            registry = "maven";
        } else {
            // Try to guess by content or just return error
            return NextResponse.json({ error: "Unsupported file type. Please upload package.json, requirements.txt, pyproject.toml, or pom.xml" }, { status: 400 });
        }

        if (fileDeps.length === 0) {
            return NextResponse.json({ error: "No dependencies found in the uploaded file" }, { status: 400 });
        }

        // Process these dependencies to get latest versions (like in github/dependencies/route.ts)
        const processDeps = async (deps: NormalizedDependency[]) => {
            return Promise.all(
                deps.map(async (dep) => {
                    let latestVersion = "unknown";
                    let repoUrl = null;
                    let updateType: any = "unknown";
                    let impact = "Verify";
                    let command = "";

                    let versionResult;
                    if (registry === "pypi") {
                        versionResult = await fetchLatestPythonVersion(dep.name);
                        command = `pip install ${dep.name} --upgrade`;
                    } else if (registry === "maven") {
                        versionResult = await fetchLatestJavaVersion(dep.name);
                        command = `mvn versions:use-latest-releases -Dincludes=${dep.name}`;
                    } else {
                        versionResult = await fetchLatestVersion(dep.name);
                        command = `npm install ${dep.name}@latest${dep.type === "dev" ? " -D" : ""}`;
                    }

                    latestVersion = versionResult.version;
                    repoUrl = versionResult.url;
                    updateType = getUpdateType(dep.version, latestVersion);
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
                        registry: registry,
                    };
                })
            );
        };

        const prodDeps = fileDeps.filter(d => d.type === "prod");
        const devDeps = fileDeps.filter(d => d.type === "dev");

        const [enhancedDeps, enhancedDevDeps] = await Promise.all([
            processDeps(prodDeps),
            processDeps(devDeps),
        ]);

        const finalData = {
            dependencies: enhancedDeps,
            devDependencies: enhancedDevDeps,
        };

        // Cache the results
        const cacheKey = `manual_${fileName}`;
        await setCache(cacheKey, finalData);

        // Register the "Repo" in the database so it shows up in the dashboard
        let user = await prisma.user.findUnique({
            where: { username: session.user.name || "admin" }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    username: session.user.name || "admin",
                    password: "password_not_needed_for_oauth"
                }
            });
        }

        const fullName = `manual/${fileName}`;
        await prisma.repo.upsert({
            where: { userId_fullName: { userId: user.id, fullName: fullName } },
            update: { isActive: true, lastScannedAt: new Date() },
            create: {
                userId: user.id,
                name: fileName,
                fullName: fullName,
                isActive: true,
                lastScannedAt: new Date()
            }
        });

        return NextResponse.json({ success: true, fullName });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
