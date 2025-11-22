import config from "./config.js";
const uiConfig = config.ui; // { FormType, FormTypeArr, LayoutTypes, classic }

import { utils } from "./utils";

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
    if (!uiConfig.FormType[name]) {
      throw new TypeError(
        `Invalid form type: "${name}". Allowed: ${uiConfig.FormTypeArr.join(", ")}`
      );
    }

    this.form = new uiConfig.FormType[name]; // 实例化表单类
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
    this.form.title(newValue); // 假设所有表单类都有 .title(string) 方法
  }

  /**
   * 动态添加一个表单布局组件（如按钮、文本等）
   * @param {Object} opt - 配置项
   * @param {string} opt.type - 布局类型，如 "button"
   * @param {Array<any>} opt.param - 对应该布局的参数列表
   */
  addLayout(opt) {
    const { type, param } = opt;

    const layout = this.layoutGroup?.[type];
    if (!layout) {
      throw new TypeError(`Unknown layout type: "${type}".`);
    }

    const layoutRun = this.form[layout.source];
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
   * @param {Object} source - 字段定义，如 { type: "string", regex?: RegExp, count?: [number, number], ObjectType?: any }
   * @param {*} msg - 待校验的值
   * @returns {boolean}
   */
  #matchCondition(source, msg) {
    if (!source) return false;
    if (typeof msg !== source.type) return false;

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
      // 可扩展：boolean, array 等
    }

    return true;
  }

  /**
   * 显示表单给玩家
   * @param {Object} player - Minecraft 玩家对象
   */
  show(player) {
    this.form.show(player);
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
};
