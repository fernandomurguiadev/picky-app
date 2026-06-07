"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useCategoryNavStore } from "@/lib/stores/category-nav.store";
import type { Category } from "@/lib/types/catalog";

interface CategoryNavProps {
  categories: Category[];
}

export function CategoryNav({ categories }: CategoryNavProps) {
  const { activeId, setActiveId, reset } = useCategoryNavStore();

  useEffect(() => {
    reset();
    return () => reset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Scrollspy logic
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0.1 }
    );

    const elements = [
      document.getElementById("inicio"),
      ...categories.map((c) => document.getElementById(`category-${c.id}`)),
    ].filter(Boolean);

    elements.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [categories, setActiveId]);

  // Auto-scroll the horizontal nav to keep the active item visible
  useEffect(() => {
    if (!activeId) return;
    const activeLink = document.getElementById(`nav-link-${activeId}`);
    if (activeLink) {
      activeLink.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeId]);

  if (!categories.length) return null;

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      // Cálculo manual para garantizar que no tape el header (130px de offset)
      const y = el.getBoundingClientRect().top + window.scrollY - 130;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveId(id);
    }
  };

  return (
    <nav className="sticky top-14 z-30 border-b bg-background">
      <div className="relative mx-auto max-w-4xl">
        <div className="flex flex-nowrap gap-x-1.5 gap-y-2 overflow-x-auto px-4 py-2 scrollbar-none custom-scrollbar pb-3 -mb-1">
          <a
            id="nav-link-inicio"
            href="#inicio"
            onClick={(e) => handleScroll(e, "inicio")}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              activeId === "inicio"
                ? "bg-[var(--color-primary)] text-white"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            Inicio
          </a>
          {categories.map((cat) => (
            <a
              id={`nav-link-category-${cat.id}`}
              key={cat.id}
              href={`#category-${cat.id}`}
              onClick={(e) => handleScroll(e, `category-${cat.id}`)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                activeId === `category-${cat.id}`
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {cat.name}
            </a>
          ))}
          <div className="w-4 shrink-0" />
        </div>

        {/* Fade out right edge */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent" />
      </div>
    </nav>
  );
}
