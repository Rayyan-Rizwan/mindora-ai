import type { CSSProperties } from "react";

/**
 * Shared chart palette and axis/tooltip styling so every admin and
 * professional visualisation stays inside the lavender/indigo system.
 * Keep these values in sync with `theme.extend.colors.chart` in
 * `tailwind.config.js`.
 */
export const chartColors = {
  lavender: "#8878ed",
  indigo: "#6366f1",
  sky: "#4f9dff",
  mint: "#34c98f",
  amber: "#e0a44a",
  rose: "#e57384",
  grid: "#ebe7f4",
  axis: "#716d7c",
};

export const chartAxisTick = {
  fontSize: 11,
  fill: chartColors.axis,
};

export const chartGridStroke = chartColors.grid;

export const chartTooltipStyle: CSSProperties = {
  borderRadius: 16,
  border: "1px solid #e8e3f2",
  boxShadow: "0 12px 32px -16px rgba(61,52,126,0.28)",
  fontSize: 12,
  padding: "10px 12px",
};

export const chartTooltipLabelStyle: CSSProperties = {
  color: "#383541",
  fontWeight: 600,
  marginBottom: 4,
};
