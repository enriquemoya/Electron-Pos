export const TOKENS = {
  PRIMARY_COLOR: "#f59e0b",
  BACKGROUND_COLOR: "#0b0f14",
  SURFACE_COLOR: "#ffffff",
  TEXT_COLOR: "#111827",
  MUTED_TEXT_COLOR: "#1f2937",
  BORDER_COLOR: "#1f2937",
  SUCCESS_COLOR: "#86efac",
  WARNING_COLOR: "#fcd34d",
  ERROR_COLOR: "#fca5a5"
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32
} as const;

export const TYPOGRAPHY = {
  fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  h1: { fontSize: 24, fontWeight: 700, lineHeight: "32px" },
  h2: { fontSize: 18, fontWeight: 600, lineHeight: "26px" },
  body: { fontSize: 14, fontWeight: 400, lineHeight: "20px" },
  small: { fontSize: 12, fontWeight: 400, lineHeight: "18px" }
} as const;

export const RADII = {
  sm: 8,
  md: 12,
  lg: 16
} as const;
