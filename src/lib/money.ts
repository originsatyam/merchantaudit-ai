/**
 * RemitLens Money & Formatting Primitives
 * Strictly integer minor units to eliminate floating-point arithmetic errors.
 */

import { MoneyValue } from './types';

/**
 * Format integer minor units (paise/cents) to human readable currency string.
 * Strictly adheres to Indian grouping (lakhs/crores) for INR and Western grouping for other currencies.
 */
export function formatMoney(minorUnits: number, currency: string, options: { showSymbol?: boolean } = {}): string {
  const isNegative = minorUnits < 0;
  const absMinor = Math.abs(minorUnits);
  const units = Math.floor(absMinor / 100);
  const cents = absMinor % 100;
  const centsStr = cents.toString().padStart(2, '0');

  let formattedUnits = '';
  if (currency === 'INR') {
    // Indian numbering system (last 3 digits, then groups of 2 digits)
    const unitsStr = units.toString();
    if (unitsStr.length <= 3) {
      formattedUnits = unitsStr;
    } else {
      const lastThree = unitsStr.slice(-3);
      const remaining = unitsStr.slice(0, -3);
      const formattedRemaining = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
      formattedUnits = `${formattedRemaining},${lastThree}`;
    }
  } else {
    // Standard Western grouping (groups of 3 digits)
    formattedUnits = units.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  const sign = isNegative ? '-' : '';
  const numPart = `${sign}${formattedUnits}.${centsStr}`;

  if (options.showSymbol) {
    const symbolMap: Record<string, string> = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£',
    };
    const symbol = symbolMap[currency] || currency;
    return `${symbol}${numPart}`;
  }

  return `${currency} ${numPart}`;
}

/**
 * Renders fallback placeholder when a financial field is missing in source files.
 * PRD §7B: "Missing fields must remain missing. Never coerce to 0.00 or N/A."
 */
export function formatMoneyOrMissing(money?: MoneyValue | null): string {
  if (!money || money.minorUnits === null || money.minorUnits === undefined) {
    return 'Not provided';
  }
  return formatMoney(money.minorUnits, money.currency);
}

/**
 * Integer minor units addition
 */
export function addMoney(a: MoneyValue, b: MoneyValue): MoneyValue {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot add mismatched currencies: ${a.currency} and ${b.currency}`);
  }
  return {
    minorUnits: a.minorUnits + b.minorUnits,
    currency: a.currency,
  };
}

/**
 * Integer minor units subtraction
 */
export function subtractMoney(a: MoneyValue, b: MoneyValue): MoneyValue {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot subtract mismatched currencies: ${a.currency} and ${b.currency}`);
  }
  return {
    minorUnits: a.minorUnits - b.minorUnits,
    currency: a.currency,
  };
}

/**
 * Calculate implied exchange rate between foreign currency settlement and INR bank credit
 */
export function calculateImpliedFxRate(foreignMinor: number, inrMinor: number): number {
  if (foreignMinor <= 0) return 0;
  const foreignMajor = foreignMinor / 100;
  const inrMajor = inrMinor / 100;
  return Number((inrMajor / foreignMajor).toFixed(2));
}
