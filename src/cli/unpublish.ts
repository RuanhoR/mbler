import i18n from "../i18n";
import { CliParam } from "../types";
import { showText } from "../utils";
import { PublishManger } from "../publisher/publishManger";
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
    showText(`Package ${parsed.scope}/${parsed.name}@${parsed.version} unpublished successfully`);
    return 0;
  } catch (error) {
    showText(`Unpublish failed: ${error instanceof Error ? error.message : String(error)}`);
    return -1;
  }
}
