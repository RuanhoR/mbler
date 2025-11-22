import {
  ActionFormData,
  ModalFormData,
  MessageFormData
} from "@minecraft/server-ui"
const button = {
  source: "button",
  param: ["text", "iconPath"]
}
const label = {
  source: 'label',
  param: ["text"]
}
export default {
  ui: {
    classic: {
      iconPath: {
        type: "string",
        regex: /^textures\/([a-zA-Z]:\\|\\\\|\/|\.\/|\.\.\/)?([\w\-\. ]+([\\/][\w\-\. ]+)*)$/
      },
      text: {
        type: "string"
      }
    },
    FormTypes: {
      Action: ActionFormData,
      Modal: ModalFormData,
      Message: MessageFormData
    },
    // 这里当上面这个 FormTypes 的键集合方便比较
    FormTypeArr: [
      "Action", "Modal", "Message"
    ],
    LayoutTypes: {
      Action: {
        button,
        label,
      },
      Modal: {

      },
      Message: {

      }
    }
  }
}