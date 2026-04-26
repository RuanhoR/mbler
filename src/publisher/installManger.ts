import { writeFile } from "node:fs/promises";
import config from "../config";
import { MNXPackageInfoResult, MNXPackageVersionInfoResult } from "../types";

export class InstallManger {
  static async download(scope: string, name: string, version: string, outputPath: string) {
    const response = await fetch(`${config.defaultPmnxBASE}/package/${scope}/${name}/v/${version}/download`);
    if (!response.ok) {
      throw new Error(`Failed to download package: ${response.status} ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    await writeFile(outputPath, Buffer.from(buffer));
  }
  static async info(scope: string, name: string): Promise<MNXPackageInfoResult> {
    const response = await fetch(`${config.defaultPmnxBASE}/package/${scope}/${name}/info`);
    if (!response.ok) {
      throw new Error(`Failed to get package info: ${response.status} ${response.statusText}`);
    }
    const data = await response.json() as any;
    if (data.code !== 200) {
      throw new Error(`Failed to get package info: ${data.data}`);
    }
    return data.data;
  }
  static async versionInfo(scope: string, name: string, version: string): Promise<MNXPackageVersionInfoResult> {
    const response = await fetch(`${config.defaultPmnxBASE}/package/${scope}/${name}/v/${version}/info`);
    if (!response.ok) {
      throw new Error(`Failed to get package version info: ${response.status} ${response.statusText}`);
    }
    const data = await response.json() as any;
    if (data.code !== 200) {
      throw new Error(`Failed to get package version info: ${data.data}`);
    }
    return data.data;
  }
}