import { createPosGatewayClient, posGatewayClient } from "./posGatewayClient"

function newIdempotencyKey(): string {
  const c = globalThis.crypto as Crypto | undefined
  return c?.randomUUID?.() ?? `idem_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export type PosFaceScanClient = {
  faceScan: (
    sessionId: string,
    imageBase64: string,
    idempotencyKey?: string,
  ) => Promise<{ data: unknown; status: number; requestId?: string }>
}

export function createPosFaceScanClient(opts: { baseUrl: string; fetchImpl?: typeof fetch }): PosFaceScanClient {
  const client = createPosGatewayClient(opts)
  return {
    faceScan: async (sessionId, imageBase64, idempotencyKey) => {
      return await client.request("POST", `/pos/sessions/${sessionId}/face-scan`, {
        idempotencyKey: idempotencyKey ?? newIdempotencyKey(),
        body: { imageBase64 },
      })
    },
  }
}

export async function faceScan(
  sessionId: string,
  imageBase64: string,
  idempotencyKey?: string,
): Promise<{ data: unknown; status: number; requestId?: string }> {
  return await posFaceScanClient.faceScan(sessionId, imageBase64, idempotencyKey)
}

export const posFaceScanClient = {
  faceScan: async (
    sessionId: string,
    imageBase64: string,
    idempotencyKey?: string,
  ): Promise<{ data: unknown; status: number; requestId?: string }> => {
    return await posGatewayClient.request("POST", `/pos/sessions/${sessionId}/face-scan`, {
      idempotencyKey: idempotencyKey ?? newIdempotencyKey(),
      body: { imageBase64 },
    })
  },
}
