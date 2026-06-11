"use client";

import { useState, useEffect } from "react";

const SLUGS = [
  "la-burger-co",
  "super-don-jose",
  "verduleria-rosa",
  "pasteleria-vale",
  "ropa-femenina",
  "autos-del-norte",
  "venta-electronica",
  "peluqueria-naty",
  "tu-espacio",
];

export function AnimatedUrl() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLUGS.length);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  const slug = SLUGS[current]!;
  const isOwn = slug === "tu-espacio";
  const fullUrl = `picky.ar/${slug}`;

  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-sky-200/50 w-full max-w-sm overflow-hidden">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-4 pt-4 pb-3 border-b border-zinc-100">
        <div className="h-2.5 w-2.5 rounded-full bg-red-400 shrink-0" />
        <div className="h-2.5 w-2.5 rounded-full bg-amber-400 shrink-0" />
        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shrink-0" />
        {/* Address bar — animated */}
        <div className="ml-2 flex-1 bg-zinc-100 rounded-full px-3 py-1 flex items-center gap-1.5 overflow-hidden">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span
            key={`bar-${current}`}
            className="text-[11px] text-zinc-500 font-mono truncate animate-in fade-in duration-500"
          >
            {fullUrl}
          </span>
        </div>
      </div>

      {/* Big URL display */}
      <div className="px-5 py-5 flex items-baseline gap-0 font-mono font-bold select-none overflow-hidden">
        <span className="text-zinc-400 text-lg sm:text-xl shrink-0">picky.ar/</span>
        <span
          key={`slug-${current}`}
          className={`text-lg sm:text-xl whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-500 ${
            isOwn ? "text-[oklch(0.55_0.22_250)]" : "text-zinc-900"
          }`}
        >
          {slug}
        </span>
      </div>
    </div>
  );
}
