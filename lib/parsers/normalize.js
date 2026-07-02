// Strips bank-specific noise (UPI refs, txn IDs, dates baked into description)
// so the same merchant reads identically regardless of which bank's statement it came from.

const NOISE_PATTERNS = [
  /\bUPI\b/gi,
  /\bIMPS\b/gi,
  /\bNEFT\b/gi,
  /\bRTGS\b/gi,
  /\bREF\s?NO\.?\s?\d+/gi,
  /\d{10,}/g,          // long numeric refs / phone-like IDs
  /\d{2}[-/]\d{2}[-/]\d{2,4}/g, // embedded dates
  /@[a-z0-9.]+/gi,      // UPI VPA handles like @okhdfcbank
  /[-_/]{2,}/g,
];

const CATEGORY_RULES = [
  { pattern: /netflix|hotstar|prime video|sonyliv|zee5/i, category: "Entertainment", label: "subscription" },
  { pattern: /spotify|gaana|jiosaavn|youtube premium/i, category: "Entertainment", label: "subscription" },
  { pattern: /electricity|bijli|bescom|tneb|power/i, category: "Utilities", label: "bill" },
  { pattern: /airtel|jio|vodafone|vi\s|broadband|wifi/i, category: "Utilities", label: "bill" },
  { pattern: /swiggy|zomato|eatsure/i, category: "Food Delivery", label: null },
  { pattern: /amazon|flipkart|myntra|ajio/i, category: "Shopping", label: null },
  { pattern: /uber|ola|rapido/i, category: "Transport", label: null },
  { pattern: /rent|landlord/i, category: "Housing", label: "bill" },
  { pattern: /gym|cult\.fit|fitness/i, category: "Health", label: "subscription" },
  { pattern: /emi|loan/i, category: "Loan/EMI", label: "bill" },
  { pattern: /insurance|lic|policybazaar/i, category: "Insurance", label: "bill" },
  { pattern: /salary|payroll/i, category: "Income", label: null },
];

export function normalizeMerchant(rawDescription) {
  let cleaned = rawDescription || "";
  for (const pattern of NOISE_PATTERNS) {
    cleaned = cleaned.replace(pattern, " ");
  }
  cleaned = cleaned.replace(/\s+/g, " ").trim().toUpperCase();
  // Collapse to first 3-4 meaningful tokens — enough to identify merchant, not the noise after it
  const tokens = cleaned.split(" ").filter(t => t.length > 1);
  return tokens.slice(0, 4).join(" ") || "UNKNOWN";
}

export function categorize(rawDescription) {
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(rawDescription)) {
      return { category: rule.category, recurringHint: rule.label };
    }
  }
  return { category: "Uncategorized", recurringHint: null };
}
