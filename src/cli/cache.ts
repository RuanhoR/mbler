import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import config from '../config'
import { defineCommand } from './command'
import { showText } from '../utils'
import Sapi from '../build/sapi'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export const cacheCommand = defineCommand({
  name: 'cache',
  aliases: [],
  description: 'Manage caches',
  args: [
    { name: 'action', description: 'refresh, list, or <cache_type>', required: true },
    { name: 'subaction', description: 'sapi_version, clear' },
  ],
  options: [],
  async handler(ctx) {
    const { action, subaction } = ctx.args

    if (action === 'list') {
      const sapiFile = join(config.tmpdir, '_sapi_version.json')
      let size = 0
      try {
        size = (await stat(sapiFile)).size
      } catch {
        // file not found, size stays 0
      }
      showText('cache:')
      showText(`└─ _sapi_version.json: ${formatSize(size)}`)
      return 0
    }

    if (action === 'refresh' && subaction === 'sapi_version') {
      await Sapi.refresh()
      showText('sapi_version cache refreshed')
      return 0
    }

    if (action === 'sapi_version' && subaction === 'clear') {
      const { rm } = await import('node:fs/promises')
      const sapiFile = join(config.tmpdir, '_sapi_version.json')
      await rm(sapiFile, { force: true })
      showText('sapi_version cache cleared')
      return 0
    }

    showText('Unknown cache command. Usage: cache refresh sapi_version | cache sapi_version clear | cache list')
    return 1
  },
})
