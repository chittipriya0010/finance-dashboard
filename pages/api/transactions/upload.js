import Papa from "papaparse";
import formidable from "formidable";
import fs from "fs";
import { BANK_FORMATS } from "../../../lib/parsers/bankFormats";
import { normalizeMerchant, categorize } from "../../../lib/parsers/normalize";
import { query } from "../../../lib/db";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const form = formidable({});
  const [fields, files] = await form.parse(req);
  const bank = (fields.bank?.[0] || "").toUpperCase();
  const accountId = fields.account_id?.[0];

  if (!BANK_FORMATS[bank]) {
    return res.status(400).json({ error: `Unsupported bank. Use one of: ${Object.keys(BANK_FORMATS).join(", ")}` });
  }
  if (!accountId) {
    return res.status(400).json({ error: "account_id is required" });
  }

  const file = files.file?.[0];
  const csvText = fs.readFileSync(file.filepath, "utf8");
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });

  const mapper = BANK_FORMATS[bank].map;
  let inserted = 0;
  let skipped = 0;

  for (const row of parsed.data) {
    const mapped = mapper(row);
    if (!mapped.date || (mapped.debit === 0 && mapped.credit === 0)) {
      skipped++;
      continue;
    }
    const amount = mapped.debit > 0 ? mapped.debit : mapped.credit;
    const txn_type = mapped.debit > 0 ? "debit" : "credit";
    const merchant = normalizeMerchant(mapped.description);
    const { category } = categorize(mapped.description);

    await query(
      `INSERT INTO transactions (account_id, txn_date, amount, txn_type, raw_description, merchant_normalized, category)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [accountId, mapped.date, amount, txn_type, mapped.description, merchant, category]
    );
    inserted++;
  }

  res.status(200).json({ bank, inserted, skipped, total_rows: parsed.data.length });
}
