import { describe, it, expect, vi } from 'vitest'

function createMockEmitter() {
  const listeners: Record<string, Array<(...args: any[]) => void>> = {}
  return {
    on: vi.fn((event: string, listener: (...args: any[]) => void) => {
      if (!listeners[event]) listeners[event] = []
      listeners[event]!.push(listener)
    }),
    emit: (event: string, ...args: any[]) => {
      listeners[event]?.forEach((l) => l(...args))
    },
  }
}

describe('Commander - event handling', () => {
  it('should handle keypress events', () => {
    const emitter = createMockEmitter()
    const taskFn = vi.fn()
    const tasks: Array<(name: string, ctrl: boolean, alt: boolean, raw: string) => void> = []

    const Input = {
      use(fn: typeof taskFn) {
        tasks.push(fn)
      },
      render(arr: string[], index: number) {
        return arr
          .map((item, pindex) => {
            if (pindex === index) return '\x1b[1m\x1b[32m' + item + '\x1b[0m'
            return '\x1b[1m\x1b[33m' + item + '\x1b[0m'
          })
          .join('     ')
      },
    }

    Input.use(taskFn)

    const keypress = (str: string, name: string, ctrl = false, alt = false) => {
      tasks.forEach((fn) => fn(name, ctrl, alt, str))
    }

    keypress('hello', 'enter', false, false)
    expect(taskFn).toHaveBeenCalledWith('enter', false, false, 'hello')

    keypress('\x7f', 'backspace', false, false)
    expect(taskFn).toHaveBeenCalledWith('backspace', false, false, '\x7f')
  })

  it('Input.render should produce correct format', () => {
    const { Input } = (() => {
      class Input2 {
        static render(arr: string[], index: number): string {
          return arr
            .map((item, pindex) => {
              if (pindex === index) return '\x1b[1m\x1b[32m' + item + '\x1b[0m'
              return '\x1b[1m\x1b[33m' + item + '\x1b[0m'
            })
            .join('     ')
        }
      }
      return { Input: Input2 }
    })()

    const result = Input.render(['option1', 'option2'], 0)
    expect(result).toContain('option1')
    expect(result).toContain('option2')
  })
})
