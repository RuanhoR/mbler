import * as path from 'node:path'
import * as fs from 'node:fs'
import config from '../config'
import { compareVersion, sleep } from '../utils'
import type { npmFetchData } from '../types'

export interface cacheValue {
  formal: string
  beta: string
}

const Sapi = function (): {
  refresh: () => Promise<void>
  generateVersion: (
    module: '@minecraft/server-ui' | '@minecraft/server',
    mcVersion: string,
    isBeta: boolean,
    withFull: boolean
  ) => Promise<string>
} {
  const MAX_RETRIES = 3

  async function json(path: string, attempt = 1) {
    const r = await fetch('https://registry.npmjs.com' + path)
    if (!r.ok && attempt < MAX_RETRIES) {
      await sleep(1000 * attempt)
      return json(path, attempt + 1)
    }
    return await r.json()
  }

  const cacheFile = path.join(config.tmpdir, '_sapi_version.json')
  let cacheData: Array<{
    version: string
    server: cacheValue
    'server-ui': cacheValue
  }> | null = null

  async function fetchData(
    pkgName: string
  ): Promise<Record<string, cacheValue>> {
    const data = (await json(`/${pkgName}`)) as unknown as npmFetchData
    const pkgVersions = Object.keys(data.versions)
    const reValue: Record<string, cacheValue> = {}

    const mcVersionFrom = (str: string): string | null => {
      const m = str.match(/-(?:rc|beta)(?:\.[^-.]+)*?\.((?:\d+\.){2}\d+)/)
      return m ? (m[1] as string) : null
    }

    for (const v of pkgVersions) {
      const mcVersion = mcVersionFrom(v)
      if (!mcVersion) continue

      const isStable = /(?:-stable)(?:$|[-.])/.test(v)
      let entry = reValue[mcVersion]
      if (!entry) {
        entry = { formal: '', beta: '' }
        reValue[mcVersion] = entry
      }

      if (isStable) {
        if (!entry.formal || compareVersion(v, entry.formal) > 0) {
          entry.formal = v
        }
      } else {
        if (!entry.beta || compareVersion(v, entry.beta) > 0) {
          entry.beta = v
        }
      }
    }

    return reValue
  }

  const CACHE_TTL_DAYS = 5

  async function loadCacheFromDisk(): Promise<void> {
    const txt = await fs.promises.readFile(cacheFile, 'utf-8')
    const raw = JSON.parse(txt) as Array<Record<string, unknown>>
    if (raw.length > 0) {
      const first = raw[0]
      if (first && typeof first === 'object' && '_cachedAt' in first) {
        const cachedAt = new Date(first._cachedAt as string)
        const diffDays = (Date.now() - cachedAt.getTime()) / (1000 * 60 * 60 * 24)
        if (diffDays >= CACHE_TTL_DAYS) {
          await refresh()
          return
        }
        cacheData = raw.slice(1) as typeof cacheData
        return
      }
    }
    cacheData = raw as typeof cacheData
  }

  async function refresh() {
    const serverMap = await fetchData('@minecraft/server')
    const uiMap = await fetchData('@minecraft/server-ui')
    const versions = new Set([
      ...Object.keys(serverMap),
      ...Object.keys(uiMap),
    ])

    const arr: Array<{
      version: string
      server: cacheValue
      'server-ui': cacheValue
    }> = []

    for (const ver of versions) {
      arr.push({
        version: ver,
        server: serverMap[ver] ?? { formal: '', beta: '' },
        'server-ui': uiMap[ver] ?? { formal: '', beta: '' },
      })
    }

    arr.sort((a, b) => compareVersion(a.version, b.version))
    cacheData = arr

    const cacheWithMeta = [{ _cachedAt: new Date().toISOString() }, ...arr]

    await fs.promises.mkdir(config.tmpdir, { recursive: true }).catch(() => {})
    await fs.promises.writeFile(cacheFile, JSON.stringify(cacheWithMeta, null, 2), 'utf-8')
  }

  async function generateVersion(
    module: '@minecraft/server-ui' | '@minecraft/server',
    mcVersion: string,
    isBeta: boolean,
    withFull: boolean = false
  ): Promise<string> {
    if (!cacheData) {
      try {
        await loadCacheFromDisk()
      } catch {
        await refresh()
      }
    }

    if (!cacheData) {
      throw new Error(
        'unable to load SAPI version data. Check network connectivity or delete ~/.mbler/_sapi_version.json and try again.'
      )
    }

    let entry = cacheData.find((e) => e.version === mcVersion)
    if (!entry) {
      let candidate: (typeof cacheData)[0] | null = null
      for (const e of cacheData) {
        if (compareVersion(e.version, mcVersion) <= 0) {
          candidate = e
        } else {
          break
        }
      }
      entry = candidate ?? cacheData[0]
    }

    if (!entry) {
      throw new Error(
        `no SAPI version data found for Minecraft version ${mcVersion}`
      )
    }

    const moduleKey = module === '@minecraft/server' ? 'server' : 'server-ui'
    const entryModule = entry[moduleKey]
    let result = isBeta ? entryModule.beta : entryModule.formal
    if (!result) {
      result = entryModule.formal || entryModule.beta
    }
    if (withFull) return result || ''
    return evalVersion(result || 'error')
  }

  return {
    refresh,
    generateVersion,
  }
}

let sapiEmul: null | ReturnType<typeof Sapi> = null
export default new Proxy(
  {},
  {
    get(_, p) {
      if (!sapiEmul) sapiEmul = Sapi()
      return sapiEmul[p as keyof typeof sapiEmul]
    },
    set(_, p, n) {
      if (!sapiEmul) sapiEmul = Sapi()
      sapiEmul[p as keyof typeof sapiEmul] = n
      return true
    },
  }
) as ReturnType<typeof Sapi>

export function evalVersion(result: string): string {
  const tmp = result.split('-').slice(0, 2) as [string, string]
  tmp[1] = tmp[1].split('.')[0] as string
  return tmp.join('-')
}
