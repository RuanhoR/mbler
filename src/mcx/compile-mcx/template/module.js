class Module {
  modules;
  constructor() {
    this.init()
  }
  init() {

  }
  import(ModuleDir, dirname) {
    const _Import = (ModuleDir, dirname) => {
      const foundModule = this.modules[key];
      if (foundModule) {
        if (foundModule.isLoad) return foundModule.data;
        foundModule.Load();
        return foundModule.data;
      }
      throw new Error(`Cannot find module '${ModuleDir}'`);
    }
    _Import(ModuleDir, dirname)
  }
  HandlerModule(id, fn) {
    if (typeof fn !== "function" || typeof name !== "") throw new Error("Cannot create Module");
    this.modules[id] = {
      fn: fn,
      isLoad: false,
      Load() {
        if (isLoad) return;
        const __Module = {
          export: {},
          currenyId: id
        };
        fn(__Module);
        this.data = exp;
        this.isLoad = true;
      }
    };
  }
}