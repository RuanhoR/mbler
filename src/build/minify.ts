import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { type Plugin } from 'rolldown'

function resolvePackage(name: string, baseDir: string): string {
  const require = createRequire(path.join(baseDir, 'noop.js'))
  try {
    return require.resolve(name, { paths: [baseDir] })
  } catch {
    throw new Error(
      `\`${name}\` is required for minification. Install it in your project:\n` +
        `  npm i -D ${name}\n` +
        `  pnpm add -D ${name}\n` +
        `  yarn add -D ${name}`,
    )
  }
}

export function terserPlugin(baseBuildDir: string): Plugin {
  return {
    name: 'mbler:terser',
    async renderChunk(code) {
      const terserPath = pathToFileURL(resolvePackage('terser', baseBuildDir)).href
      const terser: typeof import('terser') = await import(terserPath)
      const res = await terser.minify(code, {
        format: { comments: false },
        compress: { unused: true },
      })
      return { code: res.code!, map: res.map as string }
    },
  }
}

export function esbuildPlugin(baseBuildDir: string): Plugin {
  return {
    name: 'mbler:esbuild',
    async renderChunk(code) {
      const esbuildPath = pathToFileURL(resolvePackage('esbuild', baseBuildDir)).href
      const esbuild: typeof import('esbuild') = await import(esbuildPath)
      const res = await esbuild.transform(code, {
        minify: true,
        loader: 'js',
      })
      return { code: res.code, map: res.map as string }
    },
  }
}
