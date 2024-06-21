/// <reference types='@types/jest' />

import { Stream } from '../src/streaming'
import WS from 'jest-websocket-mock'

describe('Streaming', () => {
  test('useChannel', async () => {
    let server = new WS('wss://cutiekey.test/streaming')
    let stream = new Stream('https://cutiekey.test', { token: 'TOKEN' })

    let main = stream.useChannel('main')
  })
})
