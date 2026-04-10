import { ManifestData, MblerConfigData } from "../types";
import { stringToNumberArray } from "../utils";
import { fromString } from "../uuid";
import { BuildConfig } from "./config";
import Sapi from "./sapi";

async function generateManifest(
  config: MblerConfigData,
  type: "data" | "resources",
): Promise<ManifestData> {
  const manifest: ManifestData = {
    format_version: 2,
    header: {
      name: config.name,
      description: config.description,
      uuid: fromString(config.name, BuildConfig.salt.header + type),
      version: stringToNumberArray(config.version),
      min_engine_version: stringToNumberArray(
        typeof config.mcVersion === "string"
          ? config.mcVersion
          : (() => {
            throw new Error("mcVersion in mblerconfig should be a string");
          })(),
      ),
    },
    modules: [
      {
        type: type,
        uuid: fromString(config.name, BuildConfig.salt.module + type),
        description: `From Mbler(https://github.com/RuanhoR/mbler). welcome to star and contribute!`,
        version: stringToNumberArray(config.version),
      },
    ],
  };
  if (type === "data" && config.script) {
    manifest.modules.push({
      type: "script",
      uuid: fromString(config.name, BuildConfig.salt.sapi + type),
      description: `sapi generate by mbler, weclome to download and star at https://github.com/RuanhoR/mbler`,
      version: stringToNumberArray(config.version),
    });
    manifest.capabilities = ["script_eval"];
    manifest.dependencies = [
      {
        module_name: "@minecraft/server",
        version: (
          await Sapi.generateVersion(
            "@minecraft/server",
            config.mcVersion,
            config.script?.UseBeta || false,
          )
        ).split("-")[0] as string, // only major.minor.patch, remove -beta or -rc
      },
    ];
    if (config.script.ui) {
      manifest.dependencies.push({
        module_name: "@minecraft/server-ui",
        version: (
          await Sapi.generateVersion(
            "@minecraft/server-ui",
            config.mcVersion,
            config.script?.UseBeta || false,
          )
        ).split("-")[0] as string, // only major.minor.patch, remove -beta or -rc
      });
    }
  }
  return manifest;
}
export default generateManifest;
