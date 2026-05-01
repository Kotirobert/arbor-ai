function getKey(): string {
  return process.env.OPENAI_API_KEY ?? ''
}

type Orientation = 'landscape' | 'portrait' | 'square'

function sizeFor(orientation: Orientation): string {
  switch (orientation) {
    case 'landscape': return '1536x1024'
    case 'portrait':  return '1024x1536'
    case 'square':    return '1024x1024'
  }
}

export async function generateImage(
  prompt: string,
  orientation: Orientation = 'square',
): Promise<{ base64: string; mimeType: 'image/png' }> {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getKey()}`,
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: sizeFor(orientation),
      output_format: 'png',
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(`OpenAI images ${res.status}: ${err.error?.message ?? 'Unknown error'}`)
  }

  const data = await res.json() as { data: Array<{ b64_json: string }> }
  const base64 = data.data[0]?.b64_json
  if (!base64) throw new Error('No image data returned')

  return { base64, mimeType: 'image/png' }
}
