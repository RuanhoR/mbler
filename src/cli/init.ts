import { CliParam } from '../types'
import { runCommand } from '../utils'
export async function initCommand(
  cliParam: CliParam,
  workdir: string
): Promise<number> {
  const { code } = await runCommand(['pnpm', '--version'], workdir, 'ignore')
  if (code === 0) {
    return (await runCommand(['pnpm', 'create', 'mbler'], workdir, 'inherit')).code ?? 1
  }
  return (await runCommand(['npm', 'create', 'mbler'], workdir, 'inherit')).code ?? 1
}
