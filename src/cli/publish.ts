import { CliParam } from "../types";
import { showText } from "../utils";
import { PublishManger } from "../publisher/publishManger";
import { TokenManger } from "../publisher/tokenManger";
import i18n from "../i18n";

function fmt(t: string, vars: Record<string, string | number>) {
  return t.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

export async function publishCommand(cliParam: CliParam, work: string) {
  const tag = cliParam.opts.tag || cliParam.params.find((p) => p.startsWith("-tag="))?.split("=")[1] || "latest";
  const buildRaw = (cliParam.opts.build || "").trim().toLowerCase();
  const buildMode = buildRaw === "skip" ? "skip" : "enable";
  try {
    await TokenManger.waitVeirfy();
    if (!TokenManger.isLogin) {
      showText(i18n.publish.notLoggedIn);
      return -1;
    }
    await PublishManger.publish(work, {
      build: buildMode,
      tag,
      onProgress: (progress) => showText(fmt(i18n.publish.progress, { progress })),
      onMessage: (message) => showText(message)
    });
    return 0;
  } catch (error) {
    showText(fmt(i18n.publish.publishFailed, {
      error: error instanceof Error ? error.message : String(error),
    }));
    return -1;
  }
}
