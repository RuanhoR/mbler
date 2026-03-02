import path from 'node:path'
import Sapi from '../build/sapi'
import { CliParam, MblerConfigData } from '../types'
import { input, showText, writeJSON } from '../utils'
import { Input } from '../commander'
import { BuildConfig } from '../build/config'

export async function initCommand(
  cliParam: CliParam,
  workdir: string
): Promise<number> {
  const cmdParams = cliParam.params.slice(1)
  const initOpts: {
    name: string
    description: string
    lang: string
    initDeependencies: boolean
    useUI: boolean
    useGIT: boolean
    useBetaApi: boolean
    mcVersion: string
  } = {
    name: cmdParams[0] || (await input('Project name: ')),
    description: cmdParams[1] || (await input('Project description: ')),
    lang:
      cmdParams[2] ||
      (await Input.select('Project language: ', ['ts', 'js', 'mcx'])),
    initDeependencies:
      (await input('Initialize dependencies? (y/n): ')) === 'y',
    useUI: (await input('Use UI? (y/n): ')) === 'y',
    useGIT: (await input('Initialize GIT repository? (y/n): ')) === 'y',
    useBetaApi: (await input('Use beta API? (y/n): ')) === 'y',
    mcVersion: await input('Minecraft version(be like: x.x.x): '),
  }
  if (!initOpts.name) {
    showText('Project name is required.')
    return 1
  }
  if (!initOpts.lang) {
    showText('Project language is required.')
    return 1
  }
  const mblerConfig: MblerConfigData = {
    name: initOpts.name,
    description: initOpts.description,
    version: '0.0.0',
    script: {
      main: 'index.js',
      ui: initOpts.useUI,
      UseBeta: initOpts.useBetaApi,
    },
    mcVersion: initOpts.mcVersion,
    minify: false,
  }
  const packageJSON = {
    name: initOpts.name,
    version: '0.0.0',
    description: initOpts.description,
    scripts: {
      build: 'mbler build',
      dev: 'mbler watch',
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
      lib: ['esnext'],
      types: [],
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
  if (initOpts.lang !== 'js') {
    await writeJSON(tsconfigPath, tsconfig)
  }
  await writeJSON(mblerConfigPath, mblerConfig)
  await writeJSON(packageJSONPath, packageJSON)

  // write template
  return 0
}
