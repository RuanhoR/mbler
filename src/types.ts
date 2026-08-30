import { Plugin } from 'rolldown'

export const LanguageNames = ['zh', 'en']
export const cmdList = [
  'c',
  'work',
  'help',
  'h',
  'init',
  'version',
  'build',
  'watch',
  'lang',
  'set-work-dir',
  'publish',
  'unpublish',
  'install',
  'uninstall',
  'login',
  'profile',
  'log',
  'view',
  'config',
  'cache',
  'sync-mc-dep',
] as const
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
  }
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
    nameMismatch: string
    notLoginError: string
    tokenMissing: string
    unpublishReqFailed: string
    createSessionFailed: string
    uploadZipFailed: string
    packageJsonNotFound: string
    noBuildScript: string
    buildFailed: string
    tagDescription: string
    buildDescription: string
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
  profile: {
    user: string
    uid: string
    mail: string
    created: string
    avatarUrl: string
    failed: string
  }
  build: {
    noBuildModuleRelease: string
  }
  commander: {
    selectTip: string
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
  rollupPlugins: Plugin[]
  rollupExternal: string[]
  cache: 'none' | 'memory' | 'file' | 'filesystem' | 'auto'
  cachePath: string
  bundle: boolean
  clean?: boolean
  /** extra manifest dependencies, e.g. { "@minecraft/server-admin": "1.0.0-beta" } */
  otherDeps?: Record<string, string>
  /** start a WebSocket server for in-game live reload */
  devWs?: boolean
  /** port for the dev WebSocket server (default 19145) */
  devWsPort?: number
  onEnd: (ctx: MblerConfigData) => void | Promise<void>
  onStart: (ctx: MblerConfigData) => void | Promise<void>
  onWarn: (ctx: MblerConfigData, warning: Error) => void | Promise<void>
}
export interface MblerArchiveConfig {
  enabled?: boolean // generate archives on build
  autoGenerate?: boolean // generate archives during build
  exclude?: string[] // subdirectory glob patterns to skip (e.g. "textures/**")
  concurrency?: number // max directories archived in parallel
}
/** resource pack scope */
export enum MblerPackScope {
  /** any scope (default) */
  Any = 'any',
  /** world-specified resource pack */
  World = 'world',
  /** global resources */
  Global = 'global'
}
/** extra pack capabilities (format_version 2+) */
export enum MblerManifestCapability {
  /** Education Edition features */
  Chemistry = 'chemistry',
  /** Editor features, allows importing @minecraft/server-editor */
  EditorExtension = 'editorExtension',
  /** HTML UI, unavailable since 1.18.10.28 */
  ExperimentalCustomUI = 'experimental_custom_ui',
  /** Vibrant Visuals PBR features via MERS */
  Pbr = 'pbr',
  /** raytracing PBR features */
  Raytraced = 'raytraced',
  /** allow eval / new Function inside scripts */
  ScriptEval = 'script_eval'
}
/** addon setting control types */
export enum MblerManifestSettingType {
  Label = 'label',
  Input = 'input',
  Toggle = 'toggle',
  Slider = 'slider',
  Dropdown = 'dropdown'
}
/** package product type */
export enum MblerManifestProductType {
  /** part of an addon — behavior packs won't disable achievements */
  Addon = 'addon'
}
export interface MblerManifestSubpack {
  name: string // subpack display name
  folder_name: string // subpack folder name
  memory_tier: number // RAM tier (>= 0)
  memory_performance_tier?: number // optimal platform tier (0-5)
}
export type MblerManifestSetting =
  | { type: MblerManifestSettingType.Label; text?: string }
  | {
      type: MblerManifestSettingType.Input
      text?: string
      name: string
      default?: string
    }
  | {
      type: MblerManifestSettingType.Toggle
      text?: string
      name: string
      default?: boolean
    }
  | {
      type: MblerManifestSettingType.Slider
      text?: string
      name: string
      min?: number
      max?: number
      step?: number
      default?: number
    }
  | {
      type: MblerManifestSettingType.Dropdown
      text?: string
      name: string
      options?: Array<string | { text: string; name: string }>
      default?: string
    }
