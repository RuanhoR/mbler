import path from "node:path";
import fs from "node:fs/promises";
import AdmZip from "adm-zip";
import { spawn } from "node:child_process";
import i18n from "../i18n";
import config from "./../config";
import { GamePath } from "../publisher/GamePath";
import { ConfigManger } from "../publisher/configManger";
import { CliParam } from "../types";
import { showText, compareVersion, isVaildVersion } from "../utils";
import { InstallManger } from "../publisher/installManger";
function fmt(t: string, vars: Record<string, string | number>) {
  return t.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

function parsePackage(pkg: string): { scope: string; name: string; version?: string } | null {
  const result = /^(@[^/@\s]+)\/([^@\s]+)(?:@(.+))?$/.exec(pkg);
  if (!result) return null;
  const info: { scope: string; name: string; version?: string } = {
    scope: result[1]!,
    name: result[2]!,
  };
  if (result[3]) {
    info.version = result[3];
  }
  return info;
}

function pickLatestVersion(versions: string[]) {
  const validVersions = versions.filter(isVaildVersion);
  if (validVersions.length > 0) {
    return validVersions.sort(compareVersion).reverse()[0] || "";
  }
  return versions[0] || "";
}

export async function installCommand(cliParam: CliParam, work: string) {
  const pkg = cliParam.params[1];
  if (!pkg) {
    showText(i18n.help.install);
    return -1;
  }

  const parsed = parsePackage(pkg);
  if (!parsed) {
    showText(i18n.help.install);
    return -1;
  }

  const { scope, name } = parsed;
  let version = parsed.version || "";

  const gamePoint = await GamePath.getPathWithASK();
  if (!gamePoint) {
    showText(i18n.help.install);
    return -1;
  }

  const packageJsonPath = path.join(work, "package.json");
  if (!await fs.stat(packageJsonPath).catch(() => null)) {
    showText(i18n.install.failedNoPackageJson);
    return -1;
  }
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
  if (!packageJson.scripts?.build) {
    showText(i18n.install.failedNoBuildScript);
    return -1;
  }

  showText(fmt(i18n.install.installing, { pkg }));
  try {
    if (!version) {
      const pkgInfo = await InstallManger.info(scope, name);
      if (!pkgInfo.versions || pkgInfo.versions.length === 0) {
        showText(fmt(i18n.install.packageNotFound, { pkg: `${scope}/${name}` }));
        return -1;
      }
      const versionCandidates = pkgInfo.versions
        .map((item) => item.name)
        .filter((name): name is string => typeof name === "string" && name.length > 0);
      version = pickLatestVersion(versionCandidates);
      if (!version) {
        showText(fmt(i18n.install.noVersion, { pkg: `${scope}/${name}` }));
        return -1;
      }
      showText(fmt(i18n.install.usingLatest, { version }));
    }

    const tmpDir = path.join(config.tmpdir, "tmp_mbler_install", `${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });
    await InstallManger.download(scope, name, version, path.join(tmpDir, "package.zip"));

    const zip = new AdmZip(path.join(tmpDir, "package.zip"));
    zip.extractAllTo(tmpDir, true);

    async function findAddonRoots(dir: string) {
      const results: Array<{ root: string; type: "behavior" | "resource" }> = [];
      async function walk(p: string) {
        const entries = await fs.readdir(p, { withFileTypes: true });
        for (const entry of entries) {
          const entryPath = path.join(p, entry.name);
          if (entry.isFile() && entry.name === "manifest.json") {
            try {
              const manifest = JSON.parse(await fs.readFile(entryPath, "utf-8"));
              const type = manifest?.modules?.[0]?.type;
              if (type === "data") {
                results.push({ root: path.dirname(entryPath), type: "behavior" });
              } else if (type === "resources") {
                results.push({ root: path.dirname(entryPath), type: "resource" });
              }
            } catch {
              // ignore invalid manifest
            }
          }
          if (entry.isDirectory()) {
            await walk(entryPath);
          }
        }
      }
      await walk(dir);
      return results;
    }

    const addons = await findAddonRoots(tmpDir);
    if (addons.length === 0) {
      throw new Error(i18n.install.noValidAddon);
    }

    const id = `${scope.slice(1)}-${name}-${version}`;
    const installed = (await ConfigManger.getKey<Array<Record<string, any>>>("installedPackages")) || [];
    for (const addon of addons) {
      const packDir = addon.type === "behavior" ? "behavior_packs" : "resource_packs";
      const dest = path.join(gamePoint, packDir, id);
      await fs.mkdir(dest, { recursive: true });
      await fs.cp(addon.root, dest, { recursive: true });
      installed.push({ id, scope, name, version, type: addon.type });
    }
    await ConfigManger.setKey("installedPackages", installed);

    await fs.rm(tmpDir, { recursive: true, force: true });

    await new Promise<void>((resolve, reject) => {
      const child = spawn("pnpm", ["build"], { cwd: work });
      child.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(i18n.publish.buildFailed.replace("{code}", String(code))));
      });
    });

    showText(fmt(i18n.install.success, { pkg: `${scope}/${name}`, version, id }));
    return 0;
  } catch (error) {
    showText(fmt(i18n.install.failed, { error: error instanceof Error ? error.message : String(error) }));
    return -1;
  }
}
