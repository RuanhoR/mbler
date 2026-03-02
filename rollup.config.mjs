import resolve from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'
import ts from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import { readFileSync, writeFileSync } from 'node:fs'
import * as path from 'node:path'
import { cp } from 'node:fs/promises'
import { execSync } from 'node:child_process'
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
    ts(),
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
export default [main]
