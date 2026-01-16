import Compiler from "./compile.js";
import type { McxOpt } from "../types.js";
export default async function CompileMcxDir(BuildOpt: McxOpt): Promise<void> {
  const compiler = new Compiler(BuildOpt);
  await compiler.start();
  if (compiler.runCode !== 0) {
    throw compiler.lastError;
  }
}