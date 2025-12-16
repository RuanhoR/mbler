export class Lore {
  name;
  count;
  constructor(item) {
    const LoreArr = item.getLore();
    let count = parseInt(`0x${LoreArr[1]}`) // 加上16进制表明式
    if (!/^[a-z0-9_]+(\:)?[a-z0-9_]+$/.test(LoreArr[0] + ''))
      LoreArr[0] = undefined;
    if (isNaN(count)) count = 0;
    this.count = count;
    this.name = LoreArr[0];
  }
  parseArr() {
    return [
      this.name,
      this.count.toString(16)
    ]
  }
}