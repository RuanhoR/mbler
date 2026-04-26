import { CliParam } from "../types";
import { showText } from "../utils";
import { PublishManger } from "../publisher/publishManger";
import { TokenManger } from "../publisher/tokenManger";

export async function publishCommand(cliParam: CliParam, work: string) {
  const tag = cliParam.params.find(p => p.startsWith("-tag="))?.split("=")[1] || "latest";
  try {
    await PublishManger.publish(work, {
      build: "enable",
      tag,
      onProgress: (progress) => showText(`Progress: ${progress}%`),
      onMessage: (message) => showText(message)
    });
    return 0;
  } catch (error) {
    showText(`Publish failed: ${error instanceof Error ? error.message : String(error)}`);
    return -1;
  }
}