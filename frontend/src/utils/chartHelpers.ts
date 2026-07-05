//  tsconfig.json has strict: true which causes issues with Recharts formatter types.
//  Disable noImplicitAny for Recharts props by using `any` formatter helpers.

/** Format a value as USD currency for Recharts tooltip */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fmtTooltip = (v: any) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(v))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fmtTooltipFull = (v: any) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(v))

export const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

export const fmtCurrencyShort = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
