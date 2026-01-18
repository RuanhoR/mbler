// input-handler.ts

import * as readline from 'readline';

// 启用 raw mode 和键盘事件
process.stdin.setRawMode(true);
readline.emitKeypressEvents(process.stdin);

// 用于存储注册的异步按键处理器
interface KeyPromise {
  name: string;
  ctrl: boolean;
  alt: boolean;
  resolve: () => void;
}

const promises: KeyPromise[] = [];
const tasks: Array < (name: string, ctrl: boolean, alt: boolean, raw: string) => void > = [];
process.on('exit', (code) => {
  process.stdout.write('\x1b[?25h');
});

/**
 * 监听键盘输入并触发对应的 Promise 或任务
 */
function handler(
  name: string, {
    ctrl,
    alt
  }: {
    ctrl: boolean;alt: boolean
  }
) {
  // 查找是否有匹配的 Promise 等待触发
  const find = promises.find(
    (e) => e.name === name && e.ctrl === ctrl && e.alt === alt
  );
  if (find) {
    find.resolve();
    promises.splice(promises.indexOf(find), 1);
  }

  // 通知所有注册的监听任务
  tasks.forEach((item) => item(name, ctrl, alt, name));
}

/**
 * 模拟等待某个按键被按下，返回一个 Promise
 */
function click(
  name: string, {
    ctrl = false,
    alt = false
  }: {
    ctrl ? : boolean;alt ? : boolean
  }
): Promise < void > {
  return new Promise((resolve) => {
    promises.push({
      name,
      ctrl: ctrl || false,
      alt: alt || false,
      resolve
    });
  });
}

/**
 * 工具类：提供控制台交互功能，比如高亮菜单渲染、交互式选择等
 */
export class Input {
  /**
   * 渲染一个字符串数组，高亮当前选中的项
   * @param arr 菜单项数组
   * @param index 当前选中索引
   * @returns 格式化后的字符串
   */
  static render(arr: string[], index: number): string {
    return arr
      .map((item, pindex) => {
        if (pindex === index)
          return '\x1b[1m\x1b[32m' + item + '\x1b[0m'; // 亮绿，高亮
        return '\x1b[1m\x1b[33m' + item + '\x1b[0m'; // 亮黄
      })
      .join('     ');
  }

  /**
   * 提供一个交互式菜单选择器
   * @param tip 提示文本
   * @param arr 选项数组
   * @returns 用户选中的选项内容（Promise<string>）
   */
  static select(tip: string, arr: string[]): Promise < any > {
    let index: number = 0;
    let win = false;

    console.log(
      `\x1b[2K\x1b[47m\x1b[1m\x1b[30m${tip} (按 b 确认，n 键选择下一个)   \x1b[0m\x1b[?25l`
    );
    console.log(Input.render(arr, index) + '\n\x1b[1A');

    const handlerNext = () => {
      if (win) return;
      index++;
      if (index >= arr.length) index = 0;
      console.log(`\x1b[1A${Input.render(arr, index)}\n\x1b[1A`);
      click('n', {
        ctrl: false,
        alt: false
      }).then(handlerNext);
    };

    return new Promise((resolve) => {
      // 监听 n 按键来切换选项
      click('n', {
        ctrl: false,
        alt: false
      }).then(handlerNext);

      // 监听 b 按键来确认选择
      click('b', {
        ctrl: false,
        alt: false
      }).then(() => {
        win = true;
        process.stdout.
        write('\x1b[?25h');
        resolve(arr[index]);
      });
    });
  }

  /**
   * 注册一个全局任务，每次按键都会被调用
   * @param task 回调函数
   */
  static use(task: (name: string, ctrl: boolean, alt: boolean, raw: string) => void) {
    tasks.push(task);
  }
}
click("c", {
  ctrl: true
}).then(() => process.exit(0))

// 监听键盘输入事件
process.stdin.on('keypress', (str: string, key: any) => {
  const rawKeyName = key?.name || '';
  const ctrl = Boolean(key?.ctrl);
  const alt = Boolean(key?.alt);

  handler(rawKeyName, {
    ctrl,
    alt
  });
});