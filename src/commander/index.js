let promises = [];
let tasks = [];
click("c", {
  ctrl: true,
  alt: false
}).then(() => {
  process.exit(0)
})
process.on("exit", (code)=>{
  process.stdout.write("\x1b[?25h");
})
module.exports = class Input {
  static rander(arr, index) {
    return arr.map((item, pindex) => {
      if (pindex === index) return "\x1b[1m\x1b[32m" + item + "\x1b[0m"
      return "\x1b[1m\x1b[33m" + item + "\x1b[0m"
    }).join("     ")
  }
  static select(tip, arr) {
    let index = 0;
    let win = false;
    console.log(`\x1b[2K\x1b[47m\x1b[1m\x1b[30m${tip} (按b确认，n键选择下一个)   \x1b[0m\x1b[?25l`)
    console.log(Input.rander(arr, index) + "\n\x1b[1A")

    function handlerNext() {
      if (win) {
        return;
      } else {
        index++
        if (index >= arr.length) index = 0;
        console.log(`\x1b[1A${Input.rander(arr, index)}\n\x1b[1A`)
        click("n", {
          ctrl: false,
          alt: false
        }).then(handlerNext);
      }
    }
    return new Promise((then) => {
      click("n", {
        ctrl: false,
        alt: false
      }).then(handlerNext)
      click("b", {
        ctrl: false,
        alt: false
      }).then(() => {
        win = true;
        process.stdout.write("\x1b[?25h")
        then(arr[index])
      })
    });
  }
  static use(task) {
    tasks.push(task)
  }
}

function handler(name, {
  raw,
  ctrl,
  alt
}) {
  const find = promises.find(e => e.name === raw && e.ctrl === ctrl);
  if (find) {
    find.then();
    promises = promises.filter(e => e !== find);
  }
  tasks.forEach(item => item(name, ctrl, alt, raw))
}

function click(name, {
  ctrl,
  alt
}) {
  return new Promise((then) => promises.push({
    name,
    ctrl: ctrl,
    alt: alt,
    then
  }));
}
process.stdin.setRawMode(true);
require('readline').emitKeypressEvents(process.stdin);
process.stdin.on('keypress', (str, key) => {
  handler(str, {
    raw: key.name,
    ctrl: Boolean(key.ctrl),
    alt: Boolean(key.alt)
  });
});