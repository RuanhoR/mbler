import path from "node:path";
import { fileExists, readFileAsJson, ReadProjectMblerConfig } from "../utils";
import { spawn } from "node:child_process";
import { generateRelease } from "../build/release";
import config from "../config";
import { PublishMetadata } from "../types";
import { readFile } from "node:fs/promises";
import { TokenManger } from "./tokenManger";
import i18n from "../i18n";

function fmt(t: string, vars: Record<string, string | number>) {
  return t.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

export class PublishManger {
  static async publish(projectPath: string, options: {
    onProgress?: (progress: number) => void;
    onMessage?: (message: string) => void;
    build: "skip" | "enable";
    tag?: string;
  }) {
    if (TokenManger.isLoading) await TokenManger.init()
    if (!await fileExists(projectPath)) {
      throw new Error(i18n.publish.projectPathNotExist);
    }
    const { onProgress = (p) => { }, onMessage = (m) => { }, build, tag } = options;
    onProgress(1);
    onMessage(i18n.publish.publishing);
    if (build == "enable") {
      onMessage(i18n.publish.building);
      await this.buildProject(projectPath);
      onProgress(30);
    }
    const mblerConfig = await ReadProjectMblerConfig(projectPath);
    const pkgData = await readFileAsJson<any>(path.join(projectPath, "package.json"));
    const outputPath = path.join(config.tmpdir, "mbler/0b09/release.zip")
    process.env.BUILD_MODULE = "release"
    const option: Parameters<typeof generateRelease>[0] = {
      outdirs: {
        behavior: mblerConfig.outdir?.behavior || path.join(projectPath, "dist", "behavior"),
        resources: mblerConfig.outdir?.resources || path.join(projectPath, "dist", "resources"),
        dist: outputPath
      },
      module: "all"
    }
    if (!option.outdirs.behavior || !option.outdirs.resources) {
      throw new Error(i18n.publish.outdirNotFound);
    }
    if (!await fileExists(option.outdirs.behavior) || !await fileExists(option.outdirs.resources)) {
      throw new Error(i18n.publish.outdirNotExist);
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
      throw new Error(i18n.publish.readmeNotFound);
    }
    const metadata: PublishMetadata = {
      readme: await readFile(readmePath, "utf-8"),
      scope: (mblerConfig.name.split("/").length > 1 ? mblerConfig.name.split("/")[0] : "") as string,
      name: mblerConfig.name.split("/").length > 1 ? mblerConfig.name.split("/")[1] : pkgData.name,
      version: mblerConfig.version,
      version_tag: tag || "latest"
    }
    if (!metadata.name || !metadata.version || !metadata.readme || !metadata.scope) {
      throw new Error(i18n.publish.metadataInvalid);
    }
    if (!/^@\w+\/\w+$/.test(mblerConfig.name)) {
      console.log(mblerConfig.name);
      throw new Error(i18n.publish.packageNameInvalid);
    }
    await generateRelease(option);
    onProgress(70);
    onMessage(i18n.publish.publishToMarket);
    const session = await PublishManger.createSession(metadata);
    await PublishManger.publishToMarketplace(outputPath, session);
    onProgress(100);
    onMessage(i18n.publish.publishSuccess);
    onMessage(fmt(i18n.publish.publishResult, { name: pkgData.name, version: metadata.version, tag: metadata.version_tag }));
  }
  static async unpublish(scope: string, name: string, version: string) {
    if (TokenManger.isLoading) await TokenManger.waitVeirfy();
    if (!TokenManger.isLogin) throw new Error(i18n.publish.notLoginError);
    const token = await TokenManger.getToken();
    if (!token) throw new Error(i18n.publish.tokenMissing);
    const response = await fetch(`${config.defaultPmnxBASE}/unpublish/${scope}/${name}/${version}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error(i18n.publish.unpublishReqFailed);
    }
    const result = await response.json() as any;
    if (result.code !== 200) {
      throw new Error(`${i18n.publish.unpublishReqFailed}: ${result.data}`);
    }
    return true;
  }
  static async createSession(metadata: PublishMetadata) {
    if (TokenManger.isLoading) await TokenManger.waitVeirfy();
    if (!TokenManger.isLogin) throw new Error(i18n.publish.notLoginError);
    const token = await TokenManger.getToken();
    if (!token) throw new Error(i18n.publish.tokenMissing);
    const response = await fetch(`${config.defaultPmnxBASE}/publish/session/${metadata.scope}/${metadata.name}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(metadata)
    });
    const session = await response.json() as any;
    if (!response.ok) {
      throw new Error(i18n.publish.createSessionFailed);
    }
    const sessionKey = session?.data?.sessionKey || session?.data?.sessionId;
    if (typeof session.data !== "object" || typeof sessionKey !== "string") {
      throw new Error(`${i18n.publish.createSessionFailed}: ${response.status} ${response.statusText}: ${session.data}`);
    }
    return sessionKey as string;
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
    if (!token) throw new Error(i18n.publish.tokenMissing);
    const response = await fetch(`${config.defaultPmnxBASE}/publish/session/${session}/upload`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });
    const result = await response.json() as any;
    if (!(typeof result.data == "string" && result.data.includes("successfully"))) {
      throw new Error(`${i18n.publish.uploadZipFailed}: ${result.data}` + JSON.stringify({
        url: `${config.defaultPmnxBASE}/publish/session/${session}/upload`,
        status: response.status,
        statusText: response.statusText,
        body: result,
        file: zipPath
      }, null, 2));
    }
    return true;
  }
  static async buildProject(projectPath: string) {
    const pkgData = await readFileAsJson<any>(path.join(projectPath, "package.json"));
    if (!pkgData) {
      throw new Error(i18n.publish.packageJsonNotFound);
    }
    if (!pkgData.scripts || !pkgData.scripts.build) {
      throw new Error(i18n.publish.noBuildScript);
    }
    const pkgManager = pkgData.packageManager || "npm";
    await new Promise((resolve, reject) => {
      const child = spawn(pkgManager, ["run", "build"], { cwd: projectPath });
      child.on("close", (code) => {
        if (code === 0) {
          resolve(void 0);
        } else {
          reject(new Error(fmt(i18n.publish.buildFailed, { code: code ?? -1 })));
        }
      });
    });
  }
}
