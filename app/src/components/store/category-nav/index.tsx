"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types/catalog";

import { Menu } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface CategoryNavProps {
  categories: Category[];
  slug: string;
}

export function CategoryNav({ categories, slug }: CategoryNavProps) {
  const [activeId, setActiveId] = useState<string>("inicio");
  const [drawerOpen, setDrawerOpen] = useState(false);

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
  }, [categories]);

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
    setDrawerOpen(false); // Close drawer if it was open
  };

  return (
    <nav className="sticky top-14 z-30 border-b bg-background">
      <div className="relative mx-auto max-w-4xl flex items-center">
        {/* Scrollable container */}
        <div className="flex-1 overflow-hidden">
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
            {/* Spacer for fade out effect */}
            <div className="w-8 shrink-0 md:hidden" />
          </div>
        </div>

        {/* Fade out right edge on mobile */}
        <div className="pointer-events-none absolute right-12 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent md:hidden" />

        {/* Drawer Trigger */}
        <div className="shrink-0 pr-2 pl-1 bg-background z-10 md:hidden flex items-center">
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <button 
                className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 shadow-sm"
                aria-label="Ver todas las categorías"
              >
                <Menu className="h-4 w-4" />
              </button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full max-w-md">
                <DrawerHeader>
                  <DrawerTitle>Menú de categorías</DrawerTitle>
                </DrawerHeader>
                <div className="px-4 pb-8 max-h-[60vh] overflow-y-auto">
                  <div className="flex flex-col gap-2">
                    <a
                      href="#inicio"
                      onClick={(e) => handleScroll(e, "inicio")}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-4 py-3 font-medium transition-colors",
                        activeId === "inicio"
                          ? "bg-[var(--color-primary)] text-white"
                          : "bg-muted/50 text-foreground"
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
                          "flex items-center justify-between rounded-lg px-4 py-3 font-medium transition-colors",
                          activeId === `category-${cat.id}`
                            ? "bg-[var(--color-primary)] text-white"
                            : "bg-muted/50 text-foreground"
                        )}
                      >
                        {cat.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </nav>
  );
}
