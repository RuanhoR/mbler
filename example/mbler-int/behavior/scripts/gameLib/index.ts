import { event } from './event';
import { loger, emtpyloger, Logger } from './loger';
import { Entity } from './entity';
import { createForm, regLayout } from './ui';

export class GameLib {
  public regLayout: typeof regLayout;
  public loger: Logger;
  public event: any;
  public entity: (rawEntity: any) => Entity;
  public createForm: (name: string, opt: any) => any;

  constructor(isLoger: boolean = true) {
    this.regLayout = regLayout;
    this.loger = isLoger ? loger : emtpyloger;
    // 访问时是 Object 对象
    this.event = new event(this.loger);
    // 访问时是 Function 对象
    this.entity = (rawEntity: any) => new Entity(this.loger, rawEntity);
    this.createForm = (name: string, opt: any) => createForm(this.loger, name, opt);
    this.loger.w(`gameLib 模块加载成功`);
  }
}

export * from './data';
export * from './utils';