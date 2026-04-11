import {
  world,
  system,
  Entity as MinecraftEntity,
  Vector3,
  EffectType
} from "@minecraft/server";
import { utils, Vector3 as UtilsVector3 } from "./utils";
import { EntityDamageCause } from "./data";
import { Logger } from './loger';

// Type definitions
interface EntityData {
  [key: string]: any;
}

// 定义可被 Proxy 代理读写的实体属性（同步到原生实体）
const PROXIED_PROPERTIES: string[] = ["isSneaking", "nameTag"];

/**
 * Entity 类：对 Minecraft 原生实体对象的封装，
 * 提供安全的 API 操作、属性代理同步、参数校验等功能。
 */
export class Entity {
  private logger: Logger;
  private _source: MinecraftEntity;
  protected data: EntityData;

  constructor(logger: Logger, source: MinecraftEntity) {
    this.logger = logger; // 日志记录器，用于错误输出
    this._source = source; // 原生 Minecraft 实体对象

    if (!utils.isEntityObject(source)) {
      throw new TypeError("ERR_invalid_input: 传入的 source 不是有效的实体对象");
    }
    // 用于缓存部分同步数据
    this.data = {};
    // 初始化同步属性
    this._init();
    // 返回一个代理对象，拦截 get/set 操作
    const proxy = new Proxy(this, {
      set: (target: any, prop: string, value: any) => {
        if (PROXIED_PROPERTIES.includes(prop)) {
          // 只有在白名单中的属性才允许代理写入
          try {
            (target._source as any)[prop] = value; // 同步到原生实体
            target.data[prop] = value; // 同步到本地缓存
          } catch (err) {
            target.logger.e(`设置属性 "${prop}" 失败: ${err}`);
          }
        }
        return true;
      },
      get: (target: any, prop: string) => {
        if (PROXIED_PROPERTIES.includes(prop)) {
          // 优先从原生实体读取最新值（如 isSneaking, nameTag）
          try {
            return (target._source as any)[prop];
          } catch {
            // 如果失败，尝试从本地缓存返回
            return target.data[prop];
          }
        }

        // 优先从当前对象查找，否则从 data 缓存中返回
        return prop in target ? target[prop] : target.data[prop];
      }
    });

    return proxy as this;
  }

  /// ---- 基础方法：实体操作 ----

  /**
   * 摧毁实体（调用原生 kill() 方法）
   */
  kill(): void {
    this._checkClass();
    this._source.kill();
  }

  /**
   * 给实体添加状态效果（如中毒、速度等）
   * @param name - 效果 ID 或名称
   * @param duration - 持续时间 ticks
   * @param strength - 效果强度（0-255）
   * @param show - 是否显示粒子效果
   */
  addEffect(name: string | number, duration: number, strength?: number, show?: boolean): void {
    this._checkClass();

    if (typeof duration !== "number" || !utils.in(duration, 1, 20000000)) {
      throw new TypeError("ERR: 'duration' 必须是 1~20000000 的数字");
    }
    if (typeof name !== "number" && typeof name !== "string") {
      throw new TypeError("ERR: 'name' 必须是字符串或数字");
    }
    if (strength !== undefined) {
      if (typeof strength !== "number" || !utils.in(strength, 0, 255)) {
        throw new TypeError("ERR: 'strength' 必须是 0~255 的数字");
      }
    }
    if (typeof show !== "boolean") {
      throw new TypeError("ERR: 'show' 必须是布尔值");
    }
    const effect: string = utils.getEffect(name);
    const options: any = {};

    if (strength !== undefined) options.amplifier = strength;
    if (show !== undefined) options.showParticles = show;

    this._source.addEffect(effect, duration, options);
  }

  /**
   * 给实体添加标签
   * @param name - 标签名称
   */
  addTag(name: string): void {
    this._checkClass();
    this._checkTagName(name);
    this._source.addTag(name);
  }

  /**
   * 移除实体标签
   * @param name - 标签名称
   * @returns 是否移除成功
   */
  removeTag(name: string): boolean {
    this._checkClass();
    this._checkTagName(name);
    return this._source.removeTag(name);
  }

  /**
   * 移除实体身上的某个效果
   * @param name - 效果 ID 或名称
   */
  removeEffect(name: string | number): void {
    this._checkClass();
    this._source.removeEffect(utils.getEffect(name));
  }

  /// ---- 伤害相关方法 ----

