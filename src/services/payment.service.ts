// src/services/paymentApi.ts
import { http } from "./http";

export type PaymentPayload = {
  amount: string;
  currency: string;   // "UYU", "USD", etc.
  pin_required: boolean;
  user_name: string;
};

export async function fetchCurrentPayment(): Promise<PaymentPayload> {
  const { data } = await http.get<PaymentPayload>("/api/payment", {
    // evitar caches agresivos de proxies
    headers: { "Cache-Control": "no-cache" },
  });
  return data;
}

export async function payCurrentPayment(): Promise<void> {
  await http.put("/api/payment/pay");
}
