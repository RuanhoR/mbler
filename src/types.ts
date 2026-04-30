import { Plugin } from "rollup"

export const LanguageNames = ['zh', 'en']
export const cmdList = ['c', 'work', 'help', 'h', 'init', 'version', 'build', 'watch', 'lang', 'set-work-dir', 'publish', 'unpublish', 'install', 'uninstall', 'login', 'profile', 'view', 'config'] as const
type HelpCommand = (typeof cmdList)[number]
export interface language {
  description: string
  help: {
    cmds: readonly string[]
  } & {
    [K in HelpCommand]: string
  }
  default: {
    unexpected: string
    youis: string
  }
  workdir: {
    set: string
    nfound: string
    disabled: string
    enabled: string
    invalidParam: string
  }
  init: {
    initDes: string
    name: string
    description: string
    useGIT: string
    useUI: string
    lang: string
    betaApi: string
    mcVersion: string
    noName: string
    noMCVersion: string
    noLanguare: string
    welcome: string
  },
  publish: {
    askTip: string
    notLoggedIn: string
    progress: string
    publishFailed: string
    publishing: string
    building: string
    publishToMarket: string
    publishSuccess: string
    publishResult: string
    projectPathNotExist: string
    outdirNotFound: string
    outdirNotExist: string
    readmeNotFound: string
    metadataInvalid: string
    packageNameInvalid: string
    notLoginError: string
    tokenMissing: string
    unpublishReqFailed: string
    createSessionFailed: string
    uploadZipFailed: string
    packageJsonNotFound: string
    noBuildScript: string
    buildFailed: string
  }
  install: {
    failedNoPackageJson: string
    failedNoBuildScript: string
    installing: string
    packageNotFound: string
    noVersion: string
    usingLatest: string
    noValidAddon: string
    success: string
    failed: string
  }
  uninstall: {
    success: string
    failed: string
  }
  unpublish: {
    success: string
    failed: string
  }
  view: {
    usage: string
    packageNotFound: string
    title: string
    versionLine: string
    failed: string
  }
  config: {
    usage: string
    missingArg: string
    getResult: string
    setSuccess: string
    pointGet: string
    pointSetSuccess: string
    pointSetFailed: string
    failed: string
  }
}
export interface MblerConfigScript {
  ui?: boolean // use minecraft module "@minecraft/server-ui"
  lang?: 'ts' | 'mcx' | 'js' // languare
  main: string // main file point(start <project>/behavior), be like: index.js
  UseBeta?: boolean // use beta minecraft api
}
export interface MblerConfigOutdir {
  behavior?: string // behavior output dir, default: ./dist/dep
  resources?: string // resources output dir, default: ./dist/res
  dist: string // build use "-dist" option to build to a mcaddon file.
}
export interface MblerBuildConfig {
  rollupPlugins: Plugin[];
  cache: "none" | "memory" | "file" | "filesystem" | "auto";
  bundle: boolean;
  onEnd: (ctx: MblerConfigData) => void | Promise<void>;
  onStart: (ctx: MblerConfigData) => void | Promise<void>;
  onWarn: (ctx: MblerConfigData, warning: Error) => void | Promise<void>;
}
export interface MblerConfigData {
  name: string // addon name
  outdir?: MblerConfigOutdir // output
  description: string // addon description
  version: string // version, like be "0.0.1-beta"
  mcVersion: string | string[] // use mcVersion, be like "1.21.100"
  script?: MblerConfigScript // sapi option
  minify?: boolean // use minify
  build?: Partial<MblerBuildConfig> // build config
}
export const templateMblerConfig: MblerConfigData = {
  name: 'demo',
  description: 'demo',
  version: '0.0.0',
  mcVersion: '1.21.100',
  script: {
    main: '',
  },
  minify: false,
  outdir: {
    behavior: '',
    resources: '',
    dist: '',
  },
  build: {
    rollupPlugins: [],
    cache: "auto",
    bundle: true,
    onEnd: () => { },
    onStart: () => { },
    onWarn: () => { }
  }
}
export interface CliParam {
  params: string[]
  opts: Record<string, string>
}
export interface ManifestData {
  format_version: number
  header: {
    name: string
    description: string
    uuid: string
    version: number[]
    min_engine_version: number[]
  }
  modules: Array<{
    type: 'script' | 'data' | 'resources'
    uuid: string
    description?: string
    version: number[]
    language?: string
    entry?: string
  }>
  dependencies?: Array<{
    module_name: string
    version: string
  }>
  subpack?: Array<{
    folder_name: string
    name: string
    memory_tier: number
  }>
  capabilities?: string[]
}
export interface npmFetchData {
  name: string
  'dist-tags': Record<string, string>
  versions: Record<
    string,
    {
      maintainers: {
        name: string
        mail: string
      }[]
      dist: {
        shasum: string
        tarball: string
      }
      author: {
        name: string
        mail: string
      }
      license: string
      version: string
    }
  >
  readme: string
  keywords: string[]
  homepage: string
  time: Record<string, string>
}
export interface PMNXProfile {
  mail: string;
  name: string;
  uid: number;
  avatar_url?: string;
  ctime: string
}

export interface PublishMetadata {
  readme: string;
  scope: string;
  name: string;
  version: string;
  version_tag: string;
}
export interface MNXPackageInfoResult {
  id: string;
  readmeTable: [number, string][];
  versions: {
    download_url: string,
    version_tag: string;
    name: string;
    create_user: PMNXProfile;
    readme: number;
    create_time: string; // ISO Date string
  }[];
  download: number; /**下载量 */
}
export interface BaseResult {
  code: 200 | -1,
  message: string;
  success: boolean;
}
export interface MNXPackageVersionInfoResult {
  id: string;
  versions: {
    download_url: string,
    version_tag: string;
    name: string;
    create_user: PMNXProfile;
    readme: string;
    create_time: string; // ISO Date string
  }
}
