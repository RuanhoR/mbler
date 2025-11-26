import {
  EntityComponentTypes,
  EquipmentSlot
} from "@minecraft/server"

export class utils {
  static getAllPlayerInt(player) {
    const data = new Map();
    const inventory = player
      .getComponent("inventory")
      .container;
    for (let i = 0; i < inventory.size; i++) {
      const item = inventory.getItem(i);
      if (!item) continue;
      let num = item.amount;
      // 自动合并
      const it = data.get(item.typeId);
      if (Array.isArray(it)) num += it[1]
      data.set(item.typeId, [item.typeId, num]);
    }
    return data;
  }
  static setMainHand(player, item) {
    const Equippable = player
      .getComponent(EntityComponentTypes.Equippable);
    Equippable
      .setEquipment(EquipmentSlot.Mainhand, item);
  }
  static removeItems(player, {
    name,
    count
  } = {}) {
    const inventory = player
      .getComponent("inventory")
      .container;
    let RemoveNum = count;
    for (let i = 0; i < inventory.size; i++) {
      const item = inventory.getItem(i);
      if (!item || !item.typeId || item.typeId !== name) continue;
      const num = item.amount;
      if (RemoveNum >= num) {
        inventory.setItem(i, null);
        RemoveNum -= num;
      } else {
        const remNum = RemoveNum >= 64 ? 64 : Math.max(RemoveNum, item.amount) - Math.min(RemoveNum, item.amount)
        item.amount = remNum;
        RemoveNum -= remNum
      }
    }
  }
}