export interface MblerManifestMetadata {
  authors?: string[] // package authors
  license?: string // package license
  url?: string // package url
  product_type?: MblerManifestProductType // product type
}
export type MblerManifestDependency =
  | {
      uuid: string // dependency pack uuid
      version: string | number[] // dependency pack version
      name?: string // dependency pack name
      module_name?: undefined
    }
  | {
      module_name?: string // script module name
      uuid?: string // script module uuid
      version: string // script module version, "beta" supported since 1.21.120
    }
export interface MblerManifestConfig {
  /** resource pack scope */
  pack_scope?: MblerPackScope
  /** forbid using this pack in other players' worlds or servers */
  platform_locked?: boolean
  /** world template base game version */
  base_game_version?: string
  /** world template uses random seed */
  allow_random_seed?: boolean
  /** world template forbids changing world options by default */
  lock_template_options?: boolean
  /** extra capabilities, merged with the auto MblerManifestCapability.ScriptEval */
  capabilities?: MblerManifestCapability[]
  /** extra dependencies (pack uuid form or script module form), appended after sapi deps */
  dependencies?: MblerManifestDependency[]
  /** available subpacks */
  subpacks?: MblerManifestSubpack[]
  /** addon settings shown in game */
  settings?: MblerManifestSetting[]
  /** package metadata, generated_with is auto-filled with the mbler version */
  metadata?: MblerManifestMetadata
}
export interface MblerConfigData {
  name?: string // addon name (package scope, e.g. "@scope/name"), fallback to package.json
  displayName?: string // display name shown in manifest (falls back to name)
  outdir?: MblerConfigOutdir // output
  outGameOnDev?: boolean // output directly to game development packs
  description: string // addon description
  version?: string // version, like be "0.0.1-beta", fallback to package.json
  mcVersion: string // use mcVersion, be like "1.21.100"
  script?: MblerConfigScript // sapi option
  minify?: 'oxc' | 'terser' | 'esbuild' | 'none' // use minify, "none" = disable minify
  manifest?: MblerManifestConfig // full manifest.json customization
  archive?: MblerArchiveConfig // brarchive packaging config
  build?: Partial<MblerBuildConfig> // build config
}
export const templateMblerConfig: MblerConfigData = {
  name: '',
  displayName: '',
  description: 'demo',
  version: '',
  mcVersion: '1.21.100',
  minify: 'oxc',
  script: {
    main: '',
  },
  outdir: {
    behavior: 'dist/dep',
    resources: 'dist/res',
    dist: 'dist-pkg',
  },
  outGameOnDev: false,
  archive: {
    enabled: false,
    autoGenerate: true,
    exclude: [],
    concurrency: 16,
  },
  build: {
    rollupPlugins: [],
    cache: 'auto',
    bundle: true,
    onEnd: () => {},
    onStart: () => {},
    onWarn: () => {},
  },
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
    version: number[] | string
    min_engine_version?: number[] | string
    pack_scope?: 'any' | 'world' | 'global'
    platform_locked?: boolean
    base_game_version?: number[] | string
    allow_random_seed?: boolean
    lock_template_options?: boolean
  }
  modules: Array<{
    type:
      | 'script'
      | 'data'
      | 'resources'
      | 'world_template'
      | 'skin_pack'
      | 'persona_piece'
    uuid: string
    description?: string
    version: number[] | string
    language?: string
    entry?: string
  }>
  dependencies?: Array<MblerManifestDependency>
  capabilities?: string[]
  subpacks?: MblerManifestSubpack[]
  settings?: MblerManifestSetting[]
  metadata?: MblerManifestMetadata & {
    generated_with?: Record<string, Array<number[] | string>>
  }
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
  mail: string
  name: string
  uid: number
  avatar_url?: string
  ctime: string
}

export interface PublishMetadata {
  readme: string
  scope: string
  name: string
  version: string
  version_tag: string
}
export interface MNXPackageInfoResult {
  id: string
  readmeTable: [number, string][]
  versions: {
    download_url: string
    version_tag: string
    name: string
    create_user: PMNXProfile
    readme: number
    create_time: string // ISO Date string
  }[]
  download: number /**下载量 */
}
export interface BaseResult {
  code: 200 | -1
  message: string
  success: boolean
}
export interface MNXPackageVersionInfoResult {
  id: string
  versions: {
    download_url: string
    version_tag: string
    name: string
    create_user: PMNXProfile
    readme: string
    create_time: string // ISO Date string
  }
}