  /**
   * 对实体造成伤害（来自某个实体）
   * @param hurt - 伤害值
   * @param cause - 伤害类型，参考 EntityDamageCause
   * @param source - 伤害来源实体
   */
  damage(hurt: number, cause: string, source: Entity): void {
    this._checkClass();
    if (!Object.keys(EntityDamageCause).includes(cause)) {
      throw new TypeError("ERR: 'cause' 必须是有效的伤害类型");
    }
    const damageSource = this._checkDamageParam(hurt, source);
    this._source.applyDamage(hurt, {
      damagingEntity: damageSource,
      cause: cause as any
    });
  }

  /**
   * 对实体造成伤害（来自投射物实体）
   * @param hurt - 伤害值
   * @param source - 伤害来源（通常是玩家）
   * @param projectile - 投射物实体（如箭矢）
   */
  damageByProjectile(hurt: number, source: Entity, projectile: Entity): void {
    this._checkClass();
    if (!(projectile instanceof Entity) || !projectile._source.isValid) {
      throw new TypeError("ERR: 投射物必须是一个有效的 Entity 实例");
    }
    const projSource = projectile._source;
    const damageSource = this._checkDamageParam(hurt, source);
    this._source.applyDamage(hurt, {
      damagingEntity: damageSource,
      damagingProjectile: projSource
    });
  }

  /// ---- 内部工具方法 ----

  /**
   * 检查当前封装的实体是否有效（未被销毁）
   */
  private _checkClass(): void {
    if (!this._source.isValid) {
      throw new Error("ERR: 该实体对象已无效（可能已被销毁）");
    }
  }

  /**
   * 检查伤害来源参数是否合法
   */
  private _checkDamageParam(hurt: number, source: Entity): MinecraftEntity {
    if (typeof hurt !== "number") {
      throw new TypeError("ERR: 伤害值 'hurt' 必须是数字");
    }
    if (!(source instanceof Entity)) {
      throw new TypeError("ERR: 伤害来源必须是一个 Entity 实例");
    }
    const dmgSource = source._source;
    if (!utils.isEntityObject(dmgSource)) {
      throw new TypeError("ERR: 传入的伤害来源不是有效的实体对象");
    }
    return dmgSource;
  }

  /**
   * 检查标签名称是否合法
   */
  private _checkTagName(name: string): void {
    if (typeof name !== "string" || !utils.in(name.length, 1, 250)) {
      throw new TypeError("ERR: 标签名称必须是 1~250 长度的字符串");
    }
  }

  /// ---- 属性同步初始化 ----

  /**
   * 初始化需要同步的实体属性（部分只读）
   */
  private _init(): void {
    // 同步属性
    // 实体id,string
    this._staticSet("id", "", true);
    // 同上
    this._staticSet("typeId", "", true);
    // 实体是否正在接触可攀爬的方块，比如玩家靠近梯子或蜘蛛靠近石墙的情况。
    this._staticSet("isClimbing", false, true);
    // 实体是否正在坠落（坠落距离大于 0），或在滑翔时坠落（坠落距离大于 1）。
    this._staticSet("isFalling", false, true);
    // 实体是否部分位于水中
    this._staticSet("isInWater", false, true);
    // 实体是否位于实心方块之上。
    this._staticSet("isOnGround", false, true);
    // 实体是否处于睡眠状态
    this._staticSet("isSleeping", false, true);
    // 是否处于潜行状态，可修改
    this._staticSet("isSneaking", false, false);
    // 是否处于奔跑状态，只读
    this._staticSet("isSprinting", false, true);
    // 本地化键
    this._staticSet("localizationKey", "", true);
    // 名称，可修改
    this._staticSet("nameTag", "", false);
    // 实体位置
    this._staticSet("location", new UtilsVector3(), true);
    // 积分板身份
    this._staticSet("scoreboardIdentity", null, true);
  }

  /**
   * 尝试从原生实体获取某个属性，出错时返回 null
   */
  private _static(name: string): any {
    try {
      return (this._source as any)?.[name] ?? null;
    } catch {
      return null;
    }
  }

  /**
   * 用于同步静态属性，内部方法
   * @param name - 名称
   * @param defaultValue - 默认值
   * @param isReadOnly - 是否只读
   */
  private _staticSet(name: string, defaultValue: any, isReadOnly: boolean): void {
    try {
      const value = this._static(name) ?? defaultValue;
      this.data[name] = value;
      if (isReadOnly) {
        Object.defineProperty(this.data, name, {
          writable: false
        });
      }
    } catch (err: any) {
      this.logger.e(err);
      this.data[name] = defaultValue;
    }
  }
}