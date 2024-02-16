import '@/autogen/api-client-jsdoc'

import type { Endpoints, SwitchCaseResponseType } from '@/api.types'

const CK_API_ERROR = Symbol()

export type ApiError = {
  id: string
  code: string
  info: Record<string, any>
  kind: 'client' | 'server'
  message: string
}

export type FetchLike = (
  input: string,
  init?: {
    body?: string
    cache?: RequestCache
    credentials?: RequestCredentials
    headers: HeadersInit
    method?: string
  }
) => Promise<{
  json(): Promise<any>
  status: number
}>

export function isApiError(reason: any): reason is ApiError {
  return reason[CK_API_ERROR] === true
}

export class ApiClient {
  public credential: string | null | undefined
  public fetch: FetchLike
  public origin: string

  constructor(opts: {
    credential?: ApiClient['credential']
    fetch?: ApiClient['fetch'] | null | undefined
    origin: ApiClient['origin']
  }) {
    this.credential = opts.credential
    this.fetch = opts.fetch ?? ((...args) => fetch(...args))
    this.origin = opts.origin
  }

  public request<E extends keyof Endpoints, P extends Endpoints[E]['req']>(
    endpoint: E,
    params: P = {} as P,
    credential?: string | null
  ): Promise<SwitchCaseResponseType<E, P>> {
    return new Promise((resolve, reject) => {
      this.fetch(`${this.origin}/api/${endpoint}`, {
        body: JSON.stringify({
          ...params,
          i: credential ? credential : this.credential
        }),
        cache: 'no-cache',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST'
      })
        .then(async res => {
          const body = res.status === 204 ? null : await res.json()

          if (res.status === 200 || res.status === 204) {
            resolve(body)
          } else {
            reject({
              [CK_API_ERROR]: true,
              ...body.error
            })
          }
        })
        .catch(reject)
    })
  }
}

export { SwitchCaseResponseType }
