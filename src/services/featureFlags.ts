export function isPosBuyerEnabled(): boolean {
  return import.meta.env.VITE_USE_POS_BUYER === "1" || import.meta.env.VITE_USE_POS_BUYER === "true"
}

export function isBuyerAutoScanEnabled(): boolean {
  return import.meta.env.VITE_BUYER_AUTO_SCAN === "1" || import.meta.env.VITE_BUYER_AUTO_SCAN === "true"
}

