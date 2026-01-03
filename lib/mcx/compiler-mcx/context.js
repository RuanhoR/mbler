module.exports = class McxContext {
  exports = {};
  __ENV__ = Object.freeze(process.env);
  process = class McxProcess {
    static version= "0.0.1";
    static env= Object.freeze(process.env),
    static versions = Object.freeze(process.versions)
  },
  callList: [],
  import: {}
}