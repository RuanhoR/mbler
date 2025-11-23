import {
  event
} from "./event.js";
import {
  loger,
  emtpyloger
} from "./loger.js"
import {
  Entity
} from "./entity.js"
import {
  createForm
} from "./ui.js"
export class GameLib {
  constructor(isLoger = true) {
    this.loger = isLoger ? loger : emtpyloger;
    // 访问时是 Object 对象
    this.event = new event(this.loger);
    //  访问时是 Function 对象
    this.entity = (rawEntity) => new Entity(this.loger, rawEntity)
    this.createFrom = (name,opt)=>createForm(this.loger, name,opt);
    this.loger.w(`gameLib 模块加载成功`)
  }
}