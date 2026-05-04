import { Container, EntityComponentTypes, EquipmentSlot, ItemStack, Player, world } from '@minecraft/server';
import { GameLib } from './gameLib'
interface LayoutConfig {
  title: string;
  layout: Array<{
    type: string;
    param?: any[];
  }>;
}

interface Layouts {
  [key: number]: LayoutConfig;
}

interface SelectionParams {
  min?: number;
  max?: number;
  tit?: string;
  callback?: (data: any) => void;
  lastUi?: () => void;
}

class Lore {
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
class baseUi {
  game: GameLib;

  constructor(game: GameLib) {
    this.game = game;
  }
}
export class ItemBagUI extends baseUi {
  private layouts?: Layouts;

  initLayout(): void {
    this.layouts = this.game.regLayout({
      regIds: ["Home", "NumSelect", "showInNoFound"],
      Home: {
        title: "菜单",
        layout: [{
          type: "button",
          param: ["存入物品"]
        },
        {
          type: "button",
          param: ["取出物品"]
        },
        ],
      },
      NumSelect: {
        title: "选择数量",
        layout: []
      },
      showInNoFound: {
        title: "请选择要存入的物品",
        layout: [{
          type: "label",
          param: ["点击你想要存放的物品"]
        }]
      }
    });
  }

  /**
   * 打开主菜单：存入物品 / 取出物品
   */
  openHomeForm(player: Player, itemOnHand: ItemStack): void {
    if (!this.layouts) this.initLayout();
    const lore = new Lore(itemOnHand);
    const form = this.game.createForm("Action", (this.layouts as Layouts)[0]);
    form.addLayout({
      type: "label",
      param: [`无尽袋子 - 菜单\n物品 : ${lore.name} , 数量 : ${lore.count}`]
    });

    (form.show(player, true) as any).onCommit(({ selection }: any) => {
      switch (selection) {
        case 0:
          this.openAddItemForm(player, itemOnHand);
          break;
        case 1:
          this.hanlerTakeOutItems(player, itemOnHand);
          break;
        default:
          player.sendMessage("请选择存入或取出");
      }
    });
  }

  hanlerTakeOutItems(player: Player, itemOnHand: ItemStack): void {
    const lore = new Lore(itemOnHand);
    if (!lore.name) return player.sendMessage('没有存入任何东西');
    this.selectionNum({
      min: 1,
      max: lore.count,
      tit: lore.name,
      callback: ({ formValues }: any) => {
        const TakeOutCount = formValues[0];
        player.runCommand(`give @s ${lore.name} ${TakeOutCount}`);
        lore.count = lore.count - TakeOutCount;
        itemOnHand.setLore(lore.parseArr());
        (utils as any).setMainHand(player, itemOnHand);
      },
      lastUi: () => this.openHomeForm(player, itemOnHand)
    }, player);
  }

  /**
   * 打开"存入物品"表单（自动识别物品类型）
   */
  openAddItemForm(player: Player, itemOnHand: ItemStack): void {
    const currencyLore = new Lore(itemOnHand);
    // 如果 Lore 无法识别此物品（比如没有 name 字段），则进入手动选择模式
    if (currencyLore.name === undefined) {
      return this.showInNoData(player, currencyLore, itemOnHand);
    }
    const inventoryData = (utils as any).getAllPlayerInt(player);
    let totalItemAmount = 0;
    // 统计当前玩家拥有该物品的总数量
    for (const [itemId, itemData] of inventoryData) {
      const [itemName, itemCount] = itemData;
      if (itemName === currencyLore.name) {
        totalItemAmount += itemCount;
      }
    }
    // 如果该物品数量为 0，则提示无法存入
    if (totalItemAmount <= 0) {
      return player.sendMessage("你没有该物品，无法存入！");
    }
    // 弹出滑条，让用户选择存入多少个
    this.selectionNum({
      min: 0,
      max: totalItemAmount,
      tit: currencyLore.name,
      callback: ({ formValues }: any) => {
        const countToStore = formValues[0];
        currencyLore.count = countToStore + totalItemAmount;
        this.handlerAdd(currencyLore, player, itemOnHand, countToStore);
      },
      lastUi: () => this.openHomeForm(player, itemOnHand),
    },
      player
    );
  }

  /**
   * 当物品无法自动识别时，让用户从列表中手动选择要存入的物品
   */
  showInNoData(player: Player, placeholderLore: Lore, itemOnHand: ItemStack): void {
    const form = this.game.createForm("Action", this.layouts![2]);
    const inventoryData = (utils as any).getAllPlayerInt(player);
    const itemKeys: string[] = [];
    let buttonIndex = 0;

    for (const [itemId, itemData] of inventoryData) {
      if (!Array.isArray(itemData)) continue;
      const [itemName, itemCount] = itemData;
      form.addLayout({
        type: "button",
        param: [`${itemName} x${itemCount}`],
      });
      itemKeys[buttonIndex] = itemId;
      buttonIndex++;
    }

    form.show(player).then(({ selection, canceled }: any) => {
      if (canceled) {
        return this.openHomeForm(player, itemOnHand);
      }
      if (selection === undefined || selection >= itemKeys.length) {
        return player.sendMessage("你选择的物品无效");
      }
      const selectedItemId = itemKeys[selection];
      const selectedItemData = inventoryData.get(selectedItemId);
      if (!selectedItemData || !Array.isArray(selectedItemData)) {
        return player.sendMessage("该物品数据异常");
      }
      const [selectedItemName, selectedItemCount] = selectedItemData;
      this.selectionNum({
        tit: `存入 ${selectedItemName}`,
        min: 0,
        max: selectedItemCount,
        callback: ({ formValues }: any) => {
          const countToStore = formValues[0];
          const manualLore = new Lore(itemOnHand);
          manualLore.name = selectedItemName;
          manualLore.count = countToStore + selectedItemCount;
          this.handlerAdd(manualLore, player, itemOnHand, countToStore);
        },
        lastUi: () => this.openHomeForm(player, itemOnHand),
      },
        player
      );
    });
  }

  handlerAdd(lore: Lore, player: Player, originalItem: ItemStack, countToStore: number): void {
    (utils as any).removeItems(player, {
      name: lore.name,
      count: countToStore,
    });
    originalItem.setLore(lore.parseArr());
    (utils as any).setMainHand(player, originalItem);
    player.sendMessage(`成功存入 ${countToStore} 个「${lore.name}」`);
  }

  selectionNum(params: SelectionParams = {}, player: Player): void {
    const { min = 0, max = 1, tit = "", callback = () => { }, lastUi = () => { } } = params;

    const form = this.game.createForm("Modal", this.layouts![1]);
    form.addLayout({
      type: "slider",
      param: [tit, min, max]
    });

    const show = form.show(player, true);
    (show as any).onCancel(lastUi);
    (show as any).onCommit(callback);
  }
}


let scriptUi: ItemBagUI;
interface UseItemEvent {
  source: Player;
  itemStack: ItemStack;
}

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
const useItem = ({ source: player, itemStack: item }: UseItemEvent) => {
  if (!player.typeId.includes('player')) return;
  if (item.typeId === "mbler_int:mang_one_int") {
    scriptUi.openHomeForm(player, item);
  }
};

export const regEvent = (game: GameLib) => {
  world.afterEvents.itemUse.subscribe(useItem);
  scriptUi = new ItemBagUI(game);
};
const game = new GameLib(true)
regEvent(game)
