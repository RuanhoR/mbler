declare module './index.js' {
  interface LangInit {
    name: string;
    desc: string;
    useMcVersion: string;
    useSapi: string;
    useTs: string;
    InputFormatErr: string;
    main: string;
    useUi: string;
    ReInput: string;
  }

  interface LangDev {
    start: string;
    start_d: string;
    tip: string;
  }

  interface LangType {
    // Basic strings
    invalidConfig: string;
    inited: string;
    workPackV: string;
    invalidDes: string;
    config_invalid: string;
    err_bulid: string;
    
    // Nested objects
    init?: LangInit;
    dev?: LangDev;
    
    // Other properties
    [key: string]: any;
  }

  const lang: LangType;
  export default lang;
}
