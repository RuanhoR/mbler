const createApp = function() {
  // 使用闭包
  class CreateApp {
    constructor(mcx) {
      this.mcx = mcx;
    }
    mount(world, system) {
      const gameib = new GameLib(world, system);
      if (this.mcx.event) gamelib.subscibe(event);
    }
  }
  return (mcx) => new CreateApp(mcx)
}();