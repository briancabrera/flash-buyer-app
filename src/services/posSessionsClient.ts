import { posGatewayClient } from "./posGatewayClient"

function newIdempotencyKey(): string {
  // browsers modernos / capacitor: crypto.randomUUID
  const c = globalThis.crypto as Crypto | undefined
  return c?.randomUUID?.() ?? `idem_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export async function faceScan(
  sessionId: string,
  payload: { imageBase64: string },
): Promise<{ data: unknown; status: number; requestId?: string }> {
  const res = await posGatewayClient.request("POST", `/pos/sessions/${sessionId}/face-scan`, {
    idempotencyKey: newIdempotencyKey(),
    body: payload,
  })
  return res
}

export async function setReward(
  sessionId: string,
  payload: { reward_id: string },
  idempotencyKey?: string,
): Promise<{ data: unknown; status: number; requestId?: string }> {
  const res = await posGatewayClient.request("POST", `/pos/sessions/${sessionId}/reward`, {
    idempotencyKey: idempotencyKey ?? newIdempotencyKey(),
    body: payload,
  })
  return res
}

export async function redeemSelect(
  sessionId: string,
  payload: { reward_id: string },
  idempotencyKey?: string,
): Promise<{ data: unknown; status: number; requestId?: string }> {
  const res = await posGatewayClient.request("POST", `/pos/sessions/${sessionId}/redeem/select`, {
    idempotencyKey: idempotencyKey ?? newIdempotencyKey(),
    body: payload,
  })
  return res
}

export async function setMode(
  sessionId: string,
  payload: { mode: "PURCHASE" | "REDEEM" },
  idempotencyKey?: string,
): Promise<{ data: unknown; status: number; requestId?: string }> {
  const res = await posGatewayClient.request("POST", `/pos/sessions/${sessionId}/mode`, {
    idempotencyKey: idempotencyKey ?? newIdempotencyKey(),
    body: payload,
  })
  return res
}
