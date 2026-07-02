import dayjs from "dayjs";
import { categorize } from "./parsers/normalize";

// Groups transactions by merchant, checks if the gaps between occurrences
// cluster around a fixed interval (weekly/monthly/yearly), and scores confidence.
// This is what turns a flat transaction list into "you have 7 subscriptions costing ₹4,200/mo".

const INTERVAL_BUCKETS = [
  { label: "weekly", days: 7, tolerance: 2 },
  { label: "monthly", days: 30, tolerance: 4 },
  { label: "quarterly", days: 90, tolerance: 7 },
  { label: "yearly", days: 365, tolerance: 15 },
];

function amountsSimilar(a, b, tolerancePct = 0.05) {
  return Math.abs(a - b) <= Math.max(a, b) * tolerancePct;
}

export function detectRecurring(transactions) {
  // transactions: [{ merchant_normalized, amount, txn_date, category }]
  const groups = {};
  for (const t of transactions) {
    if (t.txn_type !== "debit") continue;
    const key = t.merchant_normalized;
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }

  const results = [];

  for (const [merchant, txns] of Object.entries(groups)) {
    if (txns.length < 2) continue;

    // Sub-group by similar amount, since a merchant might have multiple unrelated charges
    const amountClusters = [];
    for (const t of txns) {
      let cluster = amountClusters.find(c => amountsSimilar(c.avg, parseFloat(t.amount)));
      if (cluster) {
        cluster.items.push(t);
        cluster.avg = cluster.items.reduce((s, x) => s + parseFloat(x.amount), 0) / cluster.items.length;
      } else {
        amountClusters.push({ avg: parseFloat(t.amount), items: [t] });
      }
    }

    for (const cluster of amountClusters) {
      if (cluster.items.length < 2) continue;
      const sorted = cluster.items.sort((a, b) => new Date(a.txn_date) - new Date(b.txn_date));
      const gaps = [];
      for (let i = 1; i < sorted.length; i++) {
        gaps.push(dayjs(sorted[i].txn_date).diff(dayjs(sorted[i - 1].txn_date), "day"));
      }
      const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;

      const bucket = INTERVAL_BUCKETS.find(b => Math.abs(avgGap - b.days) <= b.tolerance);
      if (!bucket) continue;

      // Quarterly/yearly buckets have wide tolerance windows (±7/±15 days), so two
      // coincidentally-spaced one-off purchases (e.g. two Uber rides 90 days apart)
      // can false-positive as "recurring". Require more evidence before trusting those.
      const minOccurrences = (bucket.label === "quarterly" || bucket.label === "yearly") ? 3 : 2;
      if (sorted.length < minOccurrences) continue;

      // Confidence: how tightly gaps cluster around the bucket's ideal interval, plus occurrence count
      const variance = gaps.reduce((s, g) => s + Math.abs(g - bucket.days), 0) / gaps.length;
      const regularityScore = Math.max(0, 1 - variance / bucket.days);
      const occurrenceScore = Math.min(1, sorted.length / 4);
      const confidence = Math.round((regularityScore * 0.7 + occurrenceScore * 0.3) * 100) / 100;

      // Use the category's own bill/subscription hint (e.g. Utilities -> bill,
      // Entertainment -> subscription) instead of guessing from amount alone.
      const { recurringHint } = categorize(sorted[0].raw_description || merchant);
      const label = recurringHint || (bucket.label === "yearly" ? "subscription" : (cluster.avg > 3000 ? "bill" : "subscription"));

      results.push({
        merchant,
        avg_amount: Math.round(cluster.avg * 100) / 100,
        interval: bucket.label,
        interval_days: bucket.days,
        occurrences: sorted.length,
        confidence,
        last_seen: sorted[sorted.length - 1].txn_date,
        category: sorted[0].category || "Uncategorized",
        label,
      });
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}
