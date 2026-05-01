import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateImage } from '../openaiImageClient'

describe('generateImage', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('uses GPT image parameters and reads the default base64 response', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-test-key-long-enough')
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(Response.json({ data: [{ b64_json: 'png-base64' }] }))
      .mockResolvedValueOnce(Response.json({ data: [{ b64_json: 'png-base64' }] }))

    const result = await generateImage('A classroom water cycle diagram', 'landscape')

    expect(result).toEqual({ base64: 'png-base64', mimeType: 'image/png' })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/images/generations',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test-key-long-enough',
        }),
      }),
    )

    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string) as Record<string, unknown>
    expect(body).toMatchObject({
      model: 'gpt-image-1',
      prompt: 'A classroom water cycle diagram',
      n: 1,
      size: '1536x1024',
      output_format: 'png',
    })
    expect(body).not.toHaveProperty('response_format')
  })

  it('maps portrait and square requests to GPT image sizes', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-test-key-long-enough')
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(Response.json({ data: [{ b64_json: 'png-base64' }] }))
      .mockResolvedValueOnce(Response.json({ data: [{ b64_json: 'png-base64' }] }))

    await generateImage('Portrait poster', 'portrait')
    await generateImage('Square diagram', 'square')

    const portraitBody = JSON.parse(fetchMock.mock.calls[0][1]?.body as string) as { size: string }
    const squareBody = JSON.parse(fetchMock.mock.calls[1][1]?.body as string) as { size: string }
    expect(portraitBody.size).toBe('1024x1536')
    expect(squareBody.size).toBe('1024x1024')
  })
})
