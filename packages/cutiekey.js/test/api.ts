/// <reference types='@types/jest' />

import { ApiClient, isApiError } from '../src/api'
import { enableFetchMocks } from 'jest-fetch-mock'

enableFetchMocks()

function getFetchCall(call: any[]) {
  let { body, method } = call[1]

  if (body && typeof body !== 'string') {
    throw new Error('invalid body')
  }

  return {
    body: JSON.parse(body),
    method,
    url: call[0]
  }
}

describe('API', () => {
  test('success', async () => {
    fetchMock.resetMocks()
    fetchMock.mockResponse(async req => {
      let body = await req.json()

      if (req.method === 'POST' && req.url === 'https://cutiekey.test/api/i') {
        if (body.i === 'TOKEN') {
          return JSON.stringify({ id: 'foo' })
        }

        return { status: 400 }
      }

      return { status: 404 }
    })

    let cli = new ApiClient({
      credential: 'TOKEN',
      origin: 'https://cutiekey.test'
    })

    let res = await cli.request('i')

    expect(res).toEqual({ id: 'foo' })

    expect(getFetchCall(fetchMock.mock.calls[0])).toEqual({
      body: { i: 'TOKEN' },
      method: 'POST',
      url: 'https://cutiekey.test/api/i'
    })
  })

  test('with params', async () => {
    fetchMock.resetMocks()
    fetchMock.mockResponse(async req => {
      let body = await req.json()

      if (
        req.method === 'POST'
          && req.url === 'https://cutiekey.test/api/notes/show'
      ) {
        if (body.i === 'TOKEN' && body.noteId === 'aaaaaa') {
          return JSON.stringify({ id: 'foo' })
        }

        return { status: 400 }
      }

      return { status: 404 }
    })

    let cli = new ApiClient({
      credential: 'TOKEN',
      origin: 'https://cutiekey.test'
    })

    let res = await cli.request('notes/show', { noteId: 'aaaaaa' })

    expect(res).toEqual({ id: 'foo' })

    expect(getFetchCall(fetchMock.mock.calls[0])).toEqual({
      body: {
        i: 'TOKEN',
        noteId: 'aaaaaa'
      },
      method: 'POST',
      url: 'https://cutiekey.test/api/notes/show'
    })
  })

  test('204 returns `null`', async () => {
    fetchMock.resetMocks()
    fetchMock.mockResponse(async req => {
      if (
        req.method === 'POST'
          && req.url === 'https://cutiekey.test/api/reset-password'
      ) {
        return { status: 204 }
      }

      return { status: 404 }
    })

    let cli = new ApiClient({
      credential: 'TOKEN',
      origin: 'https://cutiekey.test'
    })

    let res = await cli.request('reset-password', {
      password: 'aaa',
      token: 'aaa'
    })

    expect(res).toEqual(null)

    expect(getFetchCall(fetchMock.mock.calls[0])).toEqual({
      body: {
        i: 'TOKEN',
        password: 'aaa',
        token: 'aaa'
      },
      method: 'POST',
      url: 'https://cutiekey.test/api/reset-password'
    })
  })
})
