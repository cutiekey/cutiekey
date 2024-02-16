import meta from '../../package.json' assert { type: 'json' }
import locales from '../../locales/index.js'
import { fileURLToPath } from 'node:url'
import * as esbuild from 'esbuild'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const watch = process.argv[2]?.includes('watch')

console.log('[SW] Starting SW build...')

/** @type {esbuild.BuildOptions} */
const buildOptions = {
  absWorkingDir: __dirname,
  bundle: true,
  define: {
    _DEV_: JSON.stringify(process.env.NODE_ENV !== 'production'),
    _ENV_: JSON.stringify(process.env.NODE_ENV ?? 'development'),
    _LANGS_: JSON.stringify(Object.entries(locales).map(([k, v]) => [k, v._lang_])),
    _PERF_PREFIX_: JSON.stringify('Cutiekey:'),
    _VERSION_: JSON.stringify(meta.version)
  },
  entryPoints: [`${__dirname}/src/sw.ts`],
  format: 'esm',
  loader: {
    '.ts': 'ts'
  },
  minify: process.env.NODE_ENV === 'production',
  outbase: `${__dirname}/src`,
  outdir: `${__dirname}/../../built/_sw_dist_`,
  treeShaking: true,
  tsconfig: `${__dirname}/tsconfig.json`
}

;(async () => {
  if (!watch) {
    await esbuild.build(buildOptions)

    console.log('[SW] SW build completed')
  } else {
    const context = await esbuild.context(buildOptions)

    await context.watch()

    console.log('[SW] Watching...')
  }
})()
