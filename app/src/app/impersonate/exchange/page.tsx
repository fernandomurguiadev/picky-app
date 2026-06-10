import { Suspense } from "react";
import { ExchangeFlow } from "./exchange-flow";

export default function ImpersonateExchangePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ExchangeFlow />
    </Suspense>
  );
}
