const commander = require("./../commander");
let curr;
let currstr = "";
let tip = "";
let show = true;
// 在输入时使用输入中间件
commander.use(function(name, ctrl, alt, raw) {
  if (typeof curr !== "function") return;
  if (ctrl || alt) return;
  if (raw) {
    if (raw === 'return' || raw === 'enter') {
      curr(currstr);
      curr = null;
      currstr = "";
      console.log("")
      return;
    }
    if (raw === 'backspace') {
      currstr = currstr.slice(0, -1);
      refreshInput();
      return;
    }
  }
  if (name && typeof name === 'string' && name.length === 1) {
    currstr += name;
    refreshInput();
  }
});

function refreshInput() {
  const out = `\x1b[2K\r${tip}${show ? currstr : ""}`;
  process.stdout.write(out);
}
/**
 * 输入文本
 * @param{string} tip 提示
 * @param{boolean} show 是否显示输入
*/
module.exports = async function(t = "", g = true) {
  return new Promise((resolve) => {
    show = g;
    tip = t;
    refreshInput();
    curr = resolve;
  });
};