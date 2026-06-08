import { execSync } from 'node:child_process'
import { writeFileSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'))
const commit = execSync('git log -1', { encoding: 'utf-8' }).replace(/`/g, '\\`')

writeFileSync(
  join(__dirname, '..', 'src/version.ts'),
  `export default { commit: \`${commit}\`, version: "${pkg.version}" }`,
)
