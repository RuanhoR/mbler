for (let i of require('./From')) {
  module.exports[i] = require(`./${i}`)
}
