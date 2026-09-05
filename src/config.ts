import { homedir } from 'node:os'
import * as path from 'node:path'

/**
 * Per-user persistent data directory, following platform conventions:
 * Windows → %LOCALAPPDATA%\mbler, macOS → ~/Library/Caches/mbler,
 * Linux → $XDG_CACHE_HOME/mbler (default ~/.cache/mbler).
 */
function resolveDataDir(): string {
  if (process.platform === 'win32') {
    return path.join(
      process.env.LOCALAPPDATA || path.join(homedir(), 'AppData', 'Local'),
      'mbler'
    )
  }
  if (process.platform === 'darwin') {
    return path.join(homedir(), 'Library', 'Caches', 'mbler')
  }
  return path.join(
    process.env.XDG_CACHE_HOME || path.join(homedir(), '.cache'),
    'mbler'
  )
}

// Keep all persistent state under the user's own data directory — a shared
// world-writable temp dir would let other local users tamper with the
// config pointer and caches.
const config = {
  dataDir: resolveDataDir(),
  defaultPmnxBASE: 'https://d.pmnx.qzz.io',
}
export default config
