// @ts-check
import { defineConfig } from 'rolldown'
import { dts } from 'rolldown-plugin-dts'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import * as path from 'node:path'
import { execSync } from 'node:child_process'

const pkg = JSON.parse(readFileSync(path.join(import.meta.dirname, 'package.json'), 'utf-8'))

writeFileSync(
  path.join(process.cwd(), 'src/version.ts'),
  `export default { commit: \`${execSync('git log -1').toString().replace(/`/g, '\\`')}\`, version: "${pkg.version}" }`
)

const dependencies = Object.keys(pkg.dependencies || {})

const external = [
  'mbler/build',
  ...dependencies,
  /@mbler\/*/,
  /typescript\/*/
]

const isRelease = process.env.BUILD_MODULE === 'release'

// clean stale dist output before the first bundle writes (both bundles share ./dist)
let distCleaned = false
const rmOldDist = {
  name: 'rm-old-dist',
  buildStart() {
    if (distCleaned) return
    distCleaned = true
    rmSync(path.join(import.meta.dirname, 'dist'), { recursive: true, force: true })
  }
}

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
        dir: "./dist",
        entryFileNames: "[name].mjs",
        format: 'esm',
        sourcemap: false,
        minify: isRelease || undefined,
      },
    ],
    plugins: [
      rmOldDist,
      dts()
    ]
  },
  {
    ...shared,
    input: { build: 'src/index.build.ts' },
    output: [
      {
        dir: "./dist",
        entryFileNames: "[name].mjs",
        format: 'esm',
        sourcemap: false,
        minify: isRelease || undefined,
      },
    ],
    plugins: [
      rmOldDist,
      dts()
    ]
  }
])
