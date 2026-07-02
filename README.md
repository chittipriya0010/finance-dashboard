# Cross-Bank Personal Finance Dashboard

One view of spending, subscriptions, recurring bills, and savings across SBI, HDFC, ICICI, and Axis.

## Stack
- Next.js (Pages Router, API routes double as the backend — no separate Node server needed)
- MySQL via `mysql2`
- Recharts for visualizations
- Tailwind for styling

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create the database (skip if you already ran this):
   ```
   mysql -u root -p < schema.sql
   ```

3. Copy env file and fill in your MySQL credentials:
   ```
   cp .env.example .env.local
   ```

4. Run the dev server:
   ```
   npm run dev
   ```
   Open http://localhost:3000 — the dashboard loads with sample data until you upload real statements.

5. Click **Accounts** in the header to add one account per bank (SBI/HDFC/ICICI/Axis) — you just pick the bank and enter the last 4 digits of the account number. Only the last 4 digits are ever stored.

## Uploading a bank statement

POST a CSV to `/api/transactions/upload` as `multipart/form-data`:
- `file`: the CSV export from your bank
- `bank`: one of `SBI`, `HDFC`, `ICICI`, `AXIS`
- `account_id`: the numeric id from the `accounts` table

```bash
curl -X POST http://localhost:3000/api/transactions/upload \
  -F "file=@hdfc_statement.csv" \
  -F "bank=HDFC" \
  -F "account_id=2"
```

Each bank formats its CSV differently — column mappings live in `lib/parsers/bankFormats.js`.
If a real export doesn't match, that's the file to edit: add the actual column header names
you see in your exported CSV.

## How recurring detection works

`lib/recurring.js` groups debits by normalized merchant name and similar amount, then checks
whether the gaps between charges cluster around 7/30/90/365 days. Matches get a confidence
score based on regularity and how many times they've recurred — see the code comments for
the exact scoring.

## Path to real bank connectivity

This MVP works from CSV/statement uploads. When you're ready to move beyond that, look at
India's RBI Account Aggregator framework (Setu or Finvu both offer free sandboxes with mock
FIPs simulating SBI/HDFC/ICICI/Axis) — that's the compliant way to pull live data with user
consent, without becoming a licensed FIU yourself in the early stages.
