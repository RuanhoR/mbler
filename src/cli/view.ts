import i18n from "../i18n";
import { InstallManger } from "../publisher/installManger";
import { CliParam } from "../types";
import { showText } from "../utils";

function fmt(t: string, vars: Record<string, string | number>) {
  return t.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

function parsePackage(pkg: string): { scope: string; name: string } | null {
  const result = /^(@?[^/@\s]+)\/([^@\s]+)$/.exec(pkg);
  if (!result) return null;
  const scope = result[1]!.startsWith("@") ? result[1]! : `@${result[1]!}`;
  return {
    scope,
    name: result[2]!,
  };
}

export async function viewCommand(cliParam: CliParam, _: string) {
  const pkg = cliParam.params[1];
  if (!pkg) {
    showText(i18n.view.usage);
    return -1;
  }

  const parsed = parsePackage(pkg);
  if (!parsed) {
    showText(i18n.view.usage);
    return -1;
  }

  try {
    let info;
    try {
      info = await InstallManger.info(parsed.scope, parsed.name);
    } catch {
      info = await InstallManger.info(parsed.scope.slice(1), parsed.name);
    }
    if (!info.versions || info.versions.length === 0) {
      showText(fmt(i18n.view.packageNotFound, { pkg: `${parsed.scope}/${parsed.name}` }));
      return -1;
    }

    showText(fmt(i18n.view.title, { pkg: `${parsed.scope}/${parsed.name}` }));
    for (const v of info.versions) {
      showText(fmt(i18n.view.versionLine, {
        version: v.name,
        tag: v.version_tag,
        user: v.create_user?.name || "unknown",
        time: v.create_time,
      }));
    }
    return 0;
  } catch (error) {
    showText(fmt(i18n.view.failed, {
      error: error instanceof Error ? error.message : String(error),
    }));
    return -1;
  }
}
