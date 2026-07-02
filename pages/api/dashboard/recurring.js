import { query } from "../../../lib/db";
import { detectRecurring } from "../../../lib/recurring";

export default async function handler(req, res) {
  try {
    const { bank } = req.query;
    const bankFilter = bank && bank !== "All" ? "AND b.name = ?" : "";
    const bankParams = bank && bank !== "All" ? [bank] : [];

    const transactions = await query(`
      SELECT t.merchant_normalized, t.amount, t.txn_date, t.txn_type, t.category, t.raw_description
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      JOIN banks b ON a.bank_id = b.id
      WHERE t.txn_date >= DATE_SUB(CURDATE(), INTERVAL 400 DAY) ${bankFilter}
    `, bankParams);

    const recurring = detectRecurring(transactions).filter(r => r.confidence >= 0.4);
    const subscriptions = recurring.filter(r => r.label === "subscription");
    const bills = recurring.filter(r => r.label === "bill");

    res.status(200).json({
      subscriptions,
      bills,
      monthly_subscription_cost: subscriptions
        .filter(s => s.interval === "monthly")
        .reduce((s, x) => s + x.avg_amount, 0),
      monthly_bill_cost: bills
        .filter(b => b.interval === "monthly")
        .reduce((s, x) => s + x.avg_amount, 0),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
