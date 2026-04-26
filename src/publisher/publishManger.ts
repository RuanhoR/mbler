import path from "node:path";
import { fileExists, readFileAsJson, ReadProjectMblerConfig } from "../utils";
import { spawn } from "node:child_process";
import { generateRelease } from "../build/release";
import config from "../config";
import { PublishMetadata } from "../types";
import { readFile } from "node:fs/promises";
import { TokenManger } from "./tokenManger";

export class PublishManger {
  static async publish(projectPath: string, options: {
    onProgress?: (progress: number) => void;
    onMessage?: (message: string) => void;
    build: "skip" | "enable";
    tag?: string;
  }) {
    if (TokenManger.isLoading) await TokenManger.init()
    if (!await fileExists(projectPath)) {
      throw new Error("Project path does not exist");
    }
    const { onProgress = (p) => { }, onMessage = (m) => { }, build, tag } = options;
    onProgress(1);
    onMessage("Publishing...");
    if (build == "enable") {
      onMessage("Building project...");
      await this.buildProject(projectPath);
      onProgress(30);
    }
    const mblerConfig = await ReadProjectMblerConfig(projectPath);
    const pkgData = await readFileAsJson<any>(path.join(projectPath, "package.json"));
    const outputPath = path.join(config.tmpdir, "mbler/0b09/release.zip")
    const option: Parameters<typeof generateRelease>[0] = {
      outdirs: {
        behavior: mblerConfig.outdir?.behavior || path.join(projectPath, "dist", "behavior"),
        resources: mblerConfig.outdir?.resources || path.join(projectPath, "dist", "resources"),
        dist: outputPath
      },
      module: "all"
    }
    if (!option.outdirs.behavior || !option.outdirs.resources) {
      throw new Error("Build output directories not found");
    }
    if (!await fileExists(option.outdirs.behavior) || !await fileExists(option.outdirs.resources)) {
      throw new Error("Build output directories do not exist");
    }
    if (await fileExists(option.outdirs.behavior)) {
      option.module = "behavior";
    }
    if (await fileExists(option.outdirs.resources)) {
      if (option.module == "behavior") {
        option.module = "all";
      } else {
        option.module = "resources";
      }
    }
    let readmePath = path.join(projectPath, "README.md");
    if (await fileExists(path.join(projectPath, "README.md"))) {
      readmePath = path.join(projectPath, "README.md");
    }
    if (await fileExists(path.join(projectPath, "readme.md"))) {
      readmePath = path.join(projectPath, "readme.md");
    }
    if (await fileExists(path.join(projectPath, "Readme.md"))) {
      readmePath = path.join(projectPath, "Readme.md");
    }
    if (await fileExists(path.join(projectPath, "README.MD"))) {
      readmePath = path.join(projectPath, "README.MD");
    }
    if (await fileExists(path.join(projectPath, "readme.MD"))) {
      readmePath = path.join(projectPath, "readme.MD");
    }
    if (await fileExists(path.join(projectPath, "Readme.MD"))) {
      readmePath = path.join(projectPath, "Readme.MD");
    }
    if (await fileExists(path.join(projectPath, "README.markdown"))) {
      readmePath = path.join(projectPath, "README.markdown");
    }
    if (await fileExists(path.join(projectPath, "readme.markdown"))) {
      readmePath = path.join(projectPath, "readme.markdown");
    }
    if (await fileExists(path.join(projectPath, "Readme.markdown"))) {
      readmePath = path.join(projectPath, "Readme.markdown");
    }
    if (await fileExists(path.join(projectPath, "README"))) {
      readmePath = path.join(projectPath, "README");
    }
    if (!await fileExists(readmePath)) {
      throw new Error("README file not found");
    }
    const metadata: PublishMetadata = {
      readme: await readFile(readmePath, "utf-8"),
      scope: (mblerConfig.name.split("/").length > 1 ? mblerConfig.name.split("/")[0] : "") as string,
      name: mblerConfig.name.split("/").length > 1 ? mblerConfig.name.split("/")[1] : pkgData.name,
      version: mblerConfig.version,
      version_tag: tag || "latest"
    }
    if (!metadata.name || !metadata.version || !metadata.readme || !metadata.scope) {
      throw new Error("Invalid metadata");
    }
    if (!/^@\w+\/\w+$/.test(mblerConfig.name)) {
      console.log(mblerConfig.name);
      throw new Error("Package name must be in the format of @scope/name");
    }
    await generateRelease(option);
    onProgress(70);
    onMessage("Publishing to marketplace...");
    const session = await PublishManger.createSession(metadata);
    await PublishManger.publishToMarketplace(outputPath, session);
    onProgress(100);
    onMessage("Publish successful");
    onMessage(`+ ${pkgData.name}@${metadata.version} (${metadata.version_tag})`);
  }
  static async unpublish(scope: string, name: string, version: string) {
    if (TokenManger.isLoading) await TokenManger.waitVeirfy();
    if (!TokenManger.isLogin) throw new Error("Not logged in");
    const token = await TokenManger.getToken();
    if (!token) throw new Error("Failed to get token");
    const response = await fetch(`${config.defaultPmnxBASE}/unpublish/${scope}/${name}/${version}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error("Failed to unpublish package");
    }
    const result = await response.json() as any;
    if (result.code !== 200) {
      throw new Error(`Failed to unpublish package: ${result.data}`);
    }
    return true;
  }
  static async createSession(metadata: PublishMetadata) {
    if (TokenManger.isLoading) await TokenManger.waitVeirfy();
    if (!TokenManger.isLogin) throw new Error("Not logged in");
    const token = await TokenManger.getToken();
    if (!token) throw new Error("Failed to get token");
    const response = await fetch(`${config.defaultPmnxBASE}/publish/session/${metadata.scope}/${metadata.name}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(metadata)
    });
    const session = await response.json() as any;
    console.log(session)
    if (!response.ok) {
      throw new Error("Failed to create publish session");
    }
    if (typeof session.data !== "object" || typeof session.data.sessionKey !== "string") {
      throw new Error(`${response.status} ${response.statusText}: ${session.data}`);
    }
    return session.data.sessionKey as string;
  }
  static async publishToMarketplace(zipPath: string, session: string) {
    const formData = new FormData();
    const fileBit = await readFile(zipPath);
    let fileName = path.basename(zipPath);
    if (fileName.endsWith(".mcaddon")) {
      fileName = fileName.slice(0, -".mcaddon".length) + ".zip";
    }
    formData.append("file", new File([fileBit], fileName, { type: "application/zip" }));
    const token = await TokenManger.getToken();
    if (!token) throw new Error("Failed to get token");
    const response = await fetch(`${config.defaultPmnxBASE}/publish/session/${session}/upload`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });
    if (!response.ok) {
      throw new Error("Failed to upload zip file");
    }
    const result = await response.json() as any;
    if (result.code !== 200) {
      throw new Error(`Failed to upload zip file: ${result.data}`);
    }
    return true;
  }
  static async buildProject(projectPath: string) {
    const pkgData = await readFileAsJson<any>(path.join(projectPath, "package.json"));
    if (!pkgData) {
      throw new Error("package.json not found");
    }
    if (!pkgData.scripts || !pkgData.scripts.build) {
      throw new Error("No build script found in package.json");
    }
    const pkgManager = pkgData.packageManager || "npm";
    await new Promise((resolve, reject) => {
      const child = spawn(pkgManager, ["run", "build"], { cwd: projectPath });
      child.on("close", (code) => {
        if (code === 0) {
          resolve(void 0);
        } else {
          reject(new Error(`Build failed with code ${code}`));
        }
      });
    });
  }
}