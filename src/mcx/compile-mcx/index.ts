import Compiler from "./compile.js";
import type { CompileOpt } from "./types.js";
export default async function CompileMcxDir(BuildOpt: CompileOpt): Promise<void> {
  await Compiler(BuildOpt);
}