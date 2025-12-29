module.exports = class ItemComponent {
  static defaultConfig = {
    id: null,
    opt:{display_name: null,
    allow_off_hand: false,
    hand_equipped: false,
    max_stack_size: 64,
    stacked_by_data: true,
    }
  };
  static set defaultConfig(newValue) {
    return true;
  };
  #opt = {};
  constructor(opt) {
    const opts = {
      ...ItemComponent.defaultConfig,
      ...opt
    };
    this.#opt = opts;
  }
  setId(a) {
    if (typeof a === "string" && /^[\u0021-\u007E]+$/.test()) {this.#opt.id = a }else {throw new TypeError("id must is String")};
  }
  getId() {
    return this.#opt.id;
  }
  setName(a) {
    if (typeof name === "string") this.#opt.opt.display_name;
  }
  getName(a) {
    return this.#opt.opt.display_name;
  }
}