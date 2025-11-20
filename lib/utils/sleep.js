
const sleep = (ms = 100) =>
  new Promise(resolve => setTimeout(resolve, ms));
// 将setTimeout的回调式改成Promise，方便
module.exports = sleep