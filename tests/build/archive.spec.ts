import { afterEach, describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { readArchive } from 'mcbe-brarchive-ts'
import { generateArchives } from '../../src/build/archive'

const tmpDirs: string[] = []

function makeTree(root: string, tree: Record<string, string | Record<string, string>>) {
  for (const [name, value] of Object.entries(tree)) {
    if (typeof value === 'string') {
      const dir = path.dirname(path.join(root, name))
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(path.join(root, name), value)
    } else {
      fs.mkdirSync(path.join(root, name), { recursive: true })
      makeTree(path.join(root, name), value)
    }
  }
}

function listFiles(root: string): string[] {
  return fs
    .readdirSync(root, { recursive: true })
    .filter((f) => fs.statSync(path.join(root, String(f))).isFile())
    .map((f) => String(f).replace(/\\/g, '/'))
    .sort()
}

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

describe('generateArchives', () => {
  it('packs every sub-directory into __brarchive', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mbler-archive-'))
    tmpDirs.push(root)
    makeTree(root, {
      'textures/blocks/a.png': 'binary-a',
      'textures/blocks/b.json': '{"n":1}',
      'models/entity/m.json': '{}',
      'manifest.json': '{}',
    })

    const written = await generateArchives(root, { enabled: true })

    expect(path.relative(root, written[0]!)).toBe(
      path.join('__brarchive', 'models', 'entity.brarchive')
    )
    const files = listFiles(path.join(root, '__brarchive'))
    expect(files).toEqual([
      'models/entity.brarchive',
      'textures/blocks.brarchive',
    ])

    const entries = await readArchive(
      path.join(root, '__brarchive', 'textures', 'blocks.brarchive')
    )
    expect(entries.map((e) => e.name).sort()).toEqual(['a.png', 'b.json'])
  })

  it('honors exclude globs including the parent dir', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mbler-archive-'))
    tmpDirs.push(root)
    makeTree(root, {
      'textures/blocks/a.png': 'x',
      'textures/items/i.png': 'y',
      'sounds/b.ogg': 'z',
    })

    await generateArchives(root, { enabled: true, exclude: ['textures/**'] })

    const written = listFiles(path.join(root, '__brarchive'))
    expect(written).toEqual(['sounds.brarchive'])
  })

  it('skips directories that are empty', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mbler-archive-'))
    tmpDirs.push(root)
    makeTree(root, {
      'empty/inner/a.txt': '1',
    })

    await generateArchives(root, { enabled: true })

    const written = listFiles(path.join(root, '__brarchive'))
    expect(written).toEqual(['empty/inner.brarchive'])
  })

  it('does not archive an existing __brarchive dir', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mbler-archive-'))
    tmpDirs.push(root)
    makeTree(root, {
      'a/b.txt': '1',
      '__brarchive/keep/x.brarchive': 'binary',
    })

    await generateArchives(root, { enabled: true })

    const written = listFiles(path.join(root, '__brarchive'))
    expect(written).toEqual(['a.brarchive', 'keep/x.brarchive'])
  })
})
