import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-6xl">🏪</div>
      <h1 className="text-2xl font-bold">Tienda no encontrada</h1>
      <p className="max-w-sm text-muted-foreground">
        No encontramos ninguna tienda en esta dirección. Verificá que el enlace
        sea correcto o pedile al comercio que te envíe el link de nuevo.
      </p>
      <Link
        href="/"
        className="mt-2 text-sm font-medium text-[var(--color-primary)] underline-offset-4 hover:underline"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
