module.exports = class McxContext {
  exports = {};
  __ENV__ = Object.freeze(process.env);
  process = class McxProcess {
    static version: "0.0.1";
    env: Object.freeze(process.env)
  };
}