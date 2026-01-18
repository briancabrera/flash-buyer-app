import { posGatewayClient } from "./posGatewayClient"

export type PosReward = {
  id: string
  merchant_id?: string
  name: string
  description?: string | null
  cost_points: number
  status?: "ACTIVE" | "DISABLED"
  created_at?: string
}

export type PosRewardsListResponse = {
  items: PosReward[]
}

export async function listRewards(token: string): Promise<PosReward[]> {
  const { data } = await posGatewayClient.request<PosRewardsListResponse>("GET", "/pos/rewards", { token })
  return data.items ?? []
}

export async function listRewardsWithMeta(
  token: string,
): Promise<{ items: PosReward[]; status: number; requestId?: string }> {
  const res = await posGatewayClient.request<PosRewardsListResponse>("GET", "/pos/rewards", { token })
  return { items: res.data.items ?? [], status: res.status, requestId: res.requestId }
}

