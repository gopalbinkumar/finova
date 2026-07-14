/** Format a value as USD currency for Recharts tooltip */
import { formatMoney } from "@/utils/currency";

export const fmtTooltip = (v, options) =>
    formatMoney(v, { ...options, minimumFractionDigits: 0, maximumFractionDigits: 0 });
export const fmtTooltipFull = (v, options) => formatMoney(v, options);
export const fmtCurrency = (n, options) => formatMoney(n, options);
export const fmtCurrencyShort = (n, options) =>
    formatMoney(n, { ...options, minimumFractionDigits: 0, maximumFractionDigits: 0 });
