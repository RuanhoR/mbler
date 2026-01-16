const fs = require('fs/promises')
const path = require('path')
module.exports = async function({
  param,
  DATA
}) {
  const body = await DATA()
  if (!body.name || body.name.includes('..')) return {
    data: null
  }
  if (typeof body.content !== 'string') return {
    data: null
  }
  try {
    const content = await fs.writeFile(
      path.join(param, body.name),
      body.content
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