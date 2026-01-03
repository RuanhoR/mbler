const McxCommonent = require("./mcx/commonent");
const McxEvent = require("./mcx/event")
module.exports = [
  // 宏定义 : 
  {
    prototype: McxCommonent,
    property: "use",
    // 添加组件
    handler: (commonent) => commonent.use();
  },
  {
    prototype: McxEvent,
    property: "subscribe",
    // 事件注册，需修改ast
    handler: (event, ast) => {
      
    }
  }
]