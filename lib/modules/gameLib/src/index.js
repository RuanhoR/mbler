import {
  event
} from "./event.js";
import {
  loger,
  emtpyloger
} from "./loger.js"
import {
  entity
} from "./entity.js"
export class GameLib {
  constructor(isLoger = true) {
    this.loger = isLoger ? loger : emtpyloger;
    // 访问时是 Object 对象
    this.event = new event(this.loger);
    //  访问时是 Function 对象
    this.entity = (rawEntity) => new entity(this.loger, rawEntity)
    this.loger.w(`gameLib 模块加载成功`)
  }
}