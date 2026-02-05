import { join, parse } from "node:path";

export default function genentateModuleNode(moduleName: string, FilePath: string) {
  const _module = parse(moduleName);
  if (_module.root) throw new Error(`[mcx compile]: module name invalid ${moduleName} in ${FilePath} (You should not use absolute path as module name)`);

  if (_module.dir.startsWith(".")) {
    return join(FilePath, _module.dir, _module.base);
  }
  if (moduleName.startsWith("@minecraft/") || moduleName.startsWith("minecraft/") || moduleName.startsWith("@ruanhor/mcx")) {
    return {
      stat: "skip",
      data: null
    }
  }
  
}