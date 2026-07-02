import { query } from "../../../lib/db";

export default async function handler(req, res) {
  try {
    const { bank } = req.query;
    const bankFilter = bank && bank !== "All" ? "AND b.name = ?" : "";
    const bankParams = bank && bank !== "All" ? [bank] : [];

    // Anchor "last 30 days" to the most recent transaction date in scope, not to
    // wall-clock today — statement data can lag or predate today, and pinning to
    // CURDATE() would silently drop transactions like a salary credit that falls
    // just outside a window measured from the real current date.
    const anchorRows = await query(`
      SELECT MAX(t.txn_date) AS anchor
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      JOIN banks b ON a.bank_id = b.id
      WHERE 1=1 ${bankFilter}
    `, bankParams);
    const anchor = anchorRows[0]?.anchor;

    if (!anchor) {
      return res.status(200).json({ total_spend: 0, total_income: 0, savings_rate: 0, by_category: [], by_bank: [] });
    }

    const windowParams = [anchor, ...bankParams];

    const totals = await query(`
      SELECT
        SUM(CASE WHEN t.txn_type = 'debit' THEN t.amount ELSE 0 END) AS total_spend,
        SUM(CASE WHEN t.txn_type = 'credit' THEN t.amount ELSE 0 END) AS total_income
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      JOIN banks b ON a.bank_id = b.id
      WHERE t.txn_date >= DATE_SUB(?, INTERVAL 30 DAY) AND t.txn_date <= ? ${bankFilter}
    `, [anchor, anchor, ...bankParams]);

    const byCategory = await query(`
      SELECT t.category, SUM(t.amount) AS total
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      JOIN banks b ON a.bank_id = b.id
      WHERE t.txn_type = 'debit' AND t.txn_date >= DATE_SUB(?, INTERVAL 30 DAY) AND t.txn_date <= ? ${bankFilter}
      GROUP BY t.category
      ORDER BY total DESC
    `, [anchor, anchor, ...bankParams]);

    const byBank = await query(`
      SELECT b.name AS bank, SUM(t.amount) AS total
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      JOIN banks b ON a.bank_id = b.id
      WHERE t.txn_type = 'debit' AND t.txn_date >= DATE_SUB(?, INTERVAL 30 DAY) AND t.txn_date <= ? ${bankFilter}
      GROUP BY b.name
    `, [anchor, anchor, ...bankParams]);

    const totalSpend = parseFloat(totals[0]?.total_spend || 0);
    const totalIncome = parseFloat(totals[0]?.total_income || 0);
    const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalSpend) / totalIncome) * 100) : 0;

    res.status(200).json({
      total_spend: totalSpend,
      total_income: totalIncome,
      savings_rate: savingsRate,
      by_category: byCategory,
      by_bank: byBank,
      window_end: anchor,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
