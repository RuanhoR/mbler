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
process.on('exit', (code) => {
  process.stdout.write('\x1b[?25h')
})
const endTasks: (() => void)[] = []
export function onEnd(task: () => void) {
  endTasks.push(task)
}
click('c', {
  ctrl: true,
}).then(() => {
  endTasks.forEach((task) => task())
  process.exit(0)
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
  static select<_, T extends Array<any>>(
    tip: string,
    arr: T
  ): Promise<T[number]> {
    let index: number = 0
    let win = false

    console.log(
      `\x1b[2K\x1b[47m\x1b[1m\x1b[30m${tip} ${i18n.commander.selectTip}   \x1b[0m\x1b[?25l`
    )
    console.log(Input.render(arr, index) + '\n\x1b[1A')

    const handlerNext = () => {
      if (win) return
      index++
      if (index >= arr.length) index = 0
      console.log(`\x1b[1A${Input.render(arr, index)}\n\x1b[1A`)
      click('n', {
        ctrl: false,
        alt: false,
      }).then(handlerNext)
    }

    return new Promise((resolve) => {
      click('n', {
        ctrl: false,
        alt: false,
      }).then(handlerNext)
      click('b', {
        ctrl: false,
        alt: false,
      }).then(() => {
        win = true
        process.stdout.write('\x1b[?25h')
        resolve(arr[index])
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
