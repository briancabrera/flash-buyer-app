export function isPosBuyerEnabled(): boolean {
  return import.meta.env.VITE_USE_POS_BUYER === "1" || import.meta.env.VITE_USE_POS_BUYER === "true"
}

