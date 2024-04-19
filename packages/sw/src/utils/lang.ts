import { I18n, Locale } from '@/utils/i18n'
import { get, set } from 'idb-keyval'

class SwLang {
  public cacheName = `ck-cache-${_VERSION_}`
  public i18n: Promise<I18n<Locale>> | null = null
  public lang = get<string>('lang').then(async prelang => {
    if (!prelang) {
      return 'en-US'
    }

    return prelang
  })

  public fetchLocale() {
    return this.i18n = this._fetch()
  }

  public setLang(newLang: string) {
    this.lang = Promise.resolve(newLang)

    set('lang', newLang)

    return this.fetchLocale()
  }

  private async _fetch() {
    const localeUrl = `/assets/locales/${await this.lang}.${_VERSION_}.json`

    let localeRes = await caches.match(localeUrl)

    if (!localeRes || _DEV_) {
      localeRes = await fetch(localeUrl)

      const clone = localeRes.clone()

      if (!clone.clone().ok) {
        throw new Error('error fetching the locale')
      }

      caches.open(this.cacheName).then(cache => cache.put(localeUrl, clone))
    }

    return new I18n<Locale>(await localeRes.json())
  }
}

export const swLang = new SwLang()
