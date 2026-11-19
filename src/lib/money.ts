const CURRENCIES = ["USD", "EUR", "GBP", "CAD"] as const;

export type CurrencyCode = (typeof CURRENCIES)[number];

const SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "CA$",
};

export function isCurrency(value: string): value is CurrencyCode {
  return (CURRENCIES as readonly string[]).includes(value);
}

export function parseMajorToMinor(input: string) {
  const trimmed = input.trim();
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(trimmed)) {
    throw new MoneyError("Enter a price like 24.50, with dollars and at most two cents.");
  }
  const [whole, fraction = ""] = trimmed.split(".");
  const cents = fraction.padEnd(2, "0");
  const minor = Number(whole) * 100 + Number(cents);
  if (!Number.isSafeInteger(minor) || minor < 0 || minor > 100_000_000) {
    throw new MoneyError("Enter a price between 0.01 and 1,000,000.00.");
  }
  return minor;
}

export function sumMinor(values: number[]) {
  return values.reduce((total, value) => {
    if (!Number.isSafeInteger(value)) throw new MoneyError("A line total was not a whole number of cents.");
    const next = total + value;
    if (!Number.isSafeInteger(next)) throw new MoneyError("Those prices add up past what Rewind can store.");
    return next;
  }, 0);
}

export function multiplyMinor(unitMinor: number, quantity: number) {
  if (!Number.isSafeInteger(unitMinor) || !Number.isInteger(quantity)) {
    throw new MoneyError("Price and quantity need to be whole numbers.");
  }
  const next = unitMinor * quantity;
  if (!Number.isSafeInteger(next)) throw new MoneyError("That line total is too large.");
  return next;
}

export function formatMinor(minor: number, currency: string) {
  if (!Number.isSafeInteger(minor)) return "—";
  const negative = minor < 0;
  const absolute = Math.abs(minor);
  const whole = Math.floor(absolute / 100).toLocaleString("en-US");
  const cents = String(absolute % 100).padStart(2, "0");
  const symbol = isCurrency(currency) ? SYMBOLS[currency] : `${currency} `;
  return `${negative ? "-" : ""}${symbol}${whole}.${cents}`;
}

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MoneyError";
  }
}
