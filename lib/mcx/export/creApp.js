module.exports = function CreateApp(mcx) {
  return new UseMcx(mcx)
}
class UseMcx {
  this.mcx;
  constructor(mcx) {
    this.mcx = mcx;
  }
  mount(world, system) {
    if (global.mcxBuild && typeof global.mcxBuild.then === "function") {
      global.mcxBuild.then(mcx, )
    }
  }
}