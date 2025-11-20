const fs = require('fs/promises')
const path = require('path')
module.exports = async function({
  param,
  query
}) {
  const name = query.get('name')
  if (!name || name.includes('..')) return {
    data: null
  }
  try {
    const content = await fs.readFile(
      path.join(param, name)
    )
    return {
      data: content.toString()
    }
  } catch (err) {
    return {
      data: null
    }
  }
}