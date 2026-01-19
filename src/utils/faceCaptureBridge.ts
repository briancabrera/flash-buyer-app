export type FaceCapturePayload = {
  dataUrl: string
  imageBase64: string
  base64Length: number
  width: number
  height: number
}

export type FaceCaptureCallbacks = {
  onCapture: (payload: FaceCapturePayload) => void
  onCancel?: () => void
}

let callbacks: FaceCaptureCallbacks | null = null

export function setFaceCaptureCallbacks(next: FaceCaptureCallbacks | null) {
  callbacks = next
}

export function getFaceCaptureCallbacks(): FaceCaptureCallbacks | null {
  return callbacks
}

export function clearFaceCaptureCallbacks() {
  callbacks = null
}
