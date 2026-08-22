import { writeSync } from 'node:fs'
import * as readline from 'readline'
import i18n from '../i18n/index.js'
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true)
  readline.emitKeypressEvents(process.stdin)
}
interface KeyPromise {
  name: string
  ctrl: boolean
  alt: boolean
  resolve: () => void
}

const promises: KeyPromise[] = []
const tasks: Array<
  (name: string, ctrl: boolean, alt: boolean, raw: string) => void
> = []
process.on('exit', (_code) => {
  writeSync(1, '\x1b[?25h')
})
const endTasks: (() => void)[] = []
export function onEnd(task: () => void) {
  endTasks.push(task)
}
click('c', {
  ctrl: true,
}).then(() => {
  endTasks.forEach((task) => task())
  process.exitCode = 0
  if (process.stdin.isTTY) process.stdin.setRawMode(false)
  process.stdin.pause()
})
function handler(
  name: string,
  {
    ctrl,
    alt,
  }: {
    ctrl: boolean
    alt: boolean
  },
  raw: string
) {
  const find = promises.find(
    (e) => e.name === name && e.ctrl === ctrl && e.alt === alt
  )
  if (find) {
    find.resolve()
    promises.splice(promises.indexOf(find), 1)
  }
  tasks.forEach((item) => item(name, ctrl, alt, raw))
}
export function click(
  name: string,
  {
    ctrl = false,
    alt = false,
  }: {
    ctrl?: boolean
    alt?: boolean
  }
): Promise<void> {
  return new Promise((resolve) => {
    promises.push({
      name,
      ctrl: ctrl || false,
      alt: alt || false,
      resolve,
    })
  })
}
export class Input {
  static render(arr: string[], index: number): string {
    return arr
      .map((item, pindex) => {
        if (pindex === index) return '\x1b[1m\x1b[32m' + item + '\x1b[0m' // 亮绿，高亮
        return '\x1b[1m\x1b[33m' + item + '\x1b[0m' // 亮黄
      })
      .join('     ')
  }
  static select<T extends string[]>(tip: string, arr: T): Promise<T[number]> {
    let index: number = 0
    let win = false
    let blockRows = 0

    const stripAnsi = (s: string): string => {
      let out = ''
      let inSeq = false
      for (const ch of s) {
        if (ch === '\x1b') {
          inSeq = true
        } else if (inSeq) {
          if (ch === 'm') inSeq = false
        } else {
          out += ch
        }
      }
      return out
    }
    const visualWidth = (s: string): number => {
      let w = 0
      for (const ch of stripAnsi(s)) {
        w += (ch.codePointAt(0) ?? 0) > 0xff ? 2 : 1
      }
      return w
    }
    const lineRows = (s: string): number =>
      Math.max(1, Math.ceil(visualWidth(s) / (process.stdout.columns || 80)))

    const draw = (first: boolean): void => {
      const tipLine =
        '\x1b[47m\x1b[1m\x1b[30m' +
        `${tip} ${i18n.commander.selectTip}   ` +
        '\x1b[0m'
      const optionLine = Input.render(arr, index)
      const rows = lineRows(tipLine) + lineRows(optionLine)
      if (!first && blockRows > 0) {
        process.stdout.write(`\x1b[${blockRows - 1}A\r\x1b[J`)
      } else {
        process.stdout.write('\x1b[2K\x1b[?25l')
      }
      process.stdout.write(tipLine + '\n' + optionLine)
      blockRows = rows
    }

    const handlerNext = () => {
      if (win) return
      index++
      if (index >= arr.length) index = 0
      draw(false)
      click('n', {
        ctrl: false,
        alt: false,
      }).then(handlerNext)
    }

    return new Promise((resolve) => {
      draw(true)
      click('n', {
        ctrl: false,
        alt: false,
      }).then(handlerNext)
      click('b', {
        ctrl: false,
        alt: false,
      }).then(() => {
        win = true
        process.stdout.write('\x1b[?25h\n')
        resolve(arr[index]!)
      })
    })
  }
  static use(
    task: (name: string, ctrl: boolean, alt: boolean, raw: string) => void
  ) {
    tasks.push(task)
  }
}
process.stdin.on('keypress', (str: string, key) => {
  const rawKeyName = key?.name || ''
  const ctrl = Boolean(key?.ctrl)
  const alt = Boolean(key?.alt)

  handler(
    rawKeyName,
    {
      ctrl,
      alt,
    },
    str
  )
})
