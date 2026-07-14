import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatMoney } from '@/utils/currency';
/**
 * Merge Tailwind classes safely, resolving conflicts.
 * Usage: cn('px-4', condition && 'text-red-500', 'text-sm')
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
/**
 * Format a number as currency.
 */
export function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
    return formatMoney(amount, { currency, numberFormat: locale });
}
/**
 * Format a date string to a readable format.
 */
export function formatDate(dateStr, options) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options,
    });
}
/**
 * Get initials from a full name.
 */
export function getInitials(name, maxChars = 2) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, maxChars);
}
/**
 * Truncate a string to a maximum length.
 */
export function truncate(str, maxLength) {
    if (str.length <= maxLength)
        return str;
    return str.slice(0, maxLength) + '…';
}
