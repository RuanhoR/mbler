/**
 * @description - 提供组件编译json，由/compile-mcx/_compile调度
 */
import * as t from "./types"
export class ItemComponent {
  #opt: t.ItemComponentOpt
  constructor(opt: t.ItemComponentOpt) {
    this.#opt = opt;
  }
  toJSON(): t.ItemJSON {
    if (!this.#opt) throw new Error("[mcx component]: cannot read component")
    const result: t.ItemJSON = {
      format_version: "",
      "minecraft:item": {
        components: {},
        description: {
          identifier: ""
        }
      }
    }
    if (typeof this.#opt.format == "string" && /\d.\d.\d/.test(this.#opt.format)) {
      result["format_version"] = this.#opt.format;
    } else {
      throw new Error("[compile component]: no format")
    }
    if (typeof this.#opt.id == "string" && /[a-zA-Z0-9_]:[a-zA-Z0-9_]/.test(this.#opt.id)) {
      result["minecraft:item"].description.identifier = this.#opt.id
    } else {
      throw new Error("[compile component]:cno id")
    }
    const ApplyComponents = result["minecraft:item"].components;
    if (typeof this.#opt.name == "string") {
      ApplyComponents["minecraft:display_name"] = {
        value: this.#opt.name
      }
    }
    if (this.#opt.components) {
      const components = this.#opt.components;
      if (typeof components.damage == "number") {
        ApplyComponents["minecraft:damage"] = {
          value: components.damage
        }
      }
      if (typeof components.offHand == "boolean" && components.offHand) {
        ApplyComponents["minecraft:allow_off_hand"] = {
          value: true
        }
      }
      if (typeof components.DestroyInCreate == "boolean") {
        ApplyComponents["minecraft:can_destroy_in_creative"] = {
          value: components.DestroyInCreate
        }
      }
    }
    return result
  }
  // 外界方法
  /**
   * set name
   * @throws {Error}&
   * @param {string} newValue 
   * @returns {void}
   */
  setName(newValue: string): void {
    if (typeof newValue == "string") {
      this.#opt.name = newValue
    } else {
      throw new Error("[set error]: name type error")
    }
  }
  setIcon(newValue: string): void {
    if (typeof newValue == "string") {
      this.#opt.components.icon = newValue
    } else {
      throw new Error("[set error]: icon: type error")
    }
  }
  /**
   * get name
   * @returns {string} name
   */
  getName(): string {
    return this.#opt.name
  }
  /**
   * set identifier
   * @param {string} newValue
   */
  setId(newValue: string): void {
    if (typeof newValue == "string") {
      this.#opt.id == newValue
    } else {
      throw new Error("[set error]: id: type error")
    }
  }
  getId() {}
}
export default {
  Item: ItemComponent
}