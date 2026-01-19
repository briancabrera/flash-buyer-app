import { posGatewayClient } from "./posGatewayClient"

function newIdempotencyKey(): string {
  // browsers modernos / capacitor: crypto.randomUUID
  const c = globalThis.crypto as Crypto | undefined
  return c?.randomUUID?.() ?? `idem_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export async function faceScan(
  sessionId: string,
  payload: { imageBase64: string },
  token: string,
): Promise<{ data: unknown; status: number; requestId?: string }> {
  const res = await posGatewayClient.request("POST", `/pos/sessions/${sessionId}/face-scan`, {
    token,
    idempotencyKey: newIdempotencyKey(),
    body: payload,
  })
  return res
}

export async function setReward(
  sessionId: string,
  payload: { reward_id: string },
  token: string,
  idempotencyKey?: string,
): Promise<{ data: unknown; status: number; requestId?: string }> {
  const res = await posGatewayClient.request("POST", `/pos/sessions/${sessionId}/reward`, {
    token,
    idempotencyKey: idempotencyKey ?? newIdempotencyKey(),
    body: payload,
  })
  return res
}

export async function redeemSelect(
  sessionId: string,
  payload: { reward_id: string },
  token: string,
  idempotencyKey?: string,
): Promise<{ data: unknown; status: number; requestId?: string }> {
  const res = await posGatewayClient.request("POST", `/pos/sessions/${sessionId}/redeem/select`, {
    token,
    idempotencyKey: idempotencyKey ?? newIdempotencyKey(),
    body: payload,
  })
  return res
}

