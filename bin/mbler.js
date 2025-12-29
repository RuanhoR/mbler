#!/usr/bin/env node
try {
  const main = require('./../lib/start');
  new main(require('path').dirname(__dirname))
} catch (err) {
  if (err.message.includes("Cannot find module")) console.log("Plase call 'npm install'")
  else console.log(err)
}
process.on('SIGINT', () => {
  console.log('\n🛑 你按下了 Ctrl+C，程序即将退出！'+new Error().stack);
  // 你可以在这里输出一些状态，但依然无法直接获得 “当前执行到哪一行”
});
