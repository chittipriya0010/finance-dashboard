import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import BankTag from "../components/BankTag";
import UploadModal from "../components/UploadModal";
import AccountModal from "../components/AccountModal";

const COLORS = ["#3F5E4F", "#B4592F", "#8A4FA3", "#2E5C8A", "#C7A008", "#5A6670"];

// Mock data so the dashboard is demo-able before any statements are uploaded.
const MOCK_SUMMARY = {
  total_spend: 68450,
  total_income: 95000,
  savings_rate: 28,
  by_category: [
    { category: "Housing", total: 22000 },
    { category: "Food Delivery", total: 8400 },
    { category: "Shopping", total: 7200 },
    { category: "Utilities", total: 6100 },
    { category: "Transport", total: 4300 },
    { category: "Entertainment", total: 2450 },
    { category: "Uncategorized", total: 18000 },
  ],
  by_bank: [
    { bank: "SBI", total: 21000 },
    { bank: "HDFC", total: 24500 },
    { bank: "ICICI", total: 12950 },
    { bank: "Axis", total: 10000 },
  ],
};

const MOCK_RECURRING = {
  subscriptions: [
    { merchant: "NETFLIX", avg_amount: 649, interval: "monthly", occurrences: 6, confidence: 0.94, category: "Entertainment" },
    { merchant: "SPOTIFY", avg_amount: 119, interval: "monthly", occurrences: 8, confidence: 0.91, category: "Entertainment" },
    { merchant: "CULT FIT", avg_amount: 1499, interval: "monthly", occurrences: 4, confidence: 0.78, category: "Health" },
    { merchant: "AMAZON PRIME", avg_amount: 1499, interval: "yearly", occurrences: 2, confidence: 0.65, category: "Shopping" },
  ],
  bills: [
    { merchant: "AIRTEL BROADBAND", avg_amount: 999, interval: "monthly", occurrences: 7, confidence: 0.89, category: "Utilities" },
    { merchant: "BESCOM ELECTRICITY", avg_amount: 2350, interval: "monthly", occurrences: 6, confidence: 0.72, category: "Utilities" },
    { merchant: "HOME LOAN EMI", avg_amount: 18500, interval: "monthly", occurrences: 9, confidence: 0.97, category: "Loan/EMI" },
  ],
  monthly_subscription_cost: 2267,
  monthly_bill_cost: 21849,
};

const BANKS = ["All", "SBI", "HDFC", "ICICI", "Axis"];
const TABS = ["Spending", "Subscriptions", "Bills", "Savings"];

