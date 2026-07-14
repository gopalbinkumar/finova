import { useMemo } from "react";
import { useAuthStore } from "@/store/authStore";

export const CURRENCIES = [
    "USD",
    "EUR",
    "GBP",
    "JPY",
    "IDR",
    "SGD",
    "AUD",
    "CAD",
    "INR",
    "CNY",
];

export const NUMBER_FORMATS = [
    { value: "id-ID", label: "10.000,00" },
    { value: "en-US", label: "10,000.00" },
];

const CURRENCY_SYMBOLS = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    IDR: "Rp",
    SGD: "S$",
    AUD: "A$",
    CAD: "C$",
    INR: "₹",
    CNY: "¥",
};

const DEFAULT_CURRENCY = "USD";
const DEFAULT_NUMBER_FORMAT = "en-US";
const DEFAULT_SHOW_DECIMALS = true;

const normalizeNumber = (value) => {
    const number = Number(value);

    return Number.isFinite(number) ? number : 0;
};

export const getCurrencySymbol = (currency = DEFAULT_CURRENCY) =>
    CURRENCY_SYMBOLS[String(currency).toUpperCase()] || String(currency).toUpperCase();

export const getUserCurrencyPreferences = (user) => ({
    currency: String(user?.currency || DEFAULT_CURRENCY).toUpperCase(),
    numberFormat: NUMBER_FORMATS.some(
        (format) => format.value === user?.number_format,
    )
        ? user.number_format
        : DEFAULT_NUMBER_FORMAT,
    showDecimals:
        typeof user?.show_decimals === "boolean"
            ? user.show_decimals
            : DEFAULT_SHOW_DECIMALS,
});

export const formatMoney = (
    value,
    {
        currency = DEFAULT_CURRENCY,
        numberFormat = DEFAULT_NUMBER_FORMAT,
        showDecimals = DEFAULT_SHOW_DECIMALS,
        minimumFractionDigits,
        maximumFractionDigits,
    } = {},
) => {
    const number = normalizeNumber(value);
    const sign = number < 0 ? "-" : "";
    const fractionDigits = showDecimals ? 2 : 0;
    const formattedNumber = new Intl.NumberFormat(numberFormat, {
        minimumFractionDigits: minimumFractionDigits ?? fractionDigits,
        maximumFractionDigits: maximumFractionDigits ?? fractionDigits,
    }).format(Math.abs(number));

    return `${sign}${getCurrencySymbol(currency)}${formattedNumber}`;
};

export const formatMoneyCompact = (
    value,
    {
        currency = DEFAULT_CURRENCY,
        numberFormat = DEFAULT_NUMBER_FORMAT,
        showDecimals = DEFAULT_SHOW_DECIMALS,
    } = {},
) => {
    const number = normalizeNumber(value);
    const abs = Math.abs(number);
    const sign = number < 0 ? "-" : "";
    const symbol = getCurrencySymbol(currency);

    if (abs >= 1_000_000_000) {
        return `${sign}${symbol}${new Intl.NumberFormat(numberFormat, {
            maximumFractionDigits: 1,
        }).format(abs / 1_000_000_000)}B`;
    }

    if (abs >= 1_000_000) {
        return `${sign}${symbol}${new Intl.NumberFormat(numberFormat, {
            maximumFractionDigits: 1,
        }).format(abs / 1_000_000)}M`;
    }

    if (abs >= 1_000) {
        return `${sign}${symbol}${new Intl.NumberFormat(numberFormat, {
            maximumFractionDigits: 1,
        }).format(abs / 1_000)}k`;
    }

    return formatMoney(number, {
        currency,
        numberFormat,
        showDecimals,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
};

export function useCurrencyFormatter() {
    const user = useAuthStore((state) => state.user);
    const preferences = getUserCurrencyPreferences(user);

    return useMemo(
        () => ({
            ...preferences,
            symbol: getCurrencySymbol(preferences.currency),
            formatCurrency: (value, options = {}) =>
                formatMoney(value, { ...preferences, ...options }),
            formatCurrencyCompact: (value, options = {}) =>
                formatMoneyCompact(value, { ...preferences, ...options }),
        }),
        [preferences.currency, preferences.numberFormat, preferences.showDecimals],
    );
}
