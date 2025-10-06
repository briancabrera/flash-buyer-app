import React, { createContext, useContext, useState } from "react";
import type { PaymentPayload } from "../services/payment.service";

type PaymentCtx = {
  payment: PaymentPayload | null;
  setPayment: (p: PaymentPayload | null) => void;
};

const Ctx = createContext<PaymentCtx | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [payment, setPayment] = useState<PaymentPayload | null>(null);
  return <Ctx.Provider value={{ payment, setPayment }}>{children}</Ctx.Provider>;
};

export function usePayment() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePayment must be used within PaymentProvider");
  return ctx;
}
