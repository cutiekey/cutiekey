import type { BroadcastEvents, Channels } from '@/streaming.types'
import ReconnectingWebSocket from 'reconnecting-websocket'
import { EventEmitter } from 'eventemitter3'

type AnyOf<T extends Record<any, any>> = T[keyof T]
type StreamEvents = {
  _connected_: void
  _disconnected_: void
} & BroadcastEvents

export function urlQuery(
  obj: Record<string, boolean | number | string | undefined>
) {
  let params = Object.entries(obj)
    .filter(([, v]) => (Array.isArray(v) ? v.length : v !== undefined))
    .reduce(
      (a, [k, v]) => ((a[k] = v!), a),
      {} as Record<string, boolean | number | string>
    )

  return Object.entries(params)
    .map(e => `${e[0]}=${encodeURIComponent(e[1])}`)
    .join('&')
}

abstract class Connection<
  Channel extends AnyOf<Channels> = any
> extends EventEmitter<Channel['events']> {
  public abstract id: string
  public channel: string
  public inCount: number
  public name?: string
  public outCount: number
  protected stream: Stream

  constructor(stream: Stream, channel: string, name?: string) {
    super()

    this.send = this.send.bind(this)

    this.channel = channel
    this.inCount = 0
    this.name = name
    this.outCount = 0
    this.stream = stream
  }

  public abstract dispose(): void

  public send<T extends keyof Channel['receives']>(
    type: T,
    body: Channel['receives'][T]
  ) {
    this.stream.send('ch', {
      id: this.id,
      body,
      type
    })

    this.outCount++
  }
}

class NonSharedConnection<
  Channel extends AnyOf<Channels> = any
> extends Connection<Channel> {
  public id: string
  protected params: Channel['params']

  constructor(
    stream: Stream,
    channel: string,
    id: string,
    params: Channel['params']
  ) {
    super(stream, channel)

    this.connect = this.connect.bind(this)
    this.dispose = this.dispose.bind(this)

    this.id = id
    this.params = params
  }

  public connect() {
    this.stream.send('connect', {
      id: this.id,
      channel: this.channel,
      params: this.params
    })
  }

  public dispose() {
    this.removeAllListeners()

    this.stream.send('disconnect', { id: this.id })
    this.stream.disconnectToChannel(this)
  }
}

class Pool {
  public id: string
  public channel: string
  public users: number
  protected stream: Stream
  private disposeTimerId?: NodeJS.Timeout
  private isConnected: boolean

  constructor(stream: Stream, channel: string, id: string) {
    this.connect = this.connect.bind(this)
    this.dec = this.dec.bind(this)
    this.disconnect = this.disconnect.bind(this)
    this.inc = this.inc.bind(this)
    this.onStreamDisconnected = this.onStreamDisconnected.bind(this)

    this.channel = channel
    this.id = id
    this.isConnected = false
    this.stream = stream
    this.users = 0

    this.stream.on('_disconnected_', this.onStreamDisconnected)
  }

  public connect() {
    if (this.isConnected) {
      return
    }

    this.isConnected = true

    this.stream.send('connect', {
      id: this.id,
      channel: this.channel
    })
  }

  public dec() {
    this.users--

    if (this.users === 0) {
      this.disposeTimerId = setTimeout(() => {
        this.disconnect()
      }, 3000)
    }
  }

  public inc() {
    if (this.users === 0 && !this.isConnected) {
      this.connect()
    }

    this.users++

    if (this.disposeTimerId) {
      clearTimeout(this.disposeTimerId)

      delete this.disposeTimerId
    }
  }

  private disconnect() {
    this.stream.off('_disconnected_', this.onStreamDisconnected)
    this.stream.send('disconnect', { id: this.id })
    this.stream.removeSharedConnectionPool(this)
  }

  private onStreamDisconnected() {
    this.isConnected = false
  }
}

class SharedConnection<
  Channel extends AnyOf<Channels> = any
> extends Connection<Channel> {
  private pool: Pool

  constructor(stream: Stream, channel: string, pool: Pool, name?: string) {
    super(stream, channel, name)

    this.dispose = this.dispose.bind(this)

    this.pool = pool

    this.pool.inc()
  }

  public dispose() {
    this.pool.dec()

    this.removeAllListeners()

    this.stream.removeSharedConnection(this)
  }

  public get id() {
    return this.pool.id
  }
}

class Stream extends EventEmitter<StreamEvents> {
  public state: 'connected' | 'initializing' | 'reconnecting'
  private idCounter: number
  private nonSharedConnections: NonSharedConnection[]
  private sharedConnectionPools: Pool[]
  private sharedConnections: SharedConnection[]
  private stream: ReconnectingWebSocket

  constructor(
    origin: string,
    user: { token: string } | null,
    opts?: { WebSocket?: any }
  ) {
    super()

    this.close = this.close.bind(this)
    this.connectToChannel = this.connectToChannel.bind(this)
    this.disconnectToChannel = this.disconnectToChannel.bind(this)
    this.generateId = this.generateId.bind(this)
    this.onClose = this.onClose.bind(this)
    this.onMessage = this.onMessage.bind(this)
    this.onOpen = this.onOpen.bind(this)
    this.removeSharedConnection = this.removeSharedConnection.bind(this)
    this.removeSharedConnectionPool = this.removeSharedConnectionPool.bind(this)
    this.send = this.send.bind(this)
    this.useChannel = this.useChannel.bind(this)
    this.useSharedConnection = this.useSharedConnection.bind(this)

    opts ??= {}

    this.idCounter = 0
    this.nonSharedConnections = []
    this.sharedConnectionPools = []
    this.sharedConnections = []
    this.state = 'initializing'

    let query = urlQuery({
      // To prevent caching of an HTML error screen
      _t: Date.now(),
      i: user?.token
    })

    let wsOrigin = origin
      .replace('http://', 'ws://')
      .replace('https://', 'wss://')

    this.stream = new ReconnectingWebSocket(
      `${wsOrigin}/streaming?${query}`,
      '',
      {
        minReconnectionDelay: 1,
        WebSocket: opts.WebSocket
      }
    )

    this.stream.addEventListener('close', this.onClose)
    this.stream.addEventListener('message', this.onMessage)
    this.stream.addEventListener('open', this.onOpen)
  }

  public close() {
    this.stream.close()
  }

  public disconnectToChannel(connection: NonSharedConnection) {
    this.nonSharedConnections = this.nonSharedConnections.filter(
      c => c !== connection
    )
  }

  public heartbeat() {
    this.stream.send('h')
  }

  public ping() {
    this.stream.send('ping')
  }

  public removeSharedConnection(connection: SharedConnection) {
    this.sharedConnections = this.sharedConnections.filter(
      c => c !== connection
    )
  }

  public removeSharedConnectionPool(pool: Pool) {
    this.sharedConnectionPools = this.sharedConnectionPools.filter(
      p => p !== pool
    )
  }

  public send(typeOrPayload: string): void
  public send(typeOrPayload: string, payload: any): void
  public send(typeOrPayload: Record<string, any> | any[]): void
  public send(
    typeOrPayload: Record<string, any> | any[] | string,
    payload?: any
  ) {
    if (typeof typeOrPayload === 'string') {
      this.stream.send(
        JSON.stringify({
          ...(!payload ? {} : { body: payload }),
          type: typeOrPayload
        })
      )

      return
    }

    this.stream.send(JSON.stringify(typeOrPayload))
  }

  public useChannel<C extends keyof Channels>(
    channel: C,
    params?: Channels[C]['params'],
    name?: string
  ): Connection<Channels[C]> {
    if (params) {
      return this.connectToChannel(channel, params)
    }

    return this.useSharedConnection(channel, name)
  }

  private connectToChannel<C extends keyof Channels>(
    channel: C,
    params: Channels[C]['params']
  ): NonSharedConnection<Channels[C]> {
    let connection = new NonSharedConnection(
      this,
      channel,
      this.generateId(),
      params
    )

    this.nonSharedConnections.push(connection)

    return connection
  }

  private generateId() {
    return (++this.idCounter).toString()
  }

  private onClose() {
    if (this.state === 'connected') {
      this.state = 'reconnecting'

      this.emit('_disconnected_')
    }
  }

  private onMessage(message: { data: string }) {
    let { body, type } = JSON.parse(message.data)

    if (type === 'channel') {
      let connections: Connection[]
      let id = body.id

      connections = this.sharedConnections.filter(c => c.id === id)

      if (connections.length === 0) {
        let found = this.nonSharedConnections.find(c => c.id === id)

        if (found) {
          connections = [found]
        }
      }

      for (const c of connections) {
        c.emit(body.type, body.body)

        c.inCount++
      }
    } else {
      this.emit(type, body)
    }
  }

  private onOpen() {
    let isReconnect = this.state === 'reconnecting'

    this.state = 'connected'

    this.emit('_connected_')

    if (isReconnect) {
      for (const p of this.sharedConnectionPools) {
        p.connect()
      }

      for (const c of this.nonSharedConnections) {
        c.connect()
      }
    }
  }

  private useSharedConnection<C extends keyof Channels>(
    channel: C,
    name?: string
  ): SharedConnection<Channels[C]> {
    let pool = this.sharedConnectionPools.find(p => p.channel === channel)

    if (!pool) {
      pool = new Pool(this, channel, this.generateId())

      this.sharedConnectionPools.push(pool)
    }

    let connection = new SharedConnection(this, channel, pool, name)

    this.sharedConnections.push(connection)

    return connection
  }
}

export { Connection, Stream }
