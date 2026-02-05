import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import type { JsCompileData, MCXCompileData } from "../compiler/compileData";
import { compileJSFn, compileMCXFn } from "../compiler";
import { FileExsit } from "../../../utils";

class Utils {
  public CheckPath(filePath: string): string {
    if (!filePath || typeof filePath !== "string")
      throw new Error("filePath is empty");
    const file = resolve(filePath);
    return file;
  }
  public readFile(filePath: string): Promise<Buffer> {
    const file = this.CheckPath(filePath);
    return readFile(file);
  }
  public readFileAsJSON(filePath: string): Promise<any> {
    return this.readFile(filePath).then((data) => JSON.parse(data.toString()));
  }
  public readFileAsMcx(filePath: string): Promise<MCXCompileData> {
    return this.readFile(filePath).then((data) =>
      compileMCXFn(data.toString()),
    );
  }
  public readFileAsJS(filePath: string): Promise<JsCompileData> {
    return this.readFile(filePath).then((data) => {
      const code = data.toString();
      return compileJSFn(code);
    });
  }
  public async writeFile(
    filePath: string,
    data: string | Buffer,
  ): Promise<boolean> {
    const file = this.CheckPath(filePath);
    const basedir = basename(filePath);
    if (!(await FileExsit(basedir))) await mkdir(basedir, { recursive: true });
    return await writeFile(file, data).then(
      () => true,
      () => false,
    );
  }
}
const utils = new Utils();
export default utils;
export { utils as Utils };