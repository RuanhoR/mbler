export const LanguageNames = ['zh', 'en']
export const cmdList = ['c', 'work', 'help', 'h', 'init', 'version', 'build', 'watch', 'lang', 'set-work-dir'] as const
export interface language {
  description: string
  help: {
    [K in (typeof cmdList)[number] | 'cmds']: string | readonly string[]
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
export interface MblerConfigData {
  name: string // addon name
  outdir?: MblerConfigOutdir // output
  description: string // addon description
  version: string // version, like be "0.0.1-beta"
  mcVersion: string | string[] // use mcVersion, be like "1.21.100"
  script?: MblerConfigScript // sapi option
  minify?: boolean // use minify
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
