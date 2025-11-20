const readline = require("readline");
module.exports = async function(t = "") {
  const e = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(i => {
    e.question(t, t => {
      e.close(), i(t)
    })
  })
}