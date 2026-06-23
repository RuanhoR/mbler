import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { type Plugin } from 'rolldown'

function resolvePackage(name: string, baseBuildDir: string): string {
  const require = createRequire(path.join(baseBuildDir, 'noop.js'))
  try {
    return require.resolve(name, { paths: [baseBuildDir] })
  } catch {
    throw new Error(
      `\`${name}\` is required for minification. Install it in your project:\n` +
        `  npm i -D ${name}\n` +
        `  pnpm add -D ${name}\n` +
        `  yarn add -D ${name}`
    )
  }
}

export function terserPlugin(baseBuildDir: string): Plugin {
  return {
    name: 'mbler:terser',
    async generateBundle(_, bundle) {
      const terserPath = pathToFileURL(
        resolvePackage('terser', baseBuildDir)
      ).href
      const terser: typeof import('terser') = await import(terserPath)
      for (const [, chunk] of Object.entries(bundle)) {
        if (chunk.type !== 'chunk') continue
        const res = await terser.minify(chunk.code, {
          format: { comments: false },
          compress: { unused: true, dead_code: true, if_return: true },
        })
        if (res.code) chunk.code = res.code
      }
    },
  }
}

export function esbuildPlugin(baseBuildDir: string): Plugin {
  return {
    name: 'mbler:esbuild',
    async generateBundle(_, bundle) {
      const esbuildPath = pathToFileURL(
        resolvePackage('esbuild', baseBuildDir)
      ).href
      const esbuild: typeof import('esbuild') = await import(esbuildPath)
      for (const [, chunk] of Object.entries(bundle)) {
        if (chunk.type !== 'chunk') continue
        const res = await esbuild.transform(chunk.code, {
          minify: true,
          loader: 'js',
        })
        chunk.code = res.code
      }
    },
  }
}
