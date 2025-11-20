const fs = require('fs/promises')
const path = require('path')
module.exports = async function({
  param,
  DATA
}) {
  const body = await DATA()
  if (!body.name || body.name.includes('..')) return {
    err: 'has'
}
  try {
    const content = fs.rm(
      path.join(param, body.name)
    )
    return {
      data: 'ok'
    }
  } catch (err) {
    return {
      data: null
    }
  }
}