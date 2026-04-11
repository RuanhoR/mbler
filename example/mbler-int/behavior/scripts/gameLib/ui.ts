import {
  ActionFormData,
  ModalFormData,
  MessageFormData,
  FormResponse,
  MessageFormResponse,
  ActionFormResponse,
  ModalFormResponse
} from "@minecraft/server-ui";
import { Player } from "@minecraft/server";
import config from "./config";
import { utils } from "./utils";
import { Logger } from './loger';

const uiConfig = config.ui;
const regs = new Map<symbol, any>();

interface FormCallback {
  (event: FormResponse): void;
}

interface LayoutOption {
  type: string;
  param?: any[];
}

interface FormOptions {
  title?: string;
  layout: LayoutOption[];
}

class ShowWrapper {
  private form: any;
  private callback: Map<symbol, FormCallback>;
  private running: Promise<void>;
  private key: [symbol, symbol];
  public isSuccess: boolean;

  constructor(form: any, player: Player) {
    this.form = form;
    this.callback = new Map();
    this.key = [
      Symbol("mcbe.gamelib.ui.onCancel"),
      Symbol("mcbe.gamelib.ui.onCommit")
    ];

    // 调用原生 show 方法
    this.running = form.show(player).then((event: FormResponse) => {
      if (event.canceled && this.callback.has(this.key[0])) {
        this.callback.get(this.key[0])!(event);
      } else {
        if (this.callback.has(this.key[1])) {
          this.callback.get(this.key[1])!(event);
        }
      }
      this.isSuccess = true;
    });
    this.isSuccess = false;
  }

  onCancel(callback: FormCallback): void {
    if (typeof callback === "function") this.callback.set(this.key[0], callback);
  }

  onCommit(callback: FormCallback): void {
    if (typeof callback === "function") this.callback.set(this.key[1], callback);
  }

  async waitSuccess(): Promise<void> {
    if (this.isSuccess) return;
    await this.running;
  }
}

/**
 * UI 表单封装类，用于根据配置动态创建、配置和显示 Minecraft 表单（如 Action、Modal、Message）。
 */
export class UI {
  public form: any; // 表单实例，如 ActionFormData 的实例
  public formType: string; // 表单类型，如 "Action"
  private logger: Logger; // 日志记录器
  private layoutGroup: any; // 当前表单类型支持的布局配置

  /**
   * 构造函数
   * @param name - 表单类型，如 "Action"、"Modal"、"Message"
   * @param logger - 日志对象，需实现 e() 和 w() 方法
   */
  constructor(name: string, logger: Logger) {
    const item = uiConfig.FormTypes?.[name];
    if (!item) {
      throw new TypeError(`Invalid form type: "${name}". Allowed: ${uiConfig.FormTypeArr.join(", ")}`);
    }
    this.form = new item(); // 实例化表单类
    this.formType = name;
    this.logger = logger;
    this.layoutGroup = uiConfig.LayoutTypes[name]; // 如 { button: { source: 'button', param: [...] } }
  }

  /**
   * 设置表单标题
   * @param newValue - 标题文本
   */
  set title(newValue: string) {
    if (typeof newValue !== "string") {
      throw new TypeError('Title must be a string.');
    }
    this.form.title(newValue); // 所有表单类都有 .title(string) 方法
  }

  /**
   * 动态添加一个表单布局组件（如按钮、文本等）
   * @param opt - 配置项
   * @param opt.type - 布局类型，如 "button"
   * @param opt.param - 对应该布局的参数列表
   */
  addLayout(opt: LayoutOption): void {
    const { type, param = [] } = opt;

    const layout = this.layoutGroup?.[type];
    if (!layout) {
      throw new TypeError(`Unknown layout type: "${type}".`);
    }

    const layoutRun = (this.form as any)[layout.source]?.bind(this.form);
    if (typeof layoutRun !== "function") {
      this.logger?.e?.(`Layout source "${layout.source}" is not a function.`);
      return;
    }

    if (!layout.param) {
      layoutRun(); // 无参数，直接调用
      return;
    }

    const args: any[] = [];
    for (let i = 0; i < layout.param.length; i++) {
      const paramName = layout.param[i]; // 如 "text"
      if (typeof paramName !== "string") {
        this.logger?.w?.(`Layout param name must be string, got ${typeof paramName} at index ${i}.`);
        continue;
      }
      const fieldDef = uiConfig.classic[paramName];
      const value = param[i];
      if (!this.matchCondition(fieldDef, value)) {
        // 在达到最小参数数时直接退出
        if (i >= (layout.minPar || 0)) continue;
        this.logger?.w?.(`Param "${paramName}" failed validation.`);
        continue;
      }
      args.push(value);
    }

    try {
      layoutRun(...args); // 调用表单方法并传入校验后的参数
    } catch (err: any) {
      this.logger?.e?.(`Failed to add layout "${type}": ${err}`);
    }
  }

  /**
   * 校验参数是否符合定义的类型和约束
   * @private
   * @param source - 字段定义
   * @param msg - 待校验的值
   * @returns 是否验证通过
   */
  private matchCondition(source: any, msg: any): boolean {
    if (!source) return false;
    if (typeof msg !== source.type) return false;
    if (typeof source.regexFunc === "function" && !source.regexFunc(msg)) {
      return false;
    }

    switch (source.type) {
      case "string":
        if (source.regex && !source.regex.test(msg)) return false;
        break;
      case "object":
        if (source.ObjectType && !(utils as any).typeVerify(msg, source.ObjectType)) return false;
        break;
      case "number":
        if (source.count && (msg < source.count[0] || msg > source.count[1])) {
          return false;
        }
        break;
    }

    return true;
  }

  /**
   * 显示表单给玩家
   * @param player - Minecraft 玩家对象
   * @param UseBeta - 使用新版 UI 库特性，兼容旧版
   */
  show(player: Player, UseBeta: boolean = false): ShowWrapper | Promise<FormResponse> {
    return UseBeta ? new ShowWrapper(this.form, player) : this.form.show(player);
  }
}

/**
 * 工厂函数：快速创建 UI 表单实例并初始化标题与布局
 * @param logger - 日志对象
 * @param name - 表单类型，如 "Action"
 * @param opt - 配置，含 title 和 layout 数组
 * @returns 表单实例
 */
export const createForm = (logger: Logger, name: string, opt?: any): UI => {
  let r_opt = opt;
  if (typeof opt === "symbol" && regs.has(opt)) {
    r_opt = regs.get(opt);
  }

  function _createForm(name: string, opt: FormOptions): UI {
    const validTypes = uiConfig.FormTypeArr;
    const err = new TypeError(
      `createForm must be called with name in [${validTypes.join(", ")}] and valid 'opt'.`
    );
    if (!validTypes.includes(name)) throw err;
    if (!opt || !Array.isArray(opt.layout)) throw err;

    const uiForm = new UI(name, logger);
    uiForm.title = typeof opt.title === "string" ? opt.title : "未设置";
    for (const item of opt.layout) {
      uiForm.addLayout(item);
    }
    return uiForm;
  }

  return _createForm(name, r_opt);
};

export const regLayout = (layout: any): Record<number, any> => {
  const layouts: Record<number, any> = {};
  if (Array.isArray(layout.regIds)) {
    for (let i = 0; i < layout.regIds.length; i++) {
      const item = layout.regIds[i];
      if (typeof item === "string" && layout[item] !== undefined) {
        layouts[i] = layout[item];
        regs.set(Symbol(item), layout[item]);
      }
    }
  }
  return layouts;
};