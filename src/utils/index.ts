import fs from "node:fs/promises"
import path from "node:path"
import { MblerConfigData, templateMblerConfig } from "../types";
import { BuildConfig } from "../build/config";
export async function FileExsit(file: string): Promise < boolean > {
  try {
    const f = await fs.stat(file);
    if (f) return true;
  } catch {
    return false;
  }
  return false;
}
export function join(baseDir: string, inputPath: string): string {
  return path.isAbsolute(inputPath) ?
    inputPath :
    path.join(baseDir, inputPath);
}
export async function ReadProjectMblerConfig(project: string): Promise<MblerConfigData> {
  const file = await readFileAsJson<MblerConfigData>(path.join(project, BuildConfig.ConfigFile));
  for (const key in file) {
    if (!(key in templateMblerConfig)) {
      throw new Error(`[read config]: read config from '${project}' error: Unexpected '${key}'`)
    }
  }
  return file;
}
export async function readFileAsJson<T>(filePath: string): Promise<T> {
  try {
    const content = await fs.readFile(filePath, "utf-8")
    const json = JSON.parse(content);
    return json as T;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    } else {
      throw new Error(err as string);
    }
  }
}