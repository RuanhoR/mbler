const fs = require('fs/promises')
const sleep = require('./sleep')
async function readFileWithRetry(filePath, opt = {}) {
  const opts = {
    maxRetries: 5,
    delay: 200,
    want: 'string',
    ...opt
  }
  let lastError;
  for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
    try {
      let text = await fs.readFile(filePath);
      if (opts.want === 'string') text = text.toString()
      if (opts.want === 'object') {
        try {
          text = JSON.parse(text)
        } catch {
          text = {}
        }
      }
      return text;
    } catch (err) {
      lastError = err;
      if (attempt < opts.maxRetries - 1) {
        await sleep(opts.delay);
      }
    }
  }
  return {};
}

module.exports = readFileWithRetry;