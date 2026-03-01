import resolve from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'
import ts from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import { readFileSync } from 'node:fs'
import * as path from 'node:path'
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
  plugins: [resolve(), json(), commonjs(), ts()],
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
