import * as yaml from 'js-yaml'
import * as fs from 'node:fs'

/** @param {string} text */
const clean = text =>
  text.replace(new RegExp(String.fromCodePoint(0x08), 'g'), '')

const merge = (...args) =>
  args.reduce(
    (a, c) => ({
      ...a,
      ...c,
      ...Object.entries(a)
        .filter(([k]) => c && typeof c[k] === 'object')
        .reduce((a, [k, v]) => ((a[k] = merge(v, c[k])), a), {})
    }),
    {}
  )

const languages = ['en-US', 'ja-JP', 'zh-CN']

const primaries = {
  en: 'US',
  ja: 'JP',
  zh: 'CN'
}

export function build() {
  const locales = languages.reduce(
    (a, c) => (
      (a[c] =
        yaml.load(
          clean(fs.readFileSync(new URL(`${c}.yml`, import.meta.url), 'utf-8'))
        ) || {}),
      a
    ),
    {}
  )

  const removeEmpty = obj => {
    for (const [k, v] of Object.entries(obj)) {
      if (v === '') {
        delete obj[k]
      } else if (typeof v === 'object') {
        removeEmpty(v)
      }
    }

    return obj
  }

  removeEmpty(locales)

  return Object.entries(locales).reduce(
    (a, [k, v]) => (
      (a[k] = (() => {
        const [lang] = k.split('-')

        switch (k) {
          case 'en-US':
            return v

          case 'ja-JP':
          case 'ja-KS':
            return merge(locales['en-US'], v)

          default:
            return merge(
              locales['en-US'],
              locales['ja-JP'],
              locales[`${lang}-${primaries[lang]}`] ?? {},
              v
            )
        }
      })()),
      a
    ),
    {}
  )
}

export default build()
