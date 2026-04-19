import { CliParam } from "../types";
import { showText } from "../utils";

export function publishCommand(cliParam: CliParam, work: string) {
  showText("publish is planing")
  return 1;
}