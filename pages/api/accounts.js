import { query } from "../../lib/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const accounts = await query(`
        SELECT a.id, a.account_number_masked, a.account_type, b.name AS bank
        FROM accounts a
        JOIN banks b ON a.bank_id = b.id
        ORDER BY b.name
      `);
      return res.status(200).json(accounts);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "POST") {
    const { bank, account_number_last4, account_type } = req.body || {};
    if (!bank || !account_number_last4) {
      return res.status(400).json({ error: "bank and account_number_last4 are required" });
    }
    if (!/^\d{4}$/.test(account_number_last4)) {
      return res.status(400).json({ error: "account_number_last4 must be exactly 4 digits" });
    }
    try {
      const banks = await query(`SELECT id FROM banks WHERE name = ?`, [bank]);
      if (!banks.length) {
        return res.status(400).json({ error: `Unknown bank: ${bank}` });
      }
      const masked = `XXXX${account_number_last4}`;
      const result = await query(
        `INSERT INTO accounts (bank_id, account_number_masked, account_type) VALUES (?, ?, ?)`,
        [banks[0].id, masked, account_type || "savings"]
      );
      return res.status(201).json({ id: result.insertId, bank, account_number_masked: masked, account_type: account_type || "savings" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).json({ error: "Method not allowed" });
}
