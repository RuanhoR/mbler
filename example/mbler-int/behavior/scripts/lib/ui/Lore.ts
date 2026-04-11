import { ItemStack } from "@minecraft/server";

export class Lore {
  name?: string;
  count: number;

  constructor(item: ItemStack) {
    const LoreArr = item.getLore() as string[];
    let count = parseInt(`0x${LoreArr[1]}`, 16); // 加上16进制表明式
    if (!/^[a-z0-9_]+(\:)?[a-z0-9_]+$/.test(LoreArr[0] + ''))
      LoreArr[0] = undefined as any;
    if (isNaN(count)) count = 0;
    this.count = count;
    this.name = LoreArr[0] as string;
  }

  parseArr(): string[] {
    return [
      this.name || "",
      this.count.toString(16)
    ]
  }
}

export default Lore;