export default function Dashboard() {
  const [tab, setTab] = useState("Spending");
  const [selectedBank, setSelectedBank] = useState("All");
  const [summary, setSummary] = useState(MOCK_SUMMARY);
  const [recurring, setRecurring] = useState(MOCK_RECURRING);
  const [isLive, setIsLive] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  const loadData = (bank = selectedBank) => {
    const bankQuery = bank && bank !== "All" ? `?bank=${encodeURIComponent(bank)}` : "";
    fetch(`/api/dashboard/summary${bankQuery}`)
      .then(r => r.json())
      .then(d => {
        if (d.by_category?.length || bank !== "All") {
          setSummary(d.by_category ? d : { ...d, by_category: [], by_bank: [] });
          setIsLive(true);
        }
      })
      .catch(() => {});
    fetch(`/api/dashboard/recurring${bankQuery}`)
      .then(r => r.json())
      .then(d => {
        if (d.subscriptions || d.bills) setRecurring(d);
      })
      .catch(() => {});
  };

  useEffect(() => { loadData(selectedBank); }, [selectedBank]);

  return (
    <div className="min-h-screen bg-paper font-body">
      <header className="border-b border-line px-8 py-6 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-slate mb-1">Cross-Bank Overview</p>
          <h1 className="font-display text-3xl text-ink">One ledger, four banks.</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-slate">
            <span className={`w-2 h-2 rounded-full ${isLive ? "bg-moss" : "bg-clay"}`} />
            {isLive ? "Live data" : "Sample data — upload a statement to replace"}
          </div>
          <button
            onClick={() => setAccountModalOpen(true)}
            className="px-4 py-2 rounded-lg border border-line text-sm font-medium text-ink hover:bg-white"
          >
            Accounts
          </button>
          <button
            onClick={() => setUploadOpen(true)}
            className="px-4 py-2 rounded-lg bg-ink text-paper text-sm font-medium hover:bg-ink/90"
          >
            Upload statement
          </button>
        </div>
      </header>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => loadData(selectedBank)}
        onAddAccount={() => { setUploadOpen(false); setAccountModalOpen(true); }}
      />
      <AccountModal
        open={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        onAccountAdded={() => {}}
      />

      <div className="flex items-center gap-2 px-8 pt-5">
        <span className="text-[11px] font-mono uppercase tracking-wide text-slate mr-1">Bank</span>
        {BANKS.map(b => (
          <button
            key={b}
            onClick={() => setSelectedBank(b)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              selectedBank === b
                ? "bg-ink text-paper border-ink"
                : "bg-transparent text-slate border-line hover:text-ink hover:border-ink"
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      <nav className="flex gap-1 px-8 pt-4">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              tab === t ? "border-clay text-ink" : "border-transparent text-slate hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      <main className="px-8 py-8 max-w-6xl">
        {tab === "Spending" && <SpendingTab summary={summary} />}
        {tab === "Subscriptions" && <RecurringList items={recurring.subscriptions} monthlyCost={recurring.monthly_subscription_cost} kind="subscription" />}
        {tab === "Bills" && <RecurringList items={recurring.bills} monthlyCost={recurring.monthly_bill_cost} kind="bill" />}
        {tab === "Savings" && <SavingsTab summary={summary} />}
      </main>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="border border-line rounded-xl px-5 py-4 bg-white/50">
      <p className="text-[11px] font-mono uppercase tracking-wide text-slate mb-1">{label}</p>
      <p className="font-display text-2xl" style={{ color: accent || "#12181B" }}>{value}</p>
    </div>
  );
}

function SpendingTab({ summary }) {
  const hasData = summary.by_category?.length > 0;
  const windowLabel = summary.window_end
    ? `30 days ending ${new Date(summary.window_end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
    : "last 30 days";
  if (!hasData) {
    return (
      <div className="border border-line rounded-xl p-10 text-center bg-white/50">
        <p className="text-sm text-slate">No transactions for this bank yet. Upload a statement to see it here.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-3 grid grid-cols-3 gap-4 mb-2">
        <StatCard label={`Spent, ${windowLabel}`} value={`₹${summary.total_spend.toLocaleString("en-IN")}`} accent="#B4592F" />
        <StatCard label={`Income, ${windowLabel}`} value={`₹${summary.total_income.toLocaleString("en-IN")}`} accent="#3F5E4F" />
        <StatCard label="Savings rate" value={`${summary.savings_rate}%`} accent="#2E5C8A" />
      </div>

      <div className="col-span-2 border border-line rounded-xl p-5 bg-white/50">
        <h3 className="font-display text-lg mb-4">Spend by category</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={summary.by_category} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DEDAD0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fontFamily: "IBM Plex Mono" }} />
            <YAxis dataKey="category" type="category" width={110} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`} />
            <Bar dataKey="total" radius={[0, 4, 4, 0]}>
              {summary.by_category.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="border border-line rounded-xl p-5 bg-white/50">
        <h3 className="font-display text-lg mb-4">By bank</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={summary.by_bank} dataKey="total" nameKey="bank" innerRadius={45} outerRadius={80} paddingAngle={3}>
              {summary.by_bank.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-2 mt-2">
          {summary.by_bank.map(b => (
            <div key={b.bank} className="flex justify-between items-center text-sm">
              <BankTag bank={b.bank} />
              <span className="font-mono text-slate">₹{Number(b.total).toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecurringList({ items, monthlyCost, kind }) {
  return (
    <div>
      <div className="mb-6">
        <p className="text-[11px] font-mono uppercase tracking-wide text-slate mb-1">
          Monthly {kind === "subscription" ? "subscription" : "bill"} cost
        </p>
        <p className="font-display text-3xl text-clay">₹{Math.round(monthlyCost || 0).toLocaleString("en-IN")}</p>
      </div>
      <div className="border border-line rounded-xl overflow-hidden bg-white/50">
        {items.length === 0 && (
          <p className="p-6 text-sm text-slate">No {kind}s detected yet — upload more statement history to improve detection.</p>
        )}
        {items.map((item, i) => (
          <div key={i} className={`flex items-center justify-between px-5 py-4 ${i !== items.length - 1 ? "border-b border-line" : ""}`}>
            <div>
              <p className="font-medium text-ink">{item.merchant}</p>
              <p className="text-xs text-slate font-mono">{item.category} · {item.interval} · {item.occurrences}x seen</p>
            </div>
            <div className="flex items-center gap-4">
              <ConfidenceBar value={item.confidence} />
              <p className="font-mono text-sm w-20 text-right">₹{item.avg_amount.toLocaleString("en-IN")}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100);
  const color = value > 0.75 ? "#3F5E4F" : value > 0.5 ? "#C7A008" : "#B4592F";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-line overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] font-mono text-slate w-8">{pct}%</span>
    </div>
  );
}

function SavingsTab({ summary }) {
  const savedAmount = summary.total_income - summary.total_spend;
  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-1 border border-line rounded-xl p-6 bg-white/50 flex flex-col items-center justify-center text-center">
        <p className="text-[11px] font-mono uppercase tracking-wide text-slate mb-2">This month</p>
        <p className="font-display text-5xl text-moss mb-1">{summary.savings_rate}%</p>
        <p className="text-sm text-slate">saved of income</p>
      </div>
      <div className="col-span-2 border border-line rounded-xl p-6 bg-white/50 flex flex-col justify-center">
        <p className="text-[11px] font-mono uppercase tracking-wide text-slate mb-2">Amount set aside</p>
        <p className="font-display text-3xl text-ink mb-4">₹{savedAmount.toLocaleString("en-IN")}</p>
        <p className="text-sm text-slate leading-relaxed">
          Income minus spend across all four banks, last 30 days. Savings rate improves as
          recurring bills and subscriptions get trimmed — check the Bills and Subscriptions
          tabs for the biggest opportunities.
        </p>
      </div>
    </div>
  );
}
