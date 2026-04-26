import path from "node:path";
import fs from "node:fs/promises";
import i18n from "../i18n";
import { CliParam } from "../types";
import { showText } from "../utils";
import { GamePath } from "../publisher/GamePath";
import { ConfigManger } from "../publisher/configManger";
import { TokenManger } from "../publisher/tokenManger";

function parsePackage(pkg: string): { scope: string; name: string; version: string } | null {
  const result = /^(@[^/@\s]+)\/([^@\s]+)@(.+)$/.exec(pkg);
  if (!result) return null;
  return {
    scope: result[1]!,
    name: result[2]!,
    version: result[3]!,
  };
}

export async function uninstallCommand(cliParam: CliParam, work: string) {
  const pkg = cliParam.params[1];
  if (!pkg) {
    showText(i18n.help.uninstall);
    return -1;
  }

  const parsed = parsePackage(pkg);
  if (!parsed) {
    showText(i18n.help.uninstall);
    return -1;
  }

  const gamePoint = await GamePath.getPathWithASK();
  if (!gamePoint) {
    showText(i18n.help.uninstall);
    return -1;
  }

  try {
    const id = `${parsed.scope.slice(1)}-${parsed.name}-${parsed.version}`;
    const behaviorDir = path.join(gamePoint, "behavior_packs", id);
    const resourceDir = path.join(gamePoint, "resource_packs", id);

    await fs.rm(behaviorDir, { recursive: true, force: true });
    await fs.rm(resourceDir, { recursive: true, force: true });

    // Remove from installed packages
    const installed = (await ConfigManger.getKey<Array<{ id: string }>>("installedPackages")) || [];
    const filtered = installed.filter((pkg) => pkg.id !== id);
    await ConfigManger.setKey("installedPackages", filtered);

    showText(`Package ${parsed.scope}/${parsed.name}@${parsed.version} uninstalled successfully`);
    return 0;
  } catch (error) {
    showText(`Uninstall failed: ${error instanceof Error ? error.message : String(error)}`);
    return -1;
  }
}
