"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function ScrollReset() {
  const searchParams = useSearchParams();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [searchParams]);

  return null;
}
