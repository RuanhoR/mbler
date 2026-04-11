import {
  ActionFormData,
  ModalFormData,
  MessageFormData
} from "@minecraft/server-ui";

interface UIConfig {
  classic: Record<string, FieldConfig>;
  FormTypes: Record<string, any>;
  FormTypeArr: string[];
  LayoutTypes: Record<string, Record<string, LayoutConfig>>;
}

interface FieldConfig {
  type: string;
  regex?: RegExp;
  regexFunc?: (msg: any) => boolean;
  ObjectType?: Record<string, string>;
}

interface LayoutConfig {
  source: string;
  param: string[];
  minPar?: number;
}

const uiLayoutTypes = (): Record<string, Record<string, LayoutConfig>> => {
  const button: LayoutConfig = {
    source: "button",
    param: ["text", "iconPath"],
    minPar: 0
  };
  const label: LayoutConfig = {
    source: 'label',
    param: ["text"]
  };
  const body: LayoutConfig = {
    source: "body",
    param: ["text"]
  };
  const divider: LayoutConfig = {
    source: "divider",
    param: []
  };
  const header: LayoutConfig = {
    source: "header",
    param: []
  };
  const input: LayoutConfig = {
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
  };
  const drop: LayoutConfig = {
    source: "dropdown",
    param: ["text", "Arr-item"],
    minPar: 0
  };
  
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
  };
};

const config = {
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
        regexFunc(msg: any) {
          return Array.isArray(msg);
        }
      }
    } as Record<string, FieldConfig>,
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
  } as UIConfig
};

export default config;