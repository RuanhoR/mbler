import i18n from "../i18n";
import { CliParam } from "../types";
import { showText } from "../utils";
import { PublishManger } from "../publisher/publishManger";
function fmt(t: string, vars: Record<string, string | number>) {
  return t.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

function parsePackage(pkg: string): { scope: string; name: string; version: string } | null {
  const result = /^(@[^/@\s]+)\/([^@\s]+)@(.+)$/.exec(pkg);
  if (!result) return null;
  return {
    scope: result[1]!,
    name: result[2]!,
    version: result[3]!,
  };
}

export async function unpublishCommand(cliParam: CliParam, work: string) {
  const pkg = cliParam.params[1];
  if (!pkg) {
    showText(i18n.help.unpublish);
    return -1;
  }

  const parsed = parsePackage(pkg);
  if (!parsed) {
    showText(i18n.help.unpublish);
    return -1;
  }

  try {
    await PublishManger.unpublish(parsed.scope, parsed.name, parsed.version);
    showText(fmt(i18n.unpublish.success, { pkg: `${parsed.scope}/${parsed.name}`, version: parsed.version }));
    return 0;
  } catch (error) {
    showText(fmt(i18n.unpublish.failed, { error: error instanceof Error ? error.message : String(error) }));
    return -1;
  }
}
