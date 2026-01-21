import { posGatewayClient } from "./posGatewayClient"

export type PosReward = {
  id: string
  merchant_id?: string
  name: string
  description?: string | null
  cost_points: number
  status?: "ACTIVE" | "DISABLED"
  created_at?: string
  /**
   * When session_id is provided to /pos/rewards, backend may compute per-user redeemability.
   * null/undefined means "unknown" (treat as redeemable in UI).
   */
  can_redeem?: boolean | null
}

export type PosRewardsListResponse = {
  items: PosReward[]
}

export async function listRewards(token: string, sessionId?: string): Promise<PosReward[]> {
  const path = sessionId ? `/pos/rewards?session_id=${encodeURIComponent(sessionId)}` : "/pos/rewards"
  const { data } = await posGatewayClient.request<PosRewardsListResponse>("GET", path, { token })
  return data.items ?? []
}

export async function listRewardsWithMeta(
  token: string,
  sessionId?: string,
): Promise<{ items: PosReward[]; status: number; requestId?: string }> {
  const path = sessionId ? `/pos/rewards?session_id=${encodeURIComponent(sessionId)}` : "/pos/rewards"
  const res = await posGatewayClient.request<PosRewardsListResponse>("GET", path, { token })
  return { items: res.data.items ?? [], status: res.status, requestId: res.requestId }
}

