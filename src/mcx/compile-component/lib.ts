import * as t from "./types"
class ItemComponent {
  opt: t.itemComponentOpt
  constructor(FileId: string, opt: t.itemComponentOpt) {
    this.opt = opt;
  }
  toJSON() {
    if (!this.opt) throw new Error("[mcx component]: cannot read component")
    const result: any = {}
    if (this.opt.format) {
      result["format_version"] = this.opt.format;
    }
  }
}
class Component {
  static Item = ItemComponent
}
export default {}