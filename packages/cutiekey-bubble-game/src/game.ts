import { NORMAL_MONOS, SQUARE_MONOS, SWEETS_MONOS, YEN_MONOS } from '@/monos'
import { EventEmitter } from 'eventemitter3'
import seedrandom from 'seedrandom'
import Matter from 'matter-js'

type Log =
  | {
      frame: number
      operation: 'drop'
      x: number
    }
  | {
      frame: number
      operation: 'hold'
    }
  | {
      frame: number
      operation: 'surrender'
    }

export type Mono = {
  id: string
  dropCandidate: boolean
  level: number
  score: number
  shape: 'circle' | 'custom' | 'rectangle'
  sizeX: number
  sizeY: number
  vertices?: Matter.Vector[][]
  verticesSize?: number
}

export class DropAndFusionGame extends EventEmitter<{
  changeCombo: (newCombo: number) => void
  changeHolding: (newHolding: { id: string; mono: Mono } | null) => void
  changeScore: (newScore: number) => void
  changeStock: (newStock: { id: string; mono: Mono }[]) => void
  collision: (energy: number, bodyA: Matter.Body, bodyB: Matter.Body) => void
  dropped: (x: number) => void
  fusioned: (
    x: number,
    y: number,
    nextMono: Mono | null,
    scoreDelta: number
  ) => void
  gameOver: () => void
  monoAdded: (mono: Mono) => void
}> {
  public readonly DROP_COOLTIME: number
  public engine: Matter.Engine
  public frame: number
  public readonly GAME_HEIGHT: number
  public readonly GAME_VERSION: number
  public readonly GAME_WIDTH: number
  public readonly PLAYAREA_MARGIN: number
  public replayPlaybackRate: number
  private _combo: number
  private _score: number
  private COMBO_INTERVAL: number
  private fusionReadyBodyIds: Matter.Body['id'][]
  private fusionReservedPairs: { bodyA: Matter.Body; bodyB: Matter.Body }[]
  private gameMode: 'normal' | 'space' | 'square' | 'sweets' | 'yen'
  private gameOverReadyBodyIds: Matter.Body['id'][]
  private getMonoRenderOptions:
    | ((mono: Mono) => Partial<Matter.IBodyRenderOptions>)
    | null
  private holding: { id: string; mono: Mono } | null
  private isGameOver: boolean
  private latestDroppedAt: number
  private latestFusionedAt: number
  private logs: Log[]
  private overflowCollider: Matter.Body
  private PHYSICS_QUALITY_FACTOR: number
  private rng: () => number
  private stock: { id: string; mono: Mono }[]
  private STOCK_MAX: number
  private TICK_DELTA: number
  private tickCallbackQueue: { callback: () => void; frame: number }[]

  constructor(env: {
    gameMode: DropAndFusionGame['gameMode']
    getMonoRenderOptions?: (mono: Mono) => Partial<Matter.IBodyRenderOptions>
    seed: string
  }) {
    super()

    this.COMBO_INTERVAL = 60
    this.DROP_COOLTIME = 30
    this.GAME_HEIGHT = 600
    this.GAME_VERSION = 3
    this.GAME_WIDTH = 450
    this.PHYSICS_QUALITY_FACTOR = 16
    this.PLAYAREA_MARGIN = 25
    this.STOCK_MAX = 4
    this.TICK_DELTA = 1000 / 60

    this._combo = 0
    this._score = 0
    this.frame = 0
    this.fusionReadyBodyIds = []
    this.fusionReservedPairs = []
    this.gameMode = env.gameMode
    this.gameOverReadyBodyIds = []
    this.getMonoRenderOptions = env.getMonoRenderOptions ?? null
    this.holding = null
    this.isGameOver = false
    this.latestDroppedAt = 0
    this.latestFusionedAt = 0
    this.logs = []
    this.replayPlaybackRate = 1
    this.rng = seedrandom(env.seed)
    this.stock = []
    this.tickCallbackQueue = []

    const physicsQualityFactor =
      this.gameMode === 'sweets' ? 4 : this.PHYSICS_QUALITY_FACTOR

    this.engine = Matter.Engine.create({
      constraintIterations: 2 * physicsQualityFactor,
      enableSleeping: false,
      gravity: {
        x: 0,
        y: this.gameMode === 'space' ? 0.0125 : 1
      },
      positionIterations: 6 * physicsQualityFactor,
      timing: {
        timeScale: 2
      },
      velocityIterations: 4 * physicsQualityFactor
    })

    this.engine.world.bodies = []

    const thickness = 100
    const WALL_OPTIONS = {
      friction: 0.7,
      isStatic: true,
      label: '_wall_',
      render: {
        fillStyle: 'transparent',
        strokeStyle: 'transparent'
      },
      slop: this.gameMode === 'space' ? 0.01 : 0.7
    } as Matter.IChamferableBodyDefinition

    Matter.Composite.add(this.engine.world, [
      Matter.Bodies.rectangle(
        this.GAME_WIDTH / 2,
        this.GAME_HEIGHT + thickness / 2 - this.PLAYAREA_MARGIN,
        this.GAME_WIDTH,
        thickness,
        WALL_OPTIONS
      ),
      Matter.Bodies.rectangle(
        this.GAME_WIDTH + thickness / 2 - this.PLAYAREA_MARGIN,
        this.GAME_HEIGHT / 2,
        thickness,
        this.GAME_HEIGHT,
        WALL_OPTIONS
      ),
      Matter.Bodies.rectangle(
        -(thickness / 2 - this.PLAYAREA_MARGIN),
        this.GAME_HEIGHT / 2,
        thickness,
        this.GAME_HEIGHT,
        WALL_OPTIONS
      )
    ])

    this.overflowCollider = Matter.Bodies.rectangle(
      this.GAME_WIDTH / 2,
      0,
      this.GAME_WIDTH,
      200,
      {
        isSensor: true,
        isStatic: true,
        label: '_overflow_',
        render: {
          fillStyle: 'transparent',
          strokeStyle: 'transparent'
        }
      }
    )

    Matter.Composite.add(this.engine.world, this.overflowCollider)
  }

  public static deserializeLogs(logs: number[][]) {
    const _logs = [] as Log[]

    let frame = 0

    for (const log of logs) {
      const frameDelta = log[0]

      frame += frameDelta

      const operation = log[1]

      switch (operation) {
        case 0:
          _logs.push({
            frame,
            operation: 'drop',
            x: log[2]
          })

          break

        case 1:
          _logs.push({
            frame,
            operation: 'hold'
          })

          break

        case 2:
          _logs.push({
            frame,
            operation: 'surrender'
          })

          break
      }
    }

    return _logs
  }

  public dispose() {
    Matter.World.clear(this.engine.world, false)
    Matter.Engine.clear(this.engine)
  }

  public drop(inputX: number) {
    if (this.isGameOver) {
      return
    }

    if (this.frame - this.latestDroppedAt < this.DROP_COOLTIME) {
      return
    }

    const head = this.stock.shift()!

    this.stock.push({
      id: this.rng().toString(),
      mono: this.monoDefinitions.filter(x => x.dropCandidate)[
        Math.floor(
          this.rng() * this.monoDefinitions.filter(x => x.dropCandidate).length
        )
      ]
    })

    this.emit('changeStock', this.stock)

    inputX = Math.round(inputX)

    const x = Math.min(
      this.GAME_WIDTH - this.PLAYAREA_MARGIN - head.mono.sizeX / 2,
      Math.max(this.PLAYAREA_MARGIN + head.mono.sizeX / 2, inputX)
    )

    const body = this.createBody(head.mono, x, head.mono.sizeY / 2 + 50)

    this.logs.push({
      frame: this.frame,
      operation: 'drop',
      x: inputX
    })

    // Add force
    if (this.gameMode === 'space') {
      Matter.Body.applyForce(body, body.position, {
        x: 0,
        y: (Math.PI * head.mono.sizeX * head.mono.sizeY) / 65536
      })
    }

    Matter.Composite.add(this.engine.world, body)

    this.fusionReadyBodyIds.push(body.id)

    this.latestDroppedAt = this.frame

    this.emit('dropped', x)
    this.emit('monoAdded', head.mono)
  }

  public frameToMs(frame: number) {
    return frame * this.TICK_DELTA
  }

  public getActiveMonos() {
    return this.engine.world.bodies
      .map(x => this.monoDefinitions.find(mono => mono.id === x.label)!)
      .filter(x => x !== undefined)
  }

  public getLogs() {
    return this.logs
  }

  public hold() {
    if (this.isGameOver) {
      return
    }

    this.logs.push({
      frame: this.frame,
      operation: 'hold'
    })

    if (this.holding) {
      const head = this.stock.shift()!

      this.stock.unshift(this.holding)

      this.holding = head

      this.emit('changeHolding', this.holding)
      this.emit('changeStock', this.stock)
    } else {
      const head = this.stock.shift()!
      this.holding = head

      this.stock.push({
        id: this.rng().toString(),
        mono: this.monoDefinitions.filter(x => x.dropCandidate)[
          Math.floor(
            this.rng() *
              this.monoDefinitions.filter(x => x.dropCandidate).length
          )
        ]
      })

      this.emit('changeHolding', this.holding)
      this.emit('changeStock', this.stock)
    }
  }

  public get monoDefinitions() {
    switch (this.gameMode) {
      case 'normal':
        return NORMAL_MONOS

      case 'space':
        return NORMAL_MONOS

      case 'square':
        return SQUARE_MONOS

      case 'sweets':
        return SWEETS_MONOS

      case 'yen':
        return YEN_MONOS
    }
  }

  public msToFrame(ms: number) {
    return Math.round(ms / this.TICK_DELTA)
  }

  public static serializeLogs(logs: Log[]) {
    const _logs = [] as number[][]

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i]

      const frameDelta = i === 0 ? log.frame : log.frame - logs[i - 1].frame

      switch (log.operation) {
        case 'drop':
          _logs.push([frameDelta, 0, log.x])

          break

        case 'hold':
          _logs.push([frameDelta, 1])

          break

        case 'surrender':
          _logs.push([frameDelta, 2])

          break
      }
    }

    return _logs
  }

  public start() {
    for (let i = 0; i < this.STOCK_MAX; i++) {
      this.stock.push({
        id: this.rng().toString(),
        mono: this.monoDefinitions.filter(x => x.dropCandidate)[
          Math.floor(
            this.rng() *
              this.monoDefinitions.filter(x => x.dropCandidate).length
          )
        ]
      })
    }

    this.emit('changeStock', this.stock)

    Matter.Events.on(
      this.engine,
      'collisionActive',
      this.onCollisionActive.bind(this)
    )

    Matter.Events.on(this.engine, 'collisionStart', this.onCollision.bind(this))
  }

  public surrender() {
    this.logs.push({
      frame: this.frame,
      operation: 'surrender'
    })

    this.gameOver()
  }

  public tick() {
    this.frame++

    if (this.latestFusionedAt < this.frame - this.COMBO_INTERVAL) {
      this.combo = 0
    }

    this.tickCallbackQueue = this.tickCallbackQueue.filter(x => {
      if (x.frame === this.frame) {
        x.callback()

        return false
      }

      return true
    })

    Matter.Engine.update(this.engine, this.TICK_DELTA)

    const hasNextTick = !this.isGameOver

    return hasNextTick
  }

  private get combo() {
    return this._combo
  }

  private set combo(value: number) {
    this._combo = value

    this.emit('changeCombo', value)
  }

  private createBody(mono: Mono, x: number, y: number) {
    const options = {
      density:
        this.gameMode === 'space' ? 0.01 : (mono.sizeX * mono.sizeY) / 10000,
      friction: this.gameMode === 'space' ? 0.5 : 0.7,
      frictionAir: this.gameMode === 'space' ? 0 : 0.01,
      frictionStatic: this.gameMode === 'space' ? 0 : 5,
      label: mono.id,
      render: this.getMonoRenderOptions
        ? this.getMonoRenderOptions(mono)
        : undefined,
      restitution: this.gameMode === 'space' ? 0.5 : 0.2,
      slop: this.gameMode === 'space' ? 0.01 : 0.7
    } as Matter.IBodyDefinition

    switch (mono.shape) {
      case 'circle':
        return Matter.Bodies.circle(x, y, mono.sizeX / 2, options)

      case 'custom':
        return Matter.Bodies.fromVertices(
          x,
          y,
          mono.vertices!.map(i =>
            i.map(j => ({
              x: (j.x / mono.verticesSize!) * mono.sizeX,
              y: (j.y / mono.verticesSize!) * mono.sizeY
            }))
          ),
          options
        )

      case 'rectangle':
        return Matter.Bodies.rectangle(x, y, mono.sizeX, mono.sizeY, options)

      default:
        throw new Error('unrecognized shape')
    }
  }

  private fusion(bodyA: Matter.Body, bodyB: Matter.Body) {
    if (this.latestFusionedAt > this.frame - this.COMBO_INTERVAL) {
      this.combo++
    } else {
      this.combo = 1
    }

    this.latestFusionedAt = this.frame

    const newX = (bodyA.position.x + bodyB.position.x) / 2
    const newY = (bodyA.position.y + bodyB.position.y) / 2

    this.fusionReadyBodyIds = this.fusionReadyBodyIds.filter(
      x => x !== bodyA.id && x !== bodyB.id
    )

    this.gameOverReadyBodyIds = this.gameOverReadyBodyIds.filter(
      x => x !== bodyA.id && x !== bodyB.id
    )

    Matter.Composite.remove(this.engine.world, [bodyA, bodyB])

    const currentMono = this.monoDefinitions.find(y => y.id === bodyA.label)!
    const nextMono =
      this.monoDefinitions.find(x => x.level === currentMono.level + 1) ?? null

    if (nextMono) {
      const body = this.createBody(nextMono, newX, newY)

      Matter.Composite.add(this.engine.world, body)

      this.tickCallbackQueue.push({
        callback: () => {
          this.fusionReadyBodyIds.push(body.id)
        },
        frame: this.frame + this.msToFrame(100)
      })

      this.emit('monoAdded', nextMono)
    }

    const hasComboBonus = this.gameMode !== 'yen' && this.gameMode !== 'sweets'

    const comboBonus = hasComboBonus ? (this.combo - 1) / 5 + 1 : 1

    const additionalScore = Math.round(currentMono.score * comboBonus)
    this.score += additionalScore

    this.emit('fusioned', newX, newY, nextMono, additionalScore)
  }

  private gameOver() {
    this.isGameOver = true

    this.emit('gameOver')
  }

  private onCollision(ev: Matter.IEventCollision<Matter.Engine>) {
    for (const pairs of ev.pairs) {
      const { bodyA, bodyB } = pairs
      const shouldFusion =
        bodyA.label == bodyB.label &&
        !this.fusionReservedPairs.some(
          x =>
            x.bodyA.id === bodyA.id ||
            x.bodyA.id === bodyB.id ||
            x.bodyB.id === bodyA.id ||
            x.bodyB.id === bodyB.id
        )

      if (shouldFusion) {
        if (
          this.fusionReadyBodyIds.includes(bodyA.id) &&
          this.fusionReadyBodyIds.includes(bodyB.id)
        ) {
          this.fusion(bodyA, bodyB)
        } else {
          this.fusionReservedPairs.push({ bodyA, bodyB })
          this.tickCallbackQueue.push({
            callback: () => {
              this.fusionReservedPairs = this.fusionReservedPairs.filter(
                x => x.bodyA.id !== bodyA.id && x.bodyB.id !== bodyB.id
              )

              this.fusion(bodyA, bodyB)
            },
            frame: this.frame + this.msToFrame(100)
          })
        }
      } else {
        const energy = pairs.collision.depth

        if (bodyA.label === '_overflow_' || bodyB.label === '_overflow_') {
          continue
        }

        if (bodyA.label !== '_wall_' && bodyB.label !== '_wall_') {
          if (!this.gameOverReadyBodyIds.includes(bodyA.id)) {
            this.gameOverReadyBodyIds.push(bodyA.id)
          }

          if (!this.gameOverReadyBodyIds.includes(bodyB.id)) {
            this.gameOverReadyBodyIds.push(bodyB.id)
          }
        }

        this.emit('collision', energy, bodyA, bodyB)
      }
    }
  }

  private onCollisionActive(ev: Matter.IEventCollision<Matter.Engine>) {
    for (const pairs of ev.pairs) {
      const { bodyA, bodyB } = pairs

      if (
        bodyA.id === this.overflowCollider.id ||
        bodyB.id === this.overflowCollider.id
      ) {
        if (
          this.gameOverReadyBodyIds.includes(bodyA.id) ||
          this.gameOverReadyBodyIds.includes(bodyB.id)
        ) {
          this.gameOver()

          break
        }

        continue
      }
    }
  }

  private get score() {
    return this._score
  }

  private set score(value: number) {
    this._score = value

    this.emit('changeScore', value)
  }
}
