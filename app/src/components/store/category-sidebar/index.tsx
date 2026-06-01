"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types/catalog";

interface CategorySidebarProps {
  categories: Category[];
  slug: string;
}

export function CategorySidebar({ categories, slug }: CategorySidebarProps) {
  const [activeId, setActiveId] = useState<string>("inicio");

  useEffect(() => {
    // Solo correr en desktop — en mobile el CategoryNav maneja el scrollspy
    if (!window.matchMedia("(min-width: 1024px)").matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      // Línea de disparo: activa cuando el borde superior de la sección
      // cruza la franja 12%-20% del viewport (justo debajo del header sticky).
      { rootMargin: "-12% 0px -80% 0px", threshold: 0 }
    );

    const elements = [
      document.getElementById("inicio"),
      ...categories.map((c) => document.getElementById(`category-${c.id}`)),
    ].filter(Boolean);

    elements.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [categories]);

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveId(id);
    }
  };

  if (!categories.length) return null;

  return (
    <nav className="flex flex-col gap-0.5 py-6">
      <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
        Menú
      </p>
      <a
        href="#inicio"
        onClick={(e) => handleScroll(e, "inicio")}
        className={cn(
          "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          activeId === "inicio"
            ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
            : "text-foreground/70 hover:bg-muted hover:text-foreground"
        )}
      >
        Inicio
      </a>
      {categories.map((cat) => (
        <a
          key={cat.id}
          href={`#category-${cat.id}`}
          onClick={(e) => handleScroll(e, `category-${cat.id}`)}
          className={cn(
            "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            activeId === `category-${cat.id}`
              ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
              : "text-foreground/70 hover:bg-muted hover:text-foreground"
          )}
        >
          {cat.name}
        </a>
      ))}
    </nav>
  );
}
