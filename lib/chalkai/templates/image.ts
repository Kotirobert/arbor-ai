export function buildImagePrompt(
  description: string,
  yearGroup: string,
  intendedUse: string,
  orientation: string,
): string {
  const aspectMap: Record<string, string> = {
    poster:  'portrait orientation (A3 poster format)',
    display: 'landscape orientation (classroom display)',
    diagram: 'square format (diagram or infographic)',
    scene:   'landscape orientation (scene illustration)',
  }
  const aspectNote = aspectMap[intendedUse] ?? 'square format'

  return [
    description,
    `Educational illustration suitable for ${yearGroup} pupils.`,
    `Style: clear, colourful, classroom-appropriate.`,
    `No text overlays unless specifically requested.`,
    `${aspectNote}.`,
    `Bright and engaging. Safe for school use.`,
  ].join(' ')
}
