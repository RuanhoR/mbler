import * as fs from "node:fs/promises";
import * as path from "node:path";
import { MblerConfigData, templateMblerConfig } from "../types";
import { BuildConfig } from "../build/config";
export async function FileExsit(file: string): Promise<boolean> {
  try {
    const f = await fs.stat(file);
    if (f) return true;
  } catch {
    return false;
  }
  return false;
}
export function join(baseDir: string, inputPath: string): string {
  return path.isAbsolute(inputPath) ? inputPath : path.join(baseDir, inputPath);
}
export async function ReadProjectMblerConfig(
  project: string,
): Promise<MblerConfigData> {
  const file = await readFileAsJson<MblerConfigData>(
    path.join(project, BuildConfig.ConfigFile),
  );
  for (const key in file) {
    if (!(key in templateMblerConfig)) {
      throw new Error(
        `[read config]: read config from '${project}' error: Unexpected '${key}'`,
      );
    }
  }
  return file;
}
export async function readFileAsJson<T>(filePath: string): Promise<T> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
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
export function sleep(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}
export function stringToNumberArray(str: string): [number, number, number] {
  return str
    .split(".")
    .map((s) => parseInt(s, 10))
    .slice(0, 3) as [number, number, number];
}
export async function writeJSON(filePath: string, data: any): Promise<void> {
  const content = JSON.stringify(data, null, 2);
  if (!(await FileExsit(path.dirname(filePath)))) {
    fs.mkdir(path.dirname(filePath), { recursive: true }).catch(() => void 0);
  }
  return await fs.writeFile(filePath, content, "utf-8");
}
