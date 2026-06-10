// @ts-check
import resolve from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'
import ts from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import { readFileSync, writeFileSync } from 'node:fs'
import * as path from 'node:path'
import { execSync } from 'node:child_process'
import Dts from 'rollup-plugin-dts'
import minify from '@rollup/plugin-terser'
writeFileSync(
  path.join(process.cwd(), 'src/version.ts'),
  `export default { commit: \`${execSync('git log -1').toString().replace(/`/g, '\\`')}\`, version: "${JSON.parse(readFileSync(path.join(import.meta.dirname, 'package.json')).toString()).version}" }`
)
const main = {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'dist/index.esm.mjs',
      format: 'esm',
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
    })
  ],
  external: [
    '@volar/typescript/lib/quickstart/runTsc.js',
    'mbler/build',
    ...(JSON.parse(
      readFileSync(path.join(import.meta.dirname, 'package.json'), 'utf-8')
    ).dependencies
      ? Object.keys(
        JSON.parse(
          readFileSync(
            path.join(import.meta.dirname, 'package.json'),
            'utf-8'
          )
        ).dependencies
      )
      : []),
  ],
}
const build = {
  input: 'src/index.build.ts',
  output: [
    {
      file: 'dist/build.js',
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'dist/build.esm.mjs',
      format: 'esm',
      sourcemap: true,
    },
  ],
  plugins: main.plugins,
  external: main.external,
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

const buildDts = {
  input: 'src/index.build.ts',
  output: [
    {
      file: 'dist/build.d.ts',
    },
  ],
  plugins: [
    Dts({
      tsconfig: path.resolve('tsconfig.json'),
    }),
  ],
}
if (process.env.BUILD_MODULE == 'release') {
  main.plugins.push(minify())
}
/** @type {import('rollup').RollupOptions[]} */
export default [main, build, dts, buildDts]
