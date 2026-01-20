export type RewardRequestStatus = "sending" | "done" | "error"

export type RewardRequestState = {
  rewardId: string
  idempotencyKey: string
  status: RewardRequestStatus
}

export function getOrCreateRewardRequest(args: {
  map: Map<string, RewardRequestState>
  sessionId: string
  rewardId: string
  createKey: () => string
}): { request: RewardRequestState; shouldSend: boolean } {
  const { map, sessionId, rewardId, createKey } = args
  const existing = map.get(sessionId)
  if (!existing) {
    const request: RewardRequestState = { rewardId, idempotencyKey: createKey(), status: "sending" }
    map.set(sessionId, request)
    return { request, shouldSend: true }
  }

  if (existing.rewardId === rewardId) {
    if (existing.status === "error") {
      existing.status = "sending"
      return { request: existing, shouldSend: true }
    }
    return { request: existing, shouldSend: false }
  }

  const request: RewardRequestState = { rewardId, idempotencyKey: createKey(), status: "sending" }
  map.set(sessionId, request)
  return { request, shouldSend: true }
}

export function markRewardRequestStatus(map: Map<string, RewardRequestState>, sessionId: string, status: RewardRequestStatus) {
  const existing = map.get(sessionId)
  if (existing) existing.status = status
}
