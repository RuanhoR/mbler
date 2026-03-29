import { TSC } from '@mbler/mcx-core';
import { LanguagePlugin, VirtualCode } from '@volar/language-core';
import { runTsc } from "@volar/typescript/lib/quickstart/runTsc";
import type * as ts from 'typescript';

/**
 * 运行 MCX TypeScript 编译器
 * 为 .mcx 文件提供 TypeScript 类型检查支持
 */
export function runTSC(
  tscpath: string = require.resolve("typescript/lib/tsc"),
): void {
  const extraSupportedExtensions = ['.mcx'];
  const extraExtensionsToRemove = ['.mcx'];

  return runTsc(
    tscpath,
    {
      extraSupportedExtensions,
      extraExtensionsToRemove,
    },
    (ts): LanguagePlugin<string>[] => {
      return [
        {
          getLanguageId(scriptId: string): string | undefined {
            if (scriptId.endsWith('.mcx')) {
              return 'mcx';
            }
            return undefined;
          },

          createVirtualCode(
            scriptId: string,
            languageId: string,
            snapshot: ts.IScriptSnapshot
          ): VirtualCode | undefined {
            if (languageId === 'mcx') {
              return TSC.createMCXVirtualCode(snapshot);
            }
            return undefined;
          },
        },
      ];
    }
  );
}

export default runTSC;

