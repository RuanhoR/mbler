import path from 'node:path'
import Sapi from '../build/sapi'
import { CliParam, MblerConfigData } from '../types'
import {
  FileExsit,
  input,
  isVaildVersion,
  runCommand,
  showText,
  writeJSON,
} from '../utils'
import { Input } from '../commander'
import { BuildConfig } from '../build/config'
import { cp, readdir } from 'node:fs/promises'
import exp from '../i18n'
import config from '../config'
async function isInit(dir: string) {
  return (
    await Promise.all(
      [BuildConfig.ConfigFile, 'package.json', 'behavior'].map((item) => {
        return FileExsit(path.join(dir, item))
      })
    )
  ).every((value: boolean) => {
    return value
  })
}
async function findTemplatedir() {
  if (await FileExsit(path.join(__dirname, '../template')))
    return path.join(__dirname, '../template')
  if (await FileExsit(path.join(__dirname, './template')))
    return path.join(__dirname, './template')
}
export async function initCommand(
  cliParam: CliParam,
  workdir: string
): Promise<number> {
  await Sapi.refresh()
  const cmdParams = cliParam.params.slice(1)
  if (await isInit(workdir)) {
    return 0
  }
  showText(exp.init.welcome)
  const initOpts = {
    name: cmdParams[0] || (await input(exp.init.name)),
    description: cmdParams[1] || (await input(exp.init.description)),
    lang: (cmdParams[2] ||
      (await Input.select(exp.init.lang, ['ts', 'js', 'mcx'] as const))) as
      | 'js'
      | 'mcx'
      | 'ts',
    initDeependencies: await Input.select(exp.init.initDes, [
      'no',
      'pnpm',
      'npm',
    ] as const),
    useUI: (await input(exp.init.useUI)) === 'y',
    useGIT: (await input(exp.init.useGIT)) === 'y',
    useBetaApi: (await input(exp.init.betaApi)) === 'y',
    mcVersion: await input(exp.init.mcVersion),
  }
  if (!initOpts.name) {
    showText(exp.init.noName)
    return 1
  }
  if (!initOpts.lang) {
    showText(exp.init.noLanguare)
    return 1
  }
  if (!initOpts.mcVersion || !isVaildVersion(initOpts.mcVersion)) {
    showText(exp.init.noMCVersion)
    return 1
  }
  const mblerConfig = {
    name: initOpts.name,
    description: initOpts.description,
    version: '0.0.0',
    script: {
      lang: initOpts.lang,
      main: 'index.js',
      ui: initOpts.useUI,
      UseBeta: initOpts.useBetaApi,
    },
    mcVersion: initOpts.mcVersion,
    minify: false,
  } satisfies MblerConfigData
  const packageJSON = {
    name: initOpts.name,
    version: '0.0.0',
    description: initOpts.description,
    module: 'module',
    scripts: {
      build: 'mcx-tsc && BUILD_MODULE=release mbler build',
      'dev:build': 'mbler build',
      install: 'pnpm i -g mbler',
      watch: 'mbler watch',
    },
    devDependencies: {
      '@minecraft/server': await Sapi.generateVersion(
        '@minecraft/server',
        initOpts.mcVersion,
        initOpts.useBetaApi
      ),
    } as Record<string, string>,
  }
  if (initOpts.useUI) {
    packageJSON.devDependencies['@minecraft/server-ui'] =
      await Sapi.generateVersion(
        '@minecraft/server-ui',
        initOpts.mcVersion,
        initOpts.useBetaApi
      )
  }
  const tsconfig = {
    compilerOptions: {
      module: 'nodenext',
      noEmit: true,
      target: 'esnext',
      types: ["@mbler/mcx-core/client"],
      sourceMap: true,
      declaration: true,
      declarationMap: false,
      noUncheckedIndexedAccess: true,
      exactOptionalPropertyTypes: true,
      allowJs: true,
      strict: true,
      moduleResolution: 'nodenext',
      verbatimModuleSyntax: false,
      isolatedModules: true,
      noUncheckedSideEffectImports: true,
      moduleDetection: 'force',
      skipLibCheck: true,
    },
    include: ['./behavior/scripts/**/*'],
  }

  const mblerConfigPath = path.join(workdir, BuildConfig.ConfigFile)
  const packageJSONPath = path.join(workdir, 'package.json')
  const tsconfigPath = path.join(workdir, 'tsconfig.json')

  if (initOpts.lang == 'mcx') {
    mblerConfig.script.main = 'index.mjs'
    packageJSON.devDependencies['@mbler/mcx'] = config.mcxVersion
  }
  if (initOpts.lang !== 'js') {
    await writeJSON(tsconfigPath, tsconfig)
  }
  await writeJSON(mblerConfigPath, mblerConfig)
  await writeJSON(packageJSONPath, packageJSON)
  // write template
  const templatedir = await findTemplatedir()
  if (!templatedir) {
    showText("can't find template folder")
    return 1
  }
  const templateTagerFolder = path.join(templatedir, initOpts.lang)
  if (!(await FileExsit(templateTagerFolder))) {
    showText("can't resolve template folder")
    return 1
  }
  const tasks: Promise<void | string>[] = []
  for (const item of await readdir(templateTagerFolder)) {
    tasks.push(
      cp(path.join(templateTagerFolder, item), path.join(workdir, item), {
        recursive: true,
        force: true,
      })
    )
  }
  await Promise.all(tasks)
  tasks.length = 0
  if (initOpts.initDeependencies !== 'no') {
    tasks.push(
      runCommand([initOpts.initDeependencies, 'install'], workdir, 'pipe')
    )
  }
  if (initOpts.useGIT) {
    tasks.push(runCommand(['git', 'init', '-b', 'main'], workdir, 'pipe'))
  }
  await Promise.all(tasks)
  tasks.length = 0
  return 0
}
