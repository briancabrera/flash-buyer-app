export function shouldAutoScan(args: {
  activeSessionId: string | null
  activeSessionStatus: string | null
  lastAutoScanSessionId: string | null
}): boolean {
  const { activeSessionId, activeSessionStatus, lastAutoScanSessionId } = args
  if (!activeSessionId) return false
  if (activeSessionStatus !== "WAITING_FACE") return false
  if (lastAutoScanSessionId === activeSessionId) return false
  return true
}
