import {
  EntityComponentTypes,
  EquipmentSlot,
  Player,
  ItemStack,
  Container
} from "@minecraft/server";

interface RemoveItemsOptions {
  name: string;
  count: number;
}

export class utils {
  static getAllPlayerInt(player: Player): Map<string, [string, number]> {
    const data = new Map<string, [string, number]>();
    const inventory = player
      .getComponent("inventory" as any)?.container as Container;
    if (!inventory) return data;

    for (let i = 0; i < inventory.size; i++) {
      const item = inventory.getItem(i);
      if (!item) continue;
      let num = item.amount;
      // 自动合并
      const existingItem = data.get(item.typeId);
      if (existingItem) num += existingItem[1];
      data.set(item.typeId, [item.typeId, num]);
    }
    return data;
  }

  static setMainHand(player: Player, item: ItemStack): void {
    const Equippable = player
      .getComponent(EntityComponentTypes.Equippable);
    if (Equippable) {
      Equippable
        .setEquipment(EquipmentSlot.Mainhand, item);
    }
  }

  static removeItems(player: Player, { name, count }: RemoveItemsOptions = { name: "", count: 0 }): void {
    const inventory = player
      .getComponent("inventory" as any)?.container as Container;
    if (!inventory) return;

    let RemoveNum = count;
    for (let i = 0; i < inventory.size; i++) {
      const item = inventory.getItem(i);
      if (!item || !item.typeId || item.typeId !== name) continue;
      const num = item.amount;
      if (RemoveNum >= num) {
        inventory.setItem(i, undefined);
        RemoveNum -= num;
      } else {
        const remNum = RemoveNum >= 64 ? 64 : Math.max(RemoveNum, item.amount) - Math.min(RemoveNum, item.amount);
        item.amount = remNum;
        RemoveNum -= remNum;
        inventory.setItem(i, item);
      }
    }
  }
}

export default utils;