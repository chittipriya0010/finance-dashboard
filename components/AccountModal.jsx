import { useState, useEffect } from "react";
import BankTag from "./BankTag";

const BANKS = ["SBI", "HDFC", "ICICI", "Axis"];
const ACCOUNT_TYPES = ["savings", "current", "credit_card"];

export default function AccountModal({ open, onClose, onAccountAdded }) {
  const [accounts, setAccounts] = useState([]);
  const [bank, setBank] = useState(BANKS[0]);
  const [last4, setLast4] = useState("");
  const [accountType, setAccountType] = useState("savings");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadAccounts = () => {
    fetch("/api/accounts").then(r => r.json()).then(d => setAccounts(Array.isArray(d) ? d : []));
  };

  useEffect(() => { if (open) loadAccounts(); }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bank, account_number_last4: last4, account_type: accountType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add account");
      setLast4("");
      loadAccounts();
      onAccountAdded?.();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="bg-paper border border-line rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl text-ink">Accounts</h2>
          <button onClick={onClose} className="text-slate hover:text-ink text-sm">✕</button>
        </div>

        {accounts.length > 0 && (
          <div className="border border-line rounded-xl overflow-hidden mb-5 bg-white/50">
            {accounts.map((a, i) => (
              <div key={a.id} className={`flex items-center justify-between px-4 py-2.5 ${i !== accounts.length - 1 ? "border-b border-line" : ""}`}>
                <BankTag bank={a.bank} />
                <span className="text-xs font-mono text-slate">{a.account_type} · ••••{(a.account_number_masked || "").slice(-4)}</span>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="block text-[11px] font-mono uppercase tracking-wide text-slate mb-2">Add an account</label>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <select
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="border border-line rounded-lg px-3 py-2 bg-white text-sm"
            >
              {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              className="border border-line rounded-lg px-3 py-2 bg-white text-sm"
            >
              {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
            </select>
          </div>

          <label className="block text-[11px] font-mono uppercase tracking-wide text-slate mb-2">
            Last 4 digits of account number
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={last4}
            onChange={(e) => setLast4(e.target.value.replace(/\D/g, ""))}
            placeholder="1234"
            className="w-full border border-line rounded-lg px-3 py-2 mb-1 bg-white text-sm font-mono"
          />
          <p className="text-[11px] text-slate mb-4">We only store the last 4 digits — never the full account number.</p>

          {errorMsg && <p className="text-sm text-clay mb-3">{errorMsg}</p>}

          <button
            type="submit"
            disabled={submitting || last4.length !== 4}
            className="w-full px-4 py-2 rounded-lg bg-moss text-paper text-sm font-medium hover:bg-moss/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Adding…" : "Add account"}
          </button>
        </form>
      </div>
    </div>
  );
}
