import { runCommand } from '../utils'
import { defineCommand } from './command'

export const initCommand = defineCommand({
  name: 'init',
  aliases: [],
  description: 'mbler init\n  - Init current work dir, you can use `mbler work` command or use command param',
  args: [{ name: 'args', variadic: true, description: 'Extra arguments' }],
  options: [],
  async handler(ctx) {
    const workdir = ctx.workDir
    const { code } = await runCommand(['pnpm', '--version'], workdir, 'ignore')
    if (code === 0) {
      return (
        (
          await runCommand(
            ['pnpm', 'create', 'mbler', '--', workdir, ...process.argv.slice(3)],
            workdir,
            'inherit'
          )
        ).code ?? 1
      )
    }
    return (
      (
        await runCommand(
          ['npm', 'create', 'mbler', '--', workdir, ...process.argv.slice(3)],
          workdir,
          'inherit'
        )
      ).code ?? 1
    )
  },
})
