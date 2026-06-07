/** Returns '#fff' or '#000' based on YIQ luminance of a hex color. */
export function getContrastColor(hex: string): "#fff" | "#000" {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 >= 128 ? "#000" : "#fff";
}

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

/** Validates a hex color string. Returns fallback if invalid. */
export function safeHex(value: unknown, fallback: string): string {
  return typeof value === "string" && HEX_REGEX.test(value) ? value : fallback;
}
