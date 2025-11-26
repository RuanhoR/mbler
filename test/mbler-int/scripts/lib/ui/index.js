import {
  baseUi
} from "./baseUi";
import {
  utils
} from "./../utils/index";
import {
  Lore
} from "./Lore";
class ItemBagUI extends baseUi {
  /**
   * 打开主菜单：存入物品 / 取出物品
   */
  openHomeForm(player, itemOnHand) {
    const form = this.game.createForm("Action", {
      title: "菜单",
      layout: [{
          type: "label",
          param: ["无尽袋子 - 菜单"]
        },
        {
          type: "button",
          param: ["存入物品"]
        },
        {
          type: "button",
          param: ["取出物品"]
        },
      ],
    });

    form.show(player).then(({
      selection,
      canceled
    }) => {
      if (canceled) return;
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
  hanlerTakeOutItems(player, itemOnHand) {
    const lore = new Lore(itemOnHand)
    if (!lore.name) return player.sendMessage('没有存入任何东西');
    this.selectionNum({
      min: 1,
      max: lore.count,
      callback: ({
        formValues
      }) => {
        const TakeOutCount = formValues[0];
        player.rumCommand(`give @s ${lore.name} ${TakeOutCount}`)
        lore.count = lore.count - TakeOutCount;
        itemOnHand.setLore(lore.parseArr())
        utils.setMainHand(player, itemOnHand);
      },
      lastUi: () => this.openHomeForm(player, itemInHand)
    }, player)
  }
  /**
   * 打开“存入物品”表单（自动识别物品类型）
   */
  openAddItemForm(player, itemOnHand) {
    const currencyLore = new Lore(itemOnHand);
    // 如果 Lore 无法识别此物品（比如没有 name 字段），则进入手动选择模式
    if (currencyLore.name === undefined) {
      return this.showInNoData(player, currencyLore, itemOnHand);
    }
    const inventoryData = utils.getAllPlayerInt(player);
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
        callback: ({
          formValues
        }) => {
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
  showInNoData(player, placeholderLore, itemOnHand) {
    const form = this.game.createForm("Action", {
      title: "请选择要存入的物品",
      layout: [{
        type: "label",
        param: ["点击你想要存放的物品"]
      }],
    });
    const inventoryData = utils.getAllPlayerInt(player);
    const itemButtons = [];
    const itemKeys = [];
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
    form.show(player).then(({
      selection,
      canceled
    }) => {
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
          callback: ({
            formValues
          }) => {
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
  handlerAdd(lore, player, originalItem, countToStore) {
    utils.removeItems(player, {
      name: lore.name,
      count: countToStore,
    });
    originalItem.setLore(lore.parseArr())
    utils.setMainHand(player, originalItem);
    player.sendMessage(`成功存入 ${countToStore} 个「${lore.name}」`);
  }
  selectionNum({
      min = 0,
      max = 1,
      tit = "",
      callback = () => {},
      lastUi = () => {},
    } = {},
    player
  ) {
    this.game
      .createForm("Modal", {
        title: "选择数量",
        layout: [{
          type: "slider",
          param: [tit, min, max]
        }],
      })
      .show(player)
      .then((response) => {
        if (response.canceled) {
          return lastUi();
        }
        callback(response);
      });
  }
}

export default ItemBagUI;