import {
  ActionFormData,
  ModalFormData,
  MessageFormData
} from "@minecraft/server-ui"
const uiLayoutTypes = () => {
  const button = {
    source: "button",
    param: ["text", "iconPath"],
    minPar: 0
  }
  const label = {
    source: 'label',
    param: ["text"]
  }
  const body = {
    source: "body",
    param: ["text"]
  }
  const divider = {
    source: "divider",
    param: []
  }
  const header = {
    source: "header",
    param: []
  }
  const input = {
    source: "textField",
    param: [
      /*tip text*/
      "text",
      /*placeholderText*/
      "text",
      // textField opt
      "textField opt"
    ],
    minPar: 0
  }
  const drop = {
    source: "dropdown",
    param: ["text", "Arr-item"],
    minPar: 0
  }
  return {
    Action: {
      body,
      divider,
      label,
      button,
      header
    },
    Modal: {
      body,
      divider,
      label,
      submit: {
        source: "submitButton",
        param: ["text"],
        minPar: 0
      },
      slider: {
        source: "slider",
        param: ["text", "num", "num", "SliderOptions"],
        minPar: 2
      },
      toggle: {
        source: "toggle",
        param: ["text", "ToggleOptions"],
        minPar: 0
      },
      header,
      input,
      drop
    },
    Message: {
      body,
      button1: button,
      button2: button
    }
  }
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
      },
      ToggleOptions: {
        type: "object",
        ObjectType: {
          tooltip: "string",
          defaultValue: "boolean"
        }
      },
      num: {
        type: "number"
      },
      SliderOptions: {
        type: `object`,
        ObjectType: {
          tooltip: "string",
          defaultValue: "number",
          valueStep: "number"
        }
      },
      "textField opt": {
        type: "object",
        ObjectType: {
          tooltip: "string",
          defaultValue: "string"
        }
      },
      "Arr-item": {
        type: "object",
        regexFunc(msg) {
          return Array.isArray(msg)
        }
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
    LayoutTypes: uiLayoutTypes()
  }
}