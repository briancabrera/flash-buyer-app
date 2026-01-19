export type FaceScanAttempt = {
  payload: string
  idempotencyKey: string
}

export function getFaceScanAttempt(args: {
  last: FaceScanAttempt | null
  payload: string
  createKey: () => string
}): FaceScanAttempt {
  const { last, payload, createKey } = args
  if (last && last.payload === payload) return last
  return { payload, idempotencyKey: createKey() }
}

export function canStartFaceScan(scanState: "idle" | "scanning" | "sent" | "error"): boolean {
  return scanState !== "scanning"
}
