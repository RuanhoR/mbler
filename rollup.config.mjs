import resolve from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'
import ts from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import { fstat, readFileSync, writeFileSync } from 'node:fs'
import * as path from 'node:path'
import { cp, readdir, rm } from 'node:fs/promises'
import { execSync } from 'node:child_process'
import Dts from 'rollup-plugin-dts'
import minify from '@rollup/plugin-terser'
writeFileSync(
  path.join(process.cwd(), 'src/version.ts'),
  `export default { commit: \`${execSync('git log -1').toString().replace(/`/g, '\\`')}\`, version: "${JSON.parse(readFileSync(path.join(import.meta.dirname, 'package.json')).toString()).version}" }`
)
// 基础配置
const main = {
  input: 'src/index.ts', // 入口文件
  output: [
    {
      file: 'dist/index.js', // CommonJS
      format: 'cjs',
      sourcemap: true,
    },
  ],
  plugins: [
    resolve(),
    json(),
    commonjs(),
    ts({
      tsconfig: path.resolve('tsconfig.json'),
      declaration: false,
      declarationDir: undefined,
    }),
    {
      name: 'copyResources',
      async buildEnd() {
        await cp(
          path.join(import.meta.dirname, 'src/template'),
          path.join(import.meta.dirname, 'dist/template'),
          {
            recursive: true,
            force: true,
          }
        )
        for (const f of await readdir(path.resolve('dist'))) {
          if (!['index.js', 'index.js.map', 'index.d.ts'].includes(f)) {
            await rm(path.join(import.meta.dirname, './dist', f), {
              recursive: true,
              force: true,
            })
          }
        }
      },
    },
  ],
  external: JSON.parse(
    readFileSync(path.join(import.meta.dirname, 'package.json'), 'utf-8')
  ).dependencies
    ? Object.keys(
        JSON.parse(
          readFileSync(path.join(import.meta.dirname, 'package.json'), 'utf-8')
        ).dependencies
      )
    : [],
}
if (process.env.BUILD_MODULE == 'release') {
  main.plugins.push(minify())
}
const dts = {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.d.ts',
    },
  ],
  plugins: [
    Dts({
      tsconfig: path.resolve('tsconfig.json'),
    }),
  ],
}
export default [main, dts]
