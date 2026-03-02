import * as path from "node:path";
import { CliParam, MblerConfigData } from "../types";
import { FileExsit, isVaildVersion, readFileAsJson, showText } from "../utils";
import MBLERVersion from "./../version"
import { BuildConfig } from "../build/config";

export async function handlerVersion(cliParam: CliParam, workdir: string): Promise<number> {
  if (cliParam.params.length > 1) {
    if (!await FileExsit(workdir)) {
      showText("can't set workdir version, because not exists");
      return 1;
    }
    const version = cliParam.params[1];
    if (!version || !isVaildVersion(version)) {
      showText("can't set version, it is not a vaild version");
      return 1;
    }
    const pkgJSON = await readFileAsJson<{
      version: string;
    }>(path.join(workdir, "package.json"));
    const mblerConfigJSON = await readFileAsJson<MblerConfigData>(path.join(workdir, BuildConfig.ConfigFile));
    mblerConfigJSON.version = pkgJSON.version = version;
  } else {
    showVersion(cliParam);
  }
  return 0;
}
function showVersion(cliParam: CliParam) {
  let show = "";
  if (Object.getOwnPropertyNames(cliParam.opts).length < 1) {
    show = `commit: ${MBLERVersion.commit}\nversion: ${MBLERVersion.version}`
  } else if (cliParam.opts.show) {
    if (cliParam.opts.show == "commit") {
      show = `commit: ${MBLERVersion.commit}`;
    } else if (cliParam.opts.show == "version") {
      show = `version: ${MBLERVersion.version}`
    } else {
      show = 'invaild "show" param'
    }
  }
  showText(show);
}