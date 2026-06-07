"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types/catalog";

interface MobileCategoryButtonProps {
  categories: Category[];
  slug: string;
}

export function MobileCategoryButton({ categories }: MobileCategoryButtonProps) {
  const [open, setOpen] = useState(false);

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 130;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          aria-label="Ver categorías"
        >
          <Menu className="h-5 w-5" />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle>Categorías</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 max-h-[60vh] overflow-y-auto">
            <div className="flex flex-col gap-2">
              <a
                href="#inicio"
                onClick={(e) => handleScroll(e, "inicio")}
                className={cn(
                  "flex items-center justify-between rounded-lg px-4 py-3 font-medium transition-colors",
                  "bg-muted/50 text-foreground hover:bg-muted"
                )}
              >
                Inicio
              </a>
              {categories.map((cat) => (
                <a
                  key={cat.id}
                  href={`#category-${cat.id}`}
                  onClick={(e) => handleScroll(e, `category-${cat.id}`)}
                  className="flex items-center justify-between rounded-lg px-4 py-3 font-medium bg-muted/50 text-foreground transition-colors hover:bg-muted"
                >
                  {cat.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
