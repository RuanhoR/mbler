import {
  ActionFormData,
  ModalFormData,
  MessageFormData
} from "@minecraft/server-ui"
import config from "./config.js";
import {
  utils
} from "./utils";
const uiConfig = config.ui;
const regs = new Map;
class show {
  form;
  callback = new Map;
  running;
  key = [
    Symbol("mcbe.gamelib.ui.onCancel"),
    Symbol("mcbe.gamelib.ui.onCommit")
  ];
  constructor(form, player) {
    this.form = form;
    // 调用原生 show 方法
    this.running = form.show(player).then(event => {
      const {
        callback
      } = this;
      if (event.canceled && callback.has(this.key[0])) {
        callback.get(this.key[0])(event);
      } else {
        callback.has(this.key[1]) && callback.get(this.key[1])(event);
      }
      this.isSuccess = true;
    })
    this.isSuccess = false;
  }
  onCancel(callback) {
    if (typeof callback === "function") this.callback.set(this.key[0], callback);
  }
  onCommit(callback) {
    if (typeof callback === "function") this.callback.set(this.key[1], callback);
  }
  async waitSuccess() {
    if (this.isSuccess) return;
    await this.running;
  }
}
/**
 * UI 表单封装类，用于根据配置动态创建、配置和显示 Minecraft 表单（如 Action、Modal、Message）。
 */
export class UI {
  form; // 表单实例，如 ActionFormData 的实例
  formType; // 表单类型，如 "Action"
  logger; // 日志记录器，需有 e() 和 w() 方法
  layoutGroup; // 当前表单类型支持的布局配置，如 { button: { source: 'button', param: [...] } }

  /**
   * 构造函数
   * @param {string} name - 表单类型，如 "Action"、"Modal"、"Message"
   * @param {Object} logger - 日志对象，需实现 e() 和 w() 方法
   */
  constructor(name, logger) {
    const item = uiConfig.FormTypes?.[name]
    if (!item)
      throw new TypeError(`Invalid form type: "${name}". Allowed: ${uiConfig.FormTypeArr.join(", ")}`);
    this.form = new item; // 实例化表单类
    this.formType = name;
    this.logger = logger;
    this.layoutGroup = uiConfig.LayoutTypes[name]; // 如 { button: { source: 'button', param: [...] } }
  }

  /**
   * 设置表单标题
   * @param {string} newValue - 标题文本
   */
  set title(newValue) {
    if (typeof newValue !== "string") {
      throw new TypeError('Title must be a string.');
    }
    this.form.title(newValue); // 所有表单类都有 .title(string) 方法，文档写的很清楚
  }
  /**
   * 动态添加一个表单布局组件（如按钮、文本等）
   * @param {Object} opt - 配置项
   * @param {string} opt.type - 布局类型，如 "button"
   * @param {Array<any>} opt.param - 对应该布局的参数列表
   */
  addLayout(opt) {
    const {
      type,
      param
    } = opt;

    const layout = this.layoutGroup?.[type];
    if (!layout) {
      throw new TypeError(`Unknown layout type: "${type}".`);
    }

    const layoutRun = this.form[layout.source].bind(this.form);
    if (typeof layoutRun !== "function") {
      this.logger?.e?.(`Layout source "${layout.source}" is not a function.`);
      return;
    }

    if (!layout.param) {
      layoutRun(); // 无参数，直接调用
      return;
    }
    const args = [];
    for (let i = 0; i < layout.param.length; i++) {
      const paramName = layout.param[i]; // 如 "text"
      if (typeof paramName !== "string") {
        this.logger?.w?.(`Layout param name must be string, got ${typeof paramName} at index ${i}.`);
        continue;
      }
      const fieldDef = uiConfig.classic[paramName];
      const value = param[i];
      if (!this.#matchCondition(fieldDef, value)) {
        // 在达到最小参数数时直接退出
        if (i >= layout.minPar) continue;
        this.logger?.w?.(`Param "${paramName}" failed validation.`);
        continue;
      }
      args.push(value);
    }
    try {
      layoutRun(...args); // 调用表单方法并传入校验后的参数
    } catch (err) {
      this.logger?.e?.(`Failed to add layout "${type}": ${err}`);
    }
  }

  /**
   * 校验参数是否符合定义的类型和约束
   * @private
   * @param {Object} source - 字段定义，如 { type: "string", regex?: RegExp, count?: [min: number, max: number], ObjectType?: any }
   * @param {any} msg - 待校验的值
   * @returns {boolean}
   */
  #matchCondition(source, msg) {
    if (!source) return false;
    if (typeof msg !== source.type) return false;
    if (typeof source.regexFunc === "function" &&
      /* 这里，应该验证函数返回false再拒绝*/
      !source.regexFunc(msg)) return false
    switch (source.type) {
      case "string":
        if (source.regex && !source.regex.test(msg)) return false;
        break;
      case "object":
        if (source.ObjectType && !utils.typeVerify(msg, source.ObjectType)) return false;
        break;
      case "number":
        if (
          source.count &&
          (msg < source.count[0] || msg > source.count[1])
        ) {
          return false;
        }
        break;
    }

    return true;
  }

  /**
   * 显示表单给玩家
   * @param {@minecraft/server.Player} player - Minecraft 玩家对象
   * @param {boolean = false} UseBeta - 使用新版 UI 库特性吗，兼容旧版
   */
  show(player, UseBeta = false) {
    return UseBeta ? new show(this.form, player) : this.form.show(player);
  }
}

/**
 * 工厂函数：快速创建 UI 表单实例并初始化标题与布局
 * @param {Object} logger - 日志对象
 * @param {string} name - 表单类型，如 "Action"
 * @param {Object} opt - 配置，含 title 和 layout 数组
 * @returns {UI} 表单实例
 */
export const createForm = (logger, name, opt) => {
  let r_opt = opt;
  if (typeof opt === "symbol" && regs.has(opt)) r_opt = regs.get(opt)

  function _createForm(name, opt) {
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
  return _createForm(name, r_opt)
};

export const regLayout = (layout) => {
  if (Array.isArray(layout.regIds)) {
    for (let item of layout.regIds) {
      if (typeof item === "string" && layout[item] !== void 0) {
        regs.set(Symbol(item), layout[item])
      }
    }
  }
  return Array.from(regs.keys())
}