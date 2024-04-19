export type Locale = {
  [key: string]: Locale | string
}

export class I18n<T extends Locale = Locale> {
  public ts: T

  constructor(locale: T) {
    this.t = this.t.bind(this)

    this.ts = locale
  }

  public t(key: string, args?: Record<string, string>) {
    try {
      let str = key.split('.')
        .reduce<Locale | Locale[keyof Locale]>((o, i) => (o as any)[i], this.ts)

      if (typeof str !== 'string') {
        throw new Error()
      }

      if (args) {
        for (const [k, v] of Object.entries(args)) {
          str = str.replace(`{${k}}`, v)
        }
      }

      return str
    } catch (err) {
      console.warn(`[SW] Missing translation for \`${key}\`. Using key name.`)

      return key
    }
  }
}
