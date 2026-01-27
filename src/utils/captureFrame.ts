export type CaptureFrameOptions = {
  targetWidth?: number
  jpegQuality?: number
  /**
   * Hard limit to keep payload under POS contract (openapi maxLength 1,000,000).
   * This is base64 length (not bytes).
   */
  maxBase64Length?: number
}

export type CaptureFrameResult = {
  dataUrl: string
  /**
   * Base64 without `data:image/...;base64,` prefix (ready for POS payload).
   */
  imageBase64: string
  width: number
  height: number
  base64Length: number
}

function stripDataUrlPrefix(dataUrl: string) {
  const idx = dataUrl.indexOf("base64,")
  if (idx === -1) return dataUrl
  return dataUrl.slice(idx + "base64,".length)
}

export function captureFrameFromVideo(video: HTMLVideoElement, opts: CaptureFrameOptions = {}): CaptureFrameResult {
  const targetWidth = opts.targetWidth ?? 640
  const maxBase64Length = opts.maxBase64Length ?? 1_000_000

  if (!video.videoWidth || !video.videoHeight) {
    throw new Error("Video not ready (missing dimensions).")
  }

  const scale = targetWidth / video.videoWidth
  const width = Math.max(1, Math.round(video.videoWidth * Math.min(1, scale)))
  const height = Math.max(1, Math.round(video.videoHeight * (width / video.videoWidth)))

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2d context unavailable.")

  ctx.drawImage(video, 0, 0, width, height)

  // Ajuste simple: bajar calidad si excede el límite.
  const qualities = [opts.jpegQuality ?? 0.82, 0.72, 0.62, 0.52, 0.42]
  let lastDataUrl = ""

  for (const q of qualities) {
    lastDataUrl = canvas.toDataURL("image/jpeg", q)
    const base64 = stripDataUrlPrefix(lastDataUrl)
    if (base64.length <= maxBase64Length) {
      return {
        dataUrl: lastDataUrl,
        imageBase64: base64,
        width,
        height,
        base64Length: base64.length,
      }
    }
  }

  const base64 = stripDataUrlPrefix(lastDataUrl)
  console.warn("[captureFrameFromVideo] imageBase64 exceeds limit:", { base64Length: base64.length, maxBase64Length })
  return {
    dataUrl: lastDataUrl,
    imageBase64: base64,
    width,
    height,
    base64Length: base64.length,
  }
}

export function normalizeImageBase64(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ""
  // acepta dataURL o base64 puro
  if (trimmed.startsWith("data:")) return stripDataUrlPrefix(trimmed)
  return trimmed
}

