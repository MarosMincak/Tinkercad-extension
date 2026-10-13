export const defaults = Object.freeze({
  enabled: true,
  auto: true,
  delay: 120,
  threshold: 2,
});
export function normalizeSettings(value) {
  const v = value && typeof value === "object" ? value : {};
  return {
    enabled: typeof v.enabled === "boolean" ? v.enabled : true,
    auto: typeof v.auto === "boolean" ? v.auto : true,
    delay: Number.isFinite(v.delay)
      ? Math.min(600, Math.max(0, Math.round(v.delay)))
      : 120,
    threshold: Number.isFinite(v.threshold)
      ? Math.min(4, Math.max(1, Math.round(v.threshold)))
      : 2,
  };
}
