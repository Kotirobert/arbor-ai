export function buildTemplate(): string {
  return `Generate a classroom presentation as a JSON object. Output ONLY the JSON — no markdown fences, no preamble, no explanation.

The JSON must match this exact schema:
{
  "topic": "string",
  "yearGroup": "string",
  "themeDirection": "string — e.g. 'bright, science-themed, colourful'",
  "slideCount": number,
  "slides": [
    {
      "type": "title" | "content" | "image" | "closing",
      "title": "string",
      "subtitle": "string or omit",
      "bullets": ["max 5 bullet strings"] or omit,
      "speakerNotes": "string — what the teacher would say",
      "imageDescription": "string describing an image to generate, or null if no image needed"
    }
  ]
}

Rules:
- First slide must be type "title"
- Last slide must be type "closing"
- Content slides may have bullets OR imageDescription (not both)
- Title and concept-introduction slides usually benefit from an image
- Bullet-heavy slides: set imageDescription to null
- Speaker notes on every slide, 2–4 sentences
- Bullets: concise, pupil-facing language
- Output valid JSON only — no trailing commas`
}
