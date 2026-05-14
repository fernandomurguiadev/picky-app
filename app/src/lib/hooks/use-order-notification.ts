"use client";

import { useEffect, useRef, useCallback } from "react";
import { toast } from "@/components/shared/toast";

// Generar un beep agradable usando Web Audio API para no cargar archivos externos
function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Un "ding" de campana rápido y agudo
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime); // La5
    oscillator.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1); // Subida rápida

    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8); // Fade out de 800ms

    oscillator.start(ctx.currentTime);
    const duration = 0.8;
    oscillator.stop(ctx.currentTime + duration);

    // Liberación explícita post reproducción para evitar sobrepasar los límites de hardware del browser
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, duration * 1000 + 100);
  } catch (err) {
    console.warn("[Notification] No se pudo reproducir sonido:", err);
  }
}

export function useOrderNotification() {
  const hasInteracted = useRef(false);

  useEffect(() => {
    const markInteracted = () => {
      hasInteracted.current = true;
    };

    // Escuchar la primera interacción para desbloquear AudioContext
    window.addEventListener("click", markInteracted, { once: true });
    window.addEventListener("keydown", markInteracted, { once: true });
    window.addEventListener("touchstart", markInteracted, { once: true });

    return () => {
      window.removeEventListener("click", markInteracted);
      window.removeEventListener("keydown", markInteracted);
      window.removeEventListener("touchstart", markInteracted);
    };
  }, []);

  const notifyNewOrder = useCallback((orderNumber: string) => {
    if (hasInteracted.current) {
      playNotificationSound();
    }
    
    toast.success(
      `Nuevo pedido #${orderNumber}`,
      "Ha ingresado un nuevo pedido al sistema."
    );
  }, []);

  return { notifyNewOrder };
}
