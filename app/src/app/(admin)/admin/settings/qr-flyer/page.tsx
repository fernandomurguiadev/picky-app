"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SkeletonLoader } from "@/components/shared/skeleton-loader";
import { useStoreSettings, useUpdateStoreSettings } from "@/lib/hooks/admin/use-store-settings";
import { useQrFlyerDownload } from "@/lib/hooks/admin/use-qr-flyer";
import { toast } from "@/components/shared/toast";
import { Download, QrCode } from "lucide-react";

export default function QrFlyerPage() {
  const { data: settings, isLoading } = useStoreSettings();
  const updateMutation = useUpdateStoreSettings();
  const { download, isDownloading } = useQrFlyerDownload();

  const [ctaText, setCtaText] = useState("");
  const [ctaDirty, setCtaDirty] = useState(false);
  const [includeLogo, setIncludeLogo] = useState(true);
  const [useColors, setUseColors] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const storeName = settings?.tenant?.name ?? "";
  const storeSlug = settings?.tenant?.slug ?? "";
  const brandPrimary = settings?.primaryColor ?? "#000000";
  const brandAccent = settings?.accentColor ?? "#ffffff";
  const logoUrl = settings?.logoUrl ?? null;
  const merchantOrigin =
    process.env.NEXT_PUBLIC_MERCHANT_ORIGIN ?? "https://picky.ar";
  const storeUrl = storeSlug ? `${merchantOrigin}/${storeSlug}` : "";

  // Colores activos según las opciones seleccionadas
  const activePrimary = useColors ? brandPrimary : "#000000";
  const activeAccent = useColors ? brandAccent : "#ffffff";

  // Sincronizar CTA desde settings al cargar
  useEffect(() => {
    if (settings) {
      setCtaText(settings.customCtaText ?? "¡Escaneá y hacé tu pedido!");
      setCtaDirty(false);
    }
  }, [settings]);

  // Si no hay logo configurado, deshabilitar la opción de incluirlo
  useEffect(() => {
    if (!logoUrl) setIncludeLogo(false);
  }, [logoUrl]);

  // Regenerar QR preview cuando cambian URL o color
  useEffect(() => {
    if (!storeUrl) return;
    QRCode.toDataURL(storeUrl, {
      width: 200,
      margin: 1,
      color: { dark: activePrimary, light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [storeUrl, activePrimary]);

  const handleCtaChange = (value: string) => {
    setCtaText(value);
    setCtaDirty(value !== (settings?.customCtaText ?? "¡Escaneá y hacé tu pedido!"));
  };

  const handleSaveCta = async () => {
    try {
      await updateMutation.mutateAsync({ customCtaText: ctaText || null });
      setCtaDirty(false);
      toast.success("Texto CTA guardado");
    } catch {
      toast.error("Error al guardar el texto");
    }
  };

  if (isLoading) return <SkeletonLoader rows={6} columns={1} />;

  return (
    <div className="space-y-6">
      {/* ── Opciones del flyer ────────────────────────────────────────── */}
      <section className="rounded-xl border border-border p-6 space-y-5 bg-card">
        <h2 className="font-semibold text-base">Opciones del flyer</h2>

        {/* Toggle: colores de marca */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Usar colores de marca</Label>
            <p className="text-xs text-muted-foreground">
              Aplicá el color primario y de acento de tu tema. Desactivado imprime en blanco y negro.
            </p>
          </div>
          <Switch
            checked={useColors}
            onCheckedChange={setUseColors}
          />
        </div>

        <hr className="border-border" />

        {/* Toggle: logo */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label className={`text-sm font-medium ${!logoUrl ? "text-muted-foreground" : ""}`}>
              Incluir logo del comercio
            </Label>
            <p className="text-xs text-muted-foreground">
              {logoUrl
                ? "Agrega tu logo en la parte superior del flyer."
                : "No tenés logo cargado. Podés subirlo en Información general."}
            </p>
          </div>
          <Switch
            checked={includeLogo}
            onCheckedChange={setIncludeLogo}
            disabled={!logoUrl}
          />
        </div>
      </section>

      {/* ── Preview del flyer ─────────────────────────────────────────── */}
      <section className="rounded-xl border border-border p-6 space-y-4 bg-card">
        <div className="flex items-center gap-2">
          <QrCode className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-base">Vista previa</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Así se verá el flyer imprimible según las opciones seleccionadas.
        </p>

        <div className="flex justify-center py-4">
          <div
            className="w-[240px] rounded-2xl p-3 shadow-xl transition-colors duration-300"
            style={{ backgroundColor: activePrimary }}
          >
            <div
              className="rounded-xl p-4 flex flex-col items-center gap-3 transition-colors duration-300"
              style={{ backgroundColor: activeAccent }}
            >
              {/* Logo — solo si está activado y existe */}
              {includeLogo && logoUrl && (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="w-14 h-14 rounded-lg object-cover"
                />
              )}

              {/* Nombre */}
              <p
                className="font-bold text-sm text-center leading-tight transition-colors duration-300"
                style={{ color: activePrimary }}
              >
                {storeName || "Nombre del comercio"}
              </p>

              {/* QR generado con qrcode */}
              <div className="rounded-lg overflow-hidden shadow-sm">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    className="w-[120px] h-[120px]"
                  />
                ) : (
                  <div
                    className="w-[120px] h-[120px] flex items-center justify-center rounded-lg bg-white"
                  >
                    <QrCode className="w-8 h-8 opacity-30" />
                  </div>
                )}
              </div>

              {/* CTA */}
              <p
                className="font-semibold text-[11px] text-center leading-tight transition-colors duration-300"
                style={{ color: activePrimary }}
              >
                {ctaText || "¡Escaneá y hacé tu pedido!"}
              </p>

              {/* URL hint */}
              <p
                className="text-[9px] text-center opacity-60 transition-colors duration-300"
                style={{ color: activePrimary }}
              >
                {storeUrl || "picky.ar/tu-negocio"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Texto CTA ─────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border p-6 space-y-4 bg-card">
        <h2 className="font-semibold text-base">Texto del flyer</h2>
        <p className="text-xs text-muted-foreground -mt-2">
          Aparece debajo del QR. Máximo 30 caracteres.
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="cta-text">Llamada a la acción (CTA)</Label>
          <Input
            id="cta-text"
            value={ctaText}
            maxLength={30}
            onChange={(e) => handleCtaChange(e.target.value)}
            placeholder="¡Escaneá y hacé tu pedido!"
            className="rounded-lg"
          />
          <p className="text-[11px] text-muted-foreground text-right">
            {ctaText.length}/30
          </p>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleSaveCta}
            disabled={updateMutation.isPending || !ctaDirty}
            className="rounded-xl px-6"
          >
            {updateMutation.isPending ? "Guardando..." : "Guardar texto"}
          </Button>
        </div>
      </section>

      {/* ── Descarga ──────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border p-6 space-y-3 bg-card">
        <h2 className="font-semibold text-base">Descargar flyer</h2>
        <p className="text-sm text-muted-foreground">
          PDF listo para imprimir en formato A5. Pegalo en tu mostrador, mesa o vidriera.
        </p>
        <Button
          onClick={() => download(storeName, { includeLogo, useColors })}
          disabled={isDownloading || !storeSlug}
          className="w-full sm:w-auto rounded-xl px-6 gap-2"
        >
          <Download className="w-4 h-4" />
          {isDownloading ? "Generando PDF..." : "Descargar Flyer PDF"}
        </Button>
        {!storeSlug && (
          <p className="text-xs text-destructive">
            Tu tienda no tiene URL configurada todavía.
          </p>
        )}
      </section>
    </div>
  );
}
