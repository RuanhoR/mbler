const waitGC = () => new Promise(r => setImmediate(r));

module.exports = waitGC