import type { ReactNode } from "react";

export const metadata = { title: "Picky Platform Admin" };

export default function PlatformRootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      {children}
    </div>
  );
}
