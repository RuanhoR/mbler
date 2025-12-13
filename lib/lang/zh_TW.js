const cmdList = ["dev", "build", "init", "version", "-v", "web_edit", "clean", "checkout", "-c", "-i", "v", "create", "recache", "lang"];

module.exports = {
  help: `MBLER
Minecraft Bedrock Edition
Addon Bulider In Nodejs
在基岩版我的世界上的 nodejs 建構工具
解決到處查文件配置 api 版本的難題
用法： node index.js [command]
* 也可以 npm link 連結後省略 node 前綴
命令 : ${cmdList.join(", ")}

幫助命令 : 
  help
    顯示幫助資訊
    第二個參數為要查詢的命令名稱或留空
    別名： -h, -help`,
  
  config_invalid: "非 GameLib 專案",
  err_bulid: "建構錯誤",
  uncommand: "無效的命令",
  s0: "操作成功",
  noGit: '\n偵測到 Git 安全限制\nGit 拒絕操作，因為該目錄可能不屬於目前使用者或位於系統保護路徑。\n請選擇處理方式：\n\n1 : 僅將目前目錄加入可信區（推薦，安全）\n2 : 全域信任所有目錄（不推薦，但方便）\n3 : 取消操作',
  SameDes: "同名依賴",
  invalidConfig: "無效的配置",
  inited: "已經初始化過了",
  noGitRepo: '沒有指定索取的 git 倉庫，安裝失敗',
  invalidDes: '無效的依賴',
  workPackV: "目前工作目錄套件版本：",
  init: {
    name: "專案名稱 : ",
    desc: "專案描述 : ",
    useMcVersion: "支援的 minecraft 版本 : ",
    useSapi: "使用 Script Api 嗎？(Y/N) ",
    useTs: "使用 TypeScript 嗎？(Y/N) ",
    InputFormatErr: "不是正確的 x.x.x 格式版本號，請重新輸入\n  ",
    main: "主腳本路徑，不包含 js 後綴(預設 index) : ",
    useUi: "使用 UI 嗎？(Y/N) ",
    ReInput: '不符合規範 重試：\n  '
  },
  dev: {
    start: "開始即時監聽建構，以下為第一次建構",
    start_d: "開始增量建構",
    tip: "偵測到變更 : "
  },
  installGit: {
    NoPackage: `此 GIT 倉庫未包含正確的 mbler 配置`,
    InstallFinally: '安裝完成',
    HadBeen: '已有相同套件名稱的依賴包，是否取代？ Y/N',
    SetContent: '正在修改索引表'
  },
  vm: {
    shouldNotImp: "禁止匯入模組，因為該模組可能用於不安全行為",
    runScriptErr: "執行腳本出錯，錯誤棧 "
  },
  commands: {
    list: cmdList,
    dev: "mbler dev \n監聽檔案，在修改時重新打包",
    build: "mbler build \n打包專案，將 mbler 專案打包為標準 mcbe 行為包，詳見文件",
    init: `mbler init \n初始化路徑的配置檔案，以命令列互動式建立，別名： -i`,
    version: "mbler version [null | x.x.x] \n查看或設定目前工作目錄的套件版本",
    "-c": "$checkout",
    "-i": "$init",
    "-v": "$v",
    v: "mbler [v/-v] \n查看 mbler 工具本身的版本",
    checkout: "mbler [checkout/-c] [null | PATH]\n查看(當第二個參數為 null 時)或切換工作目錄",
    "web_edit": "mbler web_edit \n啟動本地 HTTP 工作目錄的文字編輯器，開發中不建議使用",
    create: "mbler create [npm 套件名稱 | git 網址 | 路徑]\n從指定來源下載後(有快取)進行在沙盒 vm 內的建立模板包，類似 npm create",
    recache: "mbler recache \n重置快取",
    lang: "mbler lang [語言名稱] \n設定語言，例如 mbler lang zh_TW\n目前支援的語言有 \n 1. zh_CN \n 2. en_US \n 3. zh_TW"
  }
};
