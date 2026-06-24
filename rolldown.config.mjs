// @ts-check
import { defineConfig } from 'rolldown'
import { dts } from 'rolldown-plugin-dts'
import { readFileSync, writeFileSync } from 'node:fs'
import * as path from 'node:path'
import { execSync } from 'node:child_process'

writeFileSync(
  path.join(process.cwd(), 'src/version.ts'),
  `export default { commit: \`${execSync('git log -1').toString().replace(/`/g, '\\`')}\`, version: "${JSON.parse(readFileSync(path.join(import.meta.dirname, 'package.json')).toString()).version}" }`
)

const dependencies = Object.keys(
  JSON.parse(readFileSync(path.join(import.meta.dirname, 'package.json'), 'utf-8')).dependencies || {}
)

const external = [
  '@volar/typescript/lib/quickstart/runTsc.js',
  'mbler/build',
  ...dependencies,
]

const isRelease = process.env.BUILD_MODULE === 'release'

const shared = /** @type {const} */ ({
  platform: 'node',
  external,
  tsconfig: path.resolve('tsconfig.json'),
})
export default defineConfig([
  // JS bundles
  {
    ...shared,
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: true,
        minify: isRelease || undefined,
      },
      {
        file: 'dist/index.esm.mjs',
        format: 'esm',
        sourcemap: true,
        minify: isRelease || undefined,
      },
    ],
  },
  {
    ...shared,
    input: { build: 'src/index.build.ts' },
    output: [
      {
        file: 'dist/build.js',
        format: 'cjs',
        sourcemap: true,
        minify: isRelease || undefined,
      },
      {
        file: 'dist/build.esm.mjs',
        format: 'esm',
        sourcemap: true,
        minify: isRelease || undefined,
      },
    ],
  },
  // DTS bundles
  {
    ...shared,
    input: 'src/index.ts',
    output: {
      dir: 'dist',
      format: 'esm',
    },
    plugins: [
      dts({
        tsconfig: path.resolve('tsconfig.json'),
        resolver: 'tsc',
        emitDtsOnly: true,
      }),
    ],
  },
  {
    ...shared,
    input: { build: 'src/index.build.ts' },
    output: {
      dir: 'dist',
      format: 'esm',
    },
    plugins: [
      dts({
        tsconfig: path.resolve('tsconfig.json'),
        resolver: 'tsc',
        emitDtsOnly: true,
      }),
    ],
  },
])
