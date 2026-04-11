import { createMCXLanguagePlugin } from '@mbler/mcx-server';
import { LanguagePlugin } from '@volar/language-core';
import { runTsc } from "@volar/typescript/lib/quickstart/runTsc";

/**
 * 运行 MCX TypeScript 编译器
 * 为 .mcx 文件提供 TypeScript 类型检查支持
 */
export function runTSC(
  tscpath: string = require.resolve("typescript/lib/tsc"),
): void {
  runTsc(
    tscpath,
    {
      extraSupportedExtensions: ['.mcx'],
      extraExtensionsToRemove: ['.mcx'],
    },
    (ts): LanguagePlugin<string>[] => {
      return [createMCXLanguagePlugin(ts as unknown as any)];
    }
  );
}

export default runTSC